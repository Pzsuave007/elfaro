"""Elecciones: elections, races, candidates, questions, answers."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any, List

from core import db, now_iso, new_id, clean, slugify, RACE_TYPES
from auth import get_current_user, require_role

elections_router = APIRouter(prefix="/api", tags=["elections"])


# ---------- Public ----------
@elections_router.get("/public/elections")
async def public_elections():
    return await db.elections.find({}, {"_id": 0}).sort("date", -1).to_list(100)


@elections_router.get("/public/races")
async def public_races(election_id: Optional[str] = None):
    q = {}
    if election_id:
        q["election_id"] = election_id
    races = await db.races.find(q, {"_id": 0}).to_list(200)
    for r in races:
        r["candidate_count"] = await db.candidates.count_documents({"race_id": r["id"]})
    return races


@elections_router.get("/public/races/{race_id}")
async def public_race_detail(race_id: str):
    race = await db.races.find_one({"id": race_id}, {"_id": 0})
    if not race:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    candidates = await db.candidates.find({"race_id": race_id}, {"_id": 0}).to_list(100)
    election = await db.elections.find_one({"id": race.get("election_id")}, {"_id": 0})
    return {"race": race, "candidates": candidates, "election": election}


@elections_router.get("/public/candidates/{candidate_id}")
async def public_candidate(candidate_id: str):
    c = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")
    race = await db.races.find_one({"id": c.get("race_id")}, {"_id": 0})
    c["race"] = race
    return c


# ---------- Admin: Elections ----------
@elections_router.get("/admin/elections")
async def admin_elections(user: dict = Depends(get_current_user)):
    return await db.elections.find({}, {"_id": 0}).sort("date", -1).to_list(100)


@elections_router.post("/admin/elections")
async def create_election(payload: Dict[str, Any], user: dict = Depends(require_role("editor"))):
    payload.pop("_id", None); payload.pop("id", None)
    doc = {**payload, "id": new_id(), "created_at": now_iso()}
    await db.elections.insert_one(doc)
    return clean(dict(doc))


@elections_router.put("/admin/elections/{eid}")
async def update_election(eid: str, payload: Dict[str, Any], user: dict = Depends(require_role("editor"))):
    payload.pop("_id", None); payload.pop("id", None)
    await db.elections.update_one({"id": eid}, {"$set": payload})
    return await db.elections.find_one({"id": eid}, {"_id": 0})


@elections_router.delete("/admin/elections/{eid}")
async def delete_election(eid: str, user: dict = Depends(require_role("editor"))):
    await db.elections.delete_one({"id": eid})
    races = await db.races.find({"election_id": eid}).to_list(500)
    for r in races:
        await db.candidates.delete_many({"race_id": r["id"]})
    await db.races.delete_many({"election_id": eid})
    return {"ok": True}


# ---------- Admin: Races ----------
@elections_router.get("/admin/races")
async def admin_races(election_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    q = {}
    if election_id:
        q["election_id"] = election_id
    races = await db.races.find(q, {"_id": 0}).to_list(500)
    for r in races:
        r["candidate_count"] = await db.candidates.count_documents({"race_id": r["id"]})
    return races


@elections_router.get("/admin/races/{rid}")
async def admin_race_get(rid: str, user: dict = Depends(get_current_user)):
    race = await db.races.find_one({"id": rid}, {"_id": 0})
    if not race:
        raise HTTPException(status_code=404, detail="No encontrado")
    race["candidates"] = await db.candidates.find({"race_id": rid}, {"_id": 0}).to_list(100)
    return race


@elections_router.post("/admin/races")
async def create_race(payload: Dict[str, Any], user: dict = Depends(require_role("editor"))):
    payload.pop("_id", None); payload.pop("id", None)
    doc = {**payload, "id": new_id(), "questions": payload.get("questions", []), "created_at": now_iso()}
    await db.races.insert_one(doc)
    return clean(dict(doc))


@elections_router.put("/admin/races/{rid}")
async def update_race(rid: str, payload: Dict[str, Any], user: dict = Depends(require_role("editor"))):
    payload.pop("_id", None); payload.pop("id", None)
    await db.races.update_one({"id": rid}, {"$set": payload})
    return await db.races.find_one({"id": rid}, {"_id": 0})


@elections_router.delete("/admin/races/{rid}")
async def delete_race(rid: str, user: dict = Depends(require_role("editor"))):
    await db.races.delete_one({"id": rid})
    await db.candidates.delete_many({"race_id": rid})
    return {"ok": True}


# ---------- Questions (El Faro Pregunta) applied to whole race ----------
@elections_router.put("/admin/races/{rid}/questions")
async def set_questions(rid: str, payload: Dict[str, Any], user: dict = Depends(require_role("editor"))):
    """payload: {questions: ["texto", ...]} -> stored with ids, applied to all candidates."""
    texts: List[str] = payload.get("questions", [])
    race = await db.races.find_one({"id": rid})
    if not race:
        raise HTTPException(status_code=404, detail="No encontrado")
    existing = {qq["text"]: qq["id"] for qq in race.get("questions", [])}
    questions = [{"id": existing.get(t, new_id()), "text": t} for t in texts if t.strip()]
    await db.races.update_one({"id": rid}, {"$set": {"questions": questions}})
    return {"questions": questions}


# ---------- Admin: Candidates ----------
@elections_router.get("/admin/candidates/{cid}")
async def admin_candidate_get(cid: str, user: dict = Depends(get_current_user)):
    c = await db.candidates.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="No encontrado")
    return c


@elections_router.post("/admin/candidates")
async def create_candidate(payload: Dict[str, Any], user: dict = Depends(require_role("writer"))):
    payload.pop("_id", None); payload.pop("id", None)
    doc = {
        **payload, "id": new_id(),
        "answers": payload.get("answers", {}),
        "priorities": payload.get("priorities", []),
        "proposals": payload.get("proposals", []),
        "socials": payload.get("socials", {}),
        "sources": payload.get("sources", []),
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.candidates.insert_one(doc)
    return clean(dict(doc))


@elections_router.put("/admin/candidates/{cid}")
async def update_candidate(cid: str, payload: Dict[str, Any], user: dict = Depends(require_role("writer"))):
    payload.pop("_id", None); payload.pop("id", None)
    payload["updated_at"] = now_iso()
    await db.candidates.update_one({"id": cid}, {"$set": payload})
    return await db.candidates.find_one({"id": cid}, {"_id": 0})


@elections_router.delete("/admin/candidates/{cid}")
async def delete_candidate(cid: str, user: dict = Depends(require_role("editor"))):
    await db.candidates.delete_one({"id": cid})
    return {"ok": True}


@elections_router.get("/config/races")
async def race_config():
    return {"race_types": RACE_TYPES}
