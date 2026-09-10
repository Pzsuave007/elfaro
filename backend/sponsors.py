"""Patrocinadores: listado público, conteo de clics (CTA) y leads del formulario."""
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from core import db, now_iso, new_id
from auth import require_role

sponsors_router = APIRouter(prefix="/api")

TIER_RANK = {"oro": 0, "plata": 1, "bronce": 2}


def _clean(d: dict) -> dict:
    d.pop("_id", None)
    return d


def _active_now(s: dict) -> bool:
    if not s.get("active", True):
        return False
    today = datetime.now(timezone.utc).date().isoformat()
    if s.get("start_date") and s["start_date"] > today:
        return False
    if s.get("end_date") and s["end_date"] < today:
        return False
    return True


@sponsors_router.get("/public/sponsors")
async def public_sponsors():
    docs = await db.sponsors.find({}).to_list(500)
    docs = [_clean(d) for d in docs if _active_now(d)]
    docs.sort(key=lambda s: (TIER_RANK.get((s.get("tier") or "bronce").lower(), 3), s.get("order", 0), s.get("title", "")))
    return {"items": docs}


@sponsors_router.post("/public/sponsors/{sponsor_id}/click")
async def track_click(sponsor_id: str, type: str = "website"):
    field = {"call": "click_call", "directions": "click_directions", "website": "click_website"}.get(type)
    if not field:
        raise HTTPException(status_code=400, detail="Tipo de clic no válido")
    await db.sponsors.update_one({"id": sponsor_id}, {"$inc": {field: 1}})
    return {"ok": True}


@sponsors_router.post("/public/sponsor-leads")
async def create_lead(payload: Dict[str, Any]):
    lead = {
        "id": new_id(),
        "name": (payload.get("name") or "").strip(),
        "business": (payload.get("business") or "").strip(),
        "email": (payload.get("email") or "").strip(),
        "phone": (payload.get("phone") or "").strip(),
        "message": (payload.get("message") or "").strip(),
        "status": "new",
        "created_at": now_iso(),
    }
    if not lead["name"] or not (lead["email"] or lead["phone"]):
        raise HTTPException(status_code=400, detail="Nombre y (email o teléfono) son obligatorios")
    await db.sponsor_leads.insert_one(lead)
    return {"ok": True}


@sponsors_router.get("/admin/sponsor-leads")
async def list_leads(user: dict = Depends(require_role("editor"))):
    docs = await db.sponsor_leads.find({}).sort("created_at", -1).to_list(1000)
    return {"items": [_clean(d) for d in docs]}
