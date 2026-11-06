"""Minimal preview server for the self-contained interactive quest demo.

This intentionally serves only the static playable quest. Payment/account API from
the archived MVP package is not enabled on the public preview.
"""
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).resolve().parent
GAME_FILE = ROOT / "quest-v2" / "index.html"

app = FastAPI(title="Тёмное дело: демо", docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/api/health", include_in_schema=False)
def health():
    return JSONResponse(
        {"status": "ok" if GAME_FILE.is_file() else "missing_game_file", "mode": "interactive-preview"},
        status_code=200 if GAME_FILE.is_file() else 503,
    )


@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
@app.get("/quest-v2/", include_in_schema=False)
@app.get("/quest-v2/index.html", include_in_schema=False)
def game():
    if not GAME_FILE.is_file():
        raise HTTPException(status_code=503, detail="Demo page is missing")
    return FileResponse(GAME_FILE, media_type="text/html; charset=utf-8")
