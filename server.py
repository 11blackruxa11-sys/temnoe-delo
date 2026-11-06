"""Render entrypoint for the archived ТЁМНОЕ ДЕЛО website.

Restore the existing full website from temnoe-site-pack.zip rather than replacing
it with the unrelated quest-v2 standalone page.
"""
from pathlib import Path
import importlib.util
import logging
import os
import sys
import zipfile

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
ARCHIVE = ROOT / "temnoe-site-pack.zip"
RESTORED = ROOT / ".restored-site"
logger = logging.getLogger("temnoe-preview")


def restore():
    if not ARCHIVE.is_file():
        return None
    RESTORED.mkdir(exist_ok=True)
    # Unpack the original, committed website. Do not let the old standalone
    # quest-v2/index.html silently replace the original site.
    with zipfile.ZipFile(ARCHIVE) as z:
        for entry in z.infolist():
            dest = (RESTORED / entry.filename).resolve()
            if not dest.is_relative_to(RESTORED.resolve()):
                raise RuntimeError("Unsafe path in website archive")
        z.extractall(RESTORED)
    servers = sorted(RESTORED.rglob("server.py"), key=lambda p: (len(p.parts), str(p)))
    if servers:
        candidate = servers[0]
        site_root = candidate.parent
        sys.path.insert(0, str(site_root))
        os.chdir(site_root)
        spec = importlib.util.spec_from_file_location("restored_temnoe_server", candidate)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        if hasattr(module, "app"):
            logger.warning("Serving original archived web application: %s", site_root)
            return module.app
    return None


app = restore()
if app is None:
    # If no backend can be found, still prefer the archived site's own pages
    # over the unrelated quest-v2 single-file prototype.
    htmls = sorted(RESTORED.rglob("index.html"), key=lambda p: (len(p.parts), str(p)))
    if not htmls:
        raise RuntimeError("Original website could not be restored from temnoe-site-pack.zip")
    site_root = htmls[0].parent
    logger.warning("Serving archived static website: %s", site_root)
    app = FastAPI(title="Тёмное дело: оригинальная демоверсия")
    @app.get("/api/health", include_in_schema=False)
    def health():
        return {"status": "ok", "mode": "archived-static-preview"}

    app.mount("/", StaticFiles(directory=str(site_root), html=True), name="site")
