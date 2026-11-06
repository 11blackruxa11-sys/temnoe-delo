"""Public interactive preview for ТЁМНОЕ ДЕЛО.

Archived previous versions remain unchanged in quest-v2/ and temnoe-site-pack.zip.
Real payments, accounts and author payouts are intentionally disabled in this preview.
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).resolve().parent
SITE = BASE / "site"
INDEX = SITE / "index.html"

app = FastAPI(title="Тёмное дело: интерактивное демо", docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/api/health", include_in_schema=False)
def health():
    return {"status": "ok", "preview": "noir-v17-inspired", "interactive": INDEX.is_file()}


@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
def homepage():
    return FileResponse(INDEX, media_type="text/html")


app.mount("/assets", StaticFiles(directory=str(SITE)), name="assets")
