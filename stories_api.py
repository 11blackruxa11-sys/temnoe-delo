"""ТЁМНОЕ ДЕЛО: moderated public story intake and verified optional payments."""
import os, uuid, json, time, hmac, secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from collections import defaultdict, deque
from typing import Literal
import httpx, psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

DATABASE_URL = os.getenv("DATABASE_URL", "")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")
YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY", "")
WEBSITE = "https://temnoe-delo-logic-v19.onrender.com"
ORIGINS = [WEBSITE, "https://temnoe-delo-stories-api.onrender.com"]
LIMITS = defaultdict(deque)

def db():
    if not DATABASE_URL:
        raise HTTPException(503, "Хранилище заявок пока не настроено")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row, connect_timeout=8)

def schema():
    with db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS story_submissions (
           id UUID PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
           city VARCHAR(90) NOT NULL, title VARCHAR(120) NOT NULL,
           story TEXT NOT NULL, source TEXT NOT NULL DEFAULT '',
           contact VARCHAR(160) NOT NULL, kind VARCHAR(20) NOT NULL,
           status VARCHAR(20) NOT NULL DEFAULT 'pending',
           public_note TEXT NOT NULL DEFAULT '',
           published BOOLEAN NOT NULL DEFAULT FALSE,
           payment_id VARCHAR(120), payment_status VARCHAR(20) NOT NULL DEFAULT 'none'
        )""")
        con.execute("""CREATE TABLE IF NOT EXISTS paid_orders(
            id UUID PRIMARY KEY, story_id UUID, product VARCHAR(25) NOT NULL,
            amount_kopeks INTEGER NOT NULL, payer_contact VARCHAR(160) NOT NULL DEFAULT '',
            payment_id VARCHAR(120) UNIQUE, status VARCHAR(30) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )""")
        con.execute("CREATE INDEX IF NOT EXISTS idx_submission_status ON story_submissions(status, created_at DESC)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_orders_payment ON paid_orders(payment_id)")
        con.commit()

@asynccontextmanager
async def lifespan(app):
    if DATABASE_URL:
        schema()
    yield

app=FastAPI(title="Тёмное дело / заявки",docs_url=None,redoc_url=None,openapi_url=None,lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=ORIGINS,allow_credentials=False,allow_methods=["GET","POST","PATCH"],allow_headers=["Content-Type","X-Admin-Token"])

class Submission(BaseModel):
    city: str = Field(min_length=2,max_length=90)
    storyTitle: str = Field(min_length=3,max_length=120)
    storyBody: str = Field(min_length=80,max_length=6000)
    source: str = Field(default="",max_length=900)
    contact: str = Field(min_length=3,max_length=160)
    submissionType: Literal["idea","creation"]
    consent: bool
    website: str = Field(default="",max_length=160)
    @field_validator("city","storyTitle","storyBody","contact")
    @classmethod
    def no_empty(cls,value):
        if not value.strip(): raise ValueError("Пустое поле")
        return value.strip()

class Decision(BaseModel):
    status: Literal["approved","rejected","pending"]
    published: bool = False
    public_note: str = Field(default="",max_length=500)

class OrderRequest(BaseModel):
    product: Literal["quest","creation"]
    story_id: str|None = None
    contact: str = Field(default="",max_length=160)

def admin(x_admin_token):
    if not ADMIN_TOKEN or not x_admin_token or not hmac.compare_digest(x_admin_token,ADMIN_TOKEN):
        raise HTTPException(401,"Доступ к архиву редактора закрыт")

def rate_limit(req):
    ip=req.headers.get("x-forwarded-for",req.client.host if req.client else "")[:80].split(",")[0]
    now=time.time()
    q=LIMITS[ip]
    while q and now-q[0]>3600:q.popleft()
    if len(q)>=5:raise HTTPException(429,"Не больше пяти заявок в час")
    q.append(now)

@app.get("/api/health")
def health():
    return {"status":"ok","database":bool(DATABASE_URL),"payments_ready":bool(YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY)}

@app.post("/api/stories",status_code=201)
def submit(payload: Submission,request:Request):
    rate_limit(request)
    # honeypot field must remain empty
    if payload.website: return {"ok":True,"status":"received"}
    if not payload.consent: raise HTTPException(400,"Подтверди согласие")
    sid=str(uuid.uuid4())
    with db() as con:
        con.execute("""INSERT INTO story_submissions
            (id,city,title,story,source,contact,kind)
            VALUES(%s,%s,%s,%s,%s,%s,%s)""",
            (sid,payload.city,payload.storyTitle,payload.storyBody,payload.source,payload.contact,payload.submissionType))
        con.commit()
    return {"ok":True,"id":sid,"status":"pending","message":"Заявка принята в архив и ожидает рассмотрения."}

@app.get("/api/admin/stories")
def pending(x_admin_token:str|None=Header(default=None),status:str="all"):
    admin(x_admin_token)
    with db() as con:
        if status in ["pending","approved","rejected"]:
            rows=con.execute("SELECT * FROM story_submissions WHERE status=%s ORDER BY created_at DESC LIMIT 200",(status,)).fetchall()
        else:
            rows=con.execute("SELECT * FROM story_submissions ORDER BY created_at DESC LIMIT 200").fetchall()
    return {"stories":rows}

@app.patch("/api/admin/stories/{story_id}")
def review(story_id:uuid.UUID,payload:Decision,x_admin_token:str|None=Header(default=None)):
    admin(x_admin_token)
    if payload.published and payload.status!="approved":raise HTTPException(400,"Публиковать можно только одобренные истории")
    with db() as con:
        row=con.execute("""UPDATE story_submissions SET status=%s,published=%s,public_note=%s
                           WHERE id=%s RETURNING id,status,published""",
                        (payload.status,payload.published,payload.public_note,str(story_id))).fetchone()
        if not row:raise HTTPException(404,"Заявка не найдена")
        con.commit()
    return row

@app.get("/api/quests")
def published_quests():
    with db() as con:
        rows=con.execute("""SELECT id,city,title,public_note,created_at FROM story_submissions
                            WHERE status='approved' AND published=TRUE ORDER BY created_at DESC LIMIT 100""").fetchall()
    # The first pilot remains free while the paid checkout is being configured.
    return {"pilot":{"id":"novorossiysk-001","city":"Новороссийск","title":"Невеста Семи ветров","price_rub":0,"url":WEBSITE+"/#game"},
            "published":[{**r,"price_rub":499} for r in rows]}

def ready_payments():
    if not (YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY):
        raise HTTPException(503,"Платёжный провайдер пока не подключён")

@app.post("/api/orders")
async def create_order(payload:OrderRequest):
    ready_payments()
    if not payload.story_id:raise HTTPException(422,"Укажи историю")
    try:sid=uuid.UUID(payload.story_id)
    except:raise HTTPException(422,"Некорректный идентификатор")
    with db() as con:
        row=con.execute("SELECT kind,status,published FROM story_submissions WHERE id=%s",(str(sid),)).fetchone()
    if not row:raise HTTPException(404,"История не найдена")
    if payload.product=="quest" and not(row["status"]=="approved" and row["published"]):
        raise HTTPException(409,"Квест ещё не опубликован")
    if payload.product=="creation" and not(row["status"]=="approved" and row["kind"]=="creation"):
        raise HTTPException(409,"Сначала требуется согласовать заявку на создание")
    amount=49900 if payload.product=="quest" else 99900
    oid=str(uuid.uuid4())
    payment={"amount":{"value":f"{Decimal(amount)/100:.2f}","currency":"RUB"},
             "capture":True,"confirmation":{"type":"redirect","return_url":WEBSITE+"/#cases"},
             "description":("Квест Тёмное дело" if payload.product=="quest" else "Создание квеста Тёмное дело")[:100],
             "metadata":{"order_id":oid,"story_id":str(sid)}}
    async with httpx.AsyncClient(timeout=15) as c:
        resp=await c.post("https://api.yookassa.ru/v3/payments",json=payment,
              auth=(YOOKASSA_SHOP_ID,YOOKASSA_SECRET_KEY),
              headers={"Idempotence-Key":oid})
    if resp.status_code>=400:raise HTTPException(502,"Платёжный провайдер не принял запрос")
    res=resp.json()
    with db() as con:
        con.execute("""INSERT INTO paid_orders(id,story_id,product,amount_kopeks,payer_contact,payment_id)
                       VALUES(%s,%s,%s,%s,%s,%s)""",(oid,str(sid),payload.product,amount,payload.contact,res["id"]))
        con.commit()
    return {"order_id":oid,"status":"pending","checkout_url":res["confirmation"]["confirmation_url"]}

@app.post("/api/payment-webhook")
async def payment_webhook(request:Request):
    ready_payments()
    # Untrusted notification: always verify state with YooKassa using merchant credentials.
    event=await request.json()
    payment_id=str(event.get("object",{}).get("id",""))[:120]
    if not payment_id:return {"ok":True}
    with db() as con:
        row=con.execute("SELECT id,amount_kopeks FROM paid_orders WHERE payment_id=%s",(payment_id,)).fetchone()
    if not row:return {"ok":True}
    async with httpx.AsyncClient(timeout=12) as c:
        res=await c.get("https://api.yookassa.ru/v3/payments/"+payment_id,auth=(YOOKASSA_SHOP_ID,YOOKASSA_SECRET_KEY))
    if res.status_code!=200:raise HTTPException(502,"Не удалось проверить платёж")
    actual=res.json()
    expected=f"{Decimal(row['amount_kopeks'])/100:.2f}"
    if actual.get("amount",{}).get("value")!=expected or actual.get("amount",{}).get("currency")!="RUB":
        raise HTTPException(409,"Не совпадает сумма платежа")
    status=actual.get("status","unknown")
    if status not in ("succeeded","canceled","pending","waiting_for_capture"):status="unknown"
    with db() as con:
        con.execute("UPDATE paid_orders SET status=%s WHERE id=%s",(status,row["id"]))
        con.commit()
    return {"ok":True}

@app.get("/api/admin/orders")
def admin_orders(x_admin_token:str|None=Header(default=None)):
    admin(x_admin_token)
    with db() as con:
        rows=con.execute("SELECT * FROM paid_orders ORDER BY created_at DESC LIMIT 100").fetchall()
    return {"orders":rows}
