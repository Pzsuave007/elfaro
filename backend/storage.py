"""Emergent Object Storage + Media Library."""
import os
import io
import uuid
import requests
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Response, Query, Header

from core import db, now_iso, new_id, clean
from auth import get_current_user, get_jwt_secret
import jwt

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "elforo-oregon"

storage_key = None

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif",
    "webp": "image/webp", "pdf": "application/pdf", "mp4": "video/mp4",
    "mov": "video/quicktime", "csv": "text/csv", "txt": "text/plain",
}

media_router = APIRouter(prefix="/api/media", tags=["media"])


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def compress_image(data: bytes, max_width: int = 1600, quality: int = 82):
    """Comprime a WebP (mucho más liviano). Devuelve (bytes, content_type, ext). Si falla, deja el original."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode == "P":
            img = img.convert("RGBA")
        elif img.mode in ("CMYK", "L", "LA"):
            img = img.convert("RGB")
        if img.width > max_width:
            new_h = int(img.height * (max_width / img.width))
            img = img.resize((max_width, new_h), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=quality, method=6)
        return buf.getvalue(), "image/webp", "webp"
    except Exception:
        return data, None, None


@media_router.post("")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    data = await file.read()
    # Comprime imágenes (excepto GIF animado) a WebP para que carguen rápido.
    if content_type.startswith("image") and ext != "gif":
        c_data, c_type, c_ext = compress_image(data)
        if c_type:
            data, content_type, ext = c_data, c_type, c_ext
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, content_type)
    doc = {
        "id": new_id(), "storage_path": result["path"], "original_filename": file.filename,
        "content_type": content_type, "size": result.get("size", len(data)),
        "kind": "video" if content_type.startswith("video") else ("pdf" if ext == "pdf" else "image"),
        "uploaded_by": user["id"], "is_deleted": False, "created_at": now_iso(),
    }
    await db.media.insert_one(doc)
    out = clean(dict(doc))
    out["url"] = f"/api/media/file/{result['path']}"
    return out


@media_router.post("/optimize-existing")
async def optimize_existing(user: dict = Depends(get_current_user)):
    """Recomprime a WebP las imágenes ya guardadas (mismo path, sin romper enlaces)."""
    if user.get("role") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="No autorizado")
    docs = await db.media.find({"kind": "image", "content_type": {"$ne": "image/webp"}}).to_list(5000)
    optimized = skipped = failed = 0
    bytes_before = bytes_after = 0
    for d in docs:
        path = d.get("storage_path")
        if not path:
            skipped += 1
            continue
        try:
            data, _ct = get_object(path)
            c_data, c_type, _ext = compress_image(data)
            if not c_type or len(c_data) >= len(data):
                skipped += 1
                continue
            put_object(path, c_data, "image/webp")
            await db.media.update_one({"id": d["id"]}, {"$set": {"content_type": "image/webp", "size": len(c_data)}})
            bytes_before += len(data)
            bytes_after += len(c_data)
            optimized += 1
        except Exception:
            failed += 1
    return {"optimized": optimized, "skipped": skipped, "failed": failed,
            "mb_before": round(bytes_before / 1048576, 2), "mb_after": round(bytes_after / 1048576, 2)}


@media_router.get("/list")
async def list_media(user: dict = Depends(get_current_user)):
    items = await db.media.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for it in items:
        it["url"] = f"/api/media/file/{it['storage_path']}"
    return items


@media_router.delete("/{media_id}")
async def delete_media(media_id: str, user: dict = Depends(get_current_user)):
    await db.media.update_one({"id": media_id}, {"$set": {"is_deleted": True}})
    return {"ok": True}


@media_router.get("/file/{path:path}")
async def serve_file(path: str, auth: str = Query(None), authorization: str = Header(None)):
    # Public read of media (files are already curated for public site). Auth optional.
    record = await db.media.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type),
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})
