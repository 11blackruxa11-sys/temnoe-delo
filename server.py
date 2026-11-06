"""Interactive single-city preview for ТЁМНОЕ ДЕЛО (Novorossiysk).
Full open access; no account, payment or production backend in this demo.
Original site archives remain untouched.
"""
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE=Path(__file__).resolve().parent
SITE=BASE/"site"
app=FastAPI(title="ТЁМНОЕ ДЕЛО: Новороссийск",docs_url=None,redoc_url=None,openapi_url=None)

@app.get("/api/health")
def health():
    ok=(SITE/"index.html").exists() and (SITE/"v16"/"app.js").exists()
    return JSONResponse({"status":"ok" if ok else "missing_files","demo":"novorossiysk-v17","full_access":True},status_code=200 if ok else 503)

app.mount("/",StaticFiles(directory=str(SITE),html=True),name="site")
