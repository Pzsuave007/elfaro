"""Content CRUD (articles, resources, oregon_info, places), taxonomy, search, analytics."""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from core import (db, now_iso, new_id, clean, slugify,
                  ARTICLE_CATEGORIES, ARTICLE_TYPES, RESOURCE_CATEGORIES, OREGON_INFO_CATEGORIES,
                  PLACE_CATEGORIES, SOURCE_TYPES, OREGON_CITIES, OREGON_COUNTIES, WORKFLOW_STATES)
from auth import get_current_user, require_role

content_router = APIRouter(prefix="/api", tags=["content"])

# collection name per content type
COLLECTIONS = {
    "articles": db.articles,
    "resources": db.resources,
    "oregon-info": db.oregon_info,
    "places": db.places,
}


async def _unique_slug(coll, base: str, exclude_id: str = None):
    slug = base
    i = 2
    while True:
        q = {"slug": slug}
        if exclude_id:
            q["id"] = {"$ne": exclude_id}
        if not await coll.find_one(q):
            return slug
        slug = f"{base}-{i}"
        i += 1


def _coll(kind: str):
    if kind not in COLLECTIONS:
        raise HTTPException(status_code=404, detail="Tipo de contenido no válido")
    return COLLECTIONS[kind]


# ---------- Public read ----------
@content_router.get("/public/{kind}")
async def public_list(kind: str, category: Optional[str] = None, categories: Optional[str] = None,
                      city: Optional[str] = None,
                      county: Optional[str] = None, q: Optional[str] = None, tag: Optional[str] = None,
                      type: Optional[str] = None, featured: Optional[bool] = None,
                      limit: int = 50, skip: int = 0):
    coll = _coll(kind)
    query: Dict[str, Any] = {"status": "published"}
    if categories:
        cat_list = [c.strip() for c in categories.split(",") if c.strip()]
        if cat_list:
            query["category"] = {"$in": cat_list}
    elif category:
        query["category"] = category
    if city:
        query["city"] = city
    if county:
        query["county"] = county
    if type:
        query["content_type"] = type
    if tag:
        query["tags"] = tag
    if featured is not None:
        query["featured"] = featured
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"subtitle": {"$regex": q, "$options": "i"}},
            {"summary": {"$regex": q, "$options": "i"}},
            {"body": {"$regex": q, "$options": "i"}},
        ]
    items = await coll.find(query, {"_id": 0}).sort("published_at", -1).skip(skip).limit(min(limit, 100)).to_list(100)
    total = await coll.count_documents(query)
    return {"items": items, "total": total}

@content_router.get("/public/{kind}/facets")
async def facets(kind: str):
    """Counts of published items per category (used to hide empty tabs)."""
    coll = _coll(kind)
    pipeline = [{"$match": {"status": "published"}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    rows = await coll.aggregate(pipeline).to_list(200)
    return {r["_id"]: r["count"] for r in rows if r["_id"]}




@content_router.get("/public/{kind}/{slug}")
async def public_detail(kind: str, slug: str):
    coll = _coll(kind)
    doc = await coll.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No encontrado")
    await coll.update_one({"id": doc["id"]}, {"$inc": {"views": 1}})
    # related by category
    related = await coll.find(
        {"category": doc.get("category"), "status": "published", "id": {"$ne": doc["id"]}},
        {"_id": 0, "id": 1, "slug": 1, "title": 1, "summary": 1, "featured_image": 1, "category": 1, "published_at": 1}
    ).limit(3).to_list(3)
    doc["related"] = related
    return doc


# ---------- Admin CRUD ----------
@content_router.get("/admin/{kind}")
async def admin_list(kind: str, status: Optional[str] = None, category: Optional[str] = None,
                     q: Optional[str] = None, user: dict = Depends(get_current_user)):
    coll = _coll(kind)
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    items = await coll.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return items


@content_router.get("/admin/{kind}/{item_id}")
async def admin_get(kind: str, item_id: str, user: dict = Depends(get_current_user)):
    coll = _coll(kind)
    doc = await coll.find_one({"id": item_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No encontrado")
    return doc


@content_router.post("/admin/{kind}")
async def admin_create(kind: str, payload: Dict[str, Any], user: dict = Depends(require_role("contributor"))):
    coll = _coll(kind)
    payload.pop("_id", None)
    payload.pop("id", None)
    title = payload.get("title", "Sin título")
    base_slug = slugify(payload.get("slug") or title)
    slug = await _unique_slug(coll, base_slug)
    status = payload.get("status", "draft")
    # only editor+ can publish
    from core import ROLE_LEVEL as RL  # local import to avoid confusion
    if status == "published" and RL.get(user["role"], 0) < RL["editor"]:
        status = "needs_review"
    doc = {
        **payload,
        "id": new_id(),
        "slug": slug,
        "status": status,
        "views": 0,
        "author": payload.get("author") or user.get("name"),
        "author_id": user["id"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "published_at": now_iso() if status == "published" else payload.get("published_at"),
    }
    await coll.insert_one(doc)
    return clean(dict(doc))


@content_router.put("/admin/{kind}/{item_id}")
async def admin_update(kind: str, item_id: str, payload: Dict[str, Any], user: dict = Depends(require_role("contributor"))):
    coll = _coll(kind)
    existing = await coll.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="No encontrado")
    payload.pop("_id", None)
    payload.pop("id", None)
    from core import ROLE_LEVEL as RL
    new_status = payload.get("status", existing.get("status"))
    if new_status == "published" and RL.get(user["role"], 0) < RL["editor"]:
        new_status = "needs_review"
    payload["status"] = new_status
    if payload.get("slug"):
        payload["slug"] = await _unique_slug(coll, slugify(payload["slug"]), exclude_id=item_id)
    if new_status == "published" and not existing.get("published_at"):
        payload["published_at"] = now_iso()
    payload["updated_at"] = now_iso()
    await coll.update_one({"id": item_id}, {"$set": payload})
    doc = await coll.find_one({"id": item_id}, {"_id": 0})
    return doc


@content_router.delete("/admin/{kind}/{item_id}")
async def admin_delete(kind: str, item_id: str, user: dict = Depends(require_role("editor"))):
    coll = _coll(kind)
    await coll.delete_one({"id": item_id})
    return {"ok": True}


# ---------- Corrections ----------
class CorrectionInput(BaseModel):
    what_corrected: str
    explanation: str


@content_router.post("/admin/{kind}/{item_id}/corrections")
async def add_correction(kind: str, item_id: str, data: CorrectionInput, user: dict = Depends(require_role("editor"))):
    coll = _coll(kind)
    correction = {"id": new_id(), "date": now_iso(), "what_corrected": data.what_corrected,
                  "explanation": data.explanation, "by": user.get("name")}
    await coll.update_one({"id": item_id}, {"$push": {"corrections": correction}})
    return correction


# ---------- Taxonomy / config ----------
@content_router.get("/config")
async def get_config():
    return {
        "article_categories": ARTICLE_CATEGORIES,
        "article_types": ARTICLE_TYPES,
        "resource_categories": RESOURCE_CATEGORIES,
        "oregon_info_categories": OREGON_INFO_CATEGORIES,
        "place_categories": PLACE_CATEGORIES,
        "source_types": SOURCE_TYPES,
        "cities": OREGON_CITIES,
        "counties": OREGON_COUNTIES,
        "workflow_states": WORKFLOW_STATES,
    }


# ---------- Global search ----------
@content_router.get("/search")
async def global_search(q: str = Query(...), request: Request = None):
    results = {}
    regex = {"$regex": q, "$options": "i"}
    base_q = {"status": "published", "$or": [{"title": regex}, {"summary": regex}, {"subtitle": regex}]}
    for kind, coll in COLLECTIONS.items():
        items = await coll.find(base_q, {"_id": 0, "id": 1, "slug": 1, "title": 1, "summary": 1,
                                         "category": 1, "featured_image": 1}).limit(10).to_list(10)
        results[kind] = items
    # candidates
    cands = await db.candidates.find({"$or": [{"name": regex}, {"position": regex}]},
                                     {"_id": 0, "id": 1, "name": 1, "position": 1, "party": 1,
                                      "photo": 1, "race_id": 1}).limit(10).to_list(10)
    results["candidates"] = cands
    # log search
    if q.strip():
        await db.searches.update_one({"term": q.lower().strip()},
                                     {"$inc": {"count": 1}, "$set": {"last": now_iso()}}, upsert=True)
    return results


# ---------- Analytics ----------
class TrackInput(BaseModel):
    event: str
    path: Optional[str] = ""
    label: Optional[str] = ""
    ref: Optional[str] = ""


@content_router.post("/analytics/track")
async def track(data: TrackInput):
    await db.analytics.insert_one({"id": new_id(), "event": data.event, "path": data.path,
                                   "label": data.label, "ref": data.ref, "ts": now_iso()})
    return {"ok": True}


@content_router.get("/stats/dashboard")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    async def counts(coll):
        return {
            "total": await coll.count_documents({}),
            "published": await coll.count_documents({"status": "published"}),
            "draft": await coll.count_documents({"status": "draft"}),
            "pending": await coll.count_documents({"status": {"$in": ["needs_review", "approved"]}}),
            "scheduled": await coll.count_documents({"status": "scheduled"}),
        }
    articles = await counts(db.articles)
    resources = await counts(db.resources)
    oregon_info = await counts(db.oregon_info)
    places = await counts(db.places)
    candidates = await db.candidates.count_documents({})
    races = await db.races.count_documents({})

    top_articles = await db.articles.find({"status": "published"}, {"_id": 0, "title": 1, "slug": 1, "views": 1}
                                          ).sort("views", -1).limit(5).to_list(5)
    popular_searches = await db.searches.find({}, {"_id": 0, "term": 1, "count": 1}).sort("count", -1).limit(8).to_list(8)
    ai_articles = await db.articles.count_documents({"used_ai": True})
    upcoming = await db.articles.find({"status": "scheduled"}, {"_id": 0, "title": 1, "slug": 1, "published_at": 1}
                                      ).sort("published_at", 1).limit(5).to_list(5)
    total_views = 0
    for coll in COLLECTIONS.values():
        agg = await coll.aggregate([{"$group": {"_id": None, "v": {"$sum": "$views"}}}]).to_list(1)
        total_views += (agg[0]["v"] if agg else 0)

    return {
        "articles": articles, "resources": resources, "oregon_info": oregon_info, "places": places,
        "candidates": candidates, "races": races, "ai_articles": ai_articles,
        "top_articles": top_articles, "popular_searches": popular_searches,
        "upcoming": upcoming, "total_views": total_views,
    }
