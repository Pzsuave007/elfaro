"""Emergent Object Storage + Media Library."""
import os
import uuid
import requests
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


@media_router.post("")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
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
                    headers={"Cache-Control": "public, max-age=86400"})
