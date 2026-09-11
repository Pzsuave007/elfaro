from core import ROOT_DIR  # loads .env first
import os
import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from core import db
from auth import auth_router, seed_admin
from storage import media_router, init_storage
from ai import ai_router
from content import content_router
from sponsors import sponsors_router
from elections import elections_router
from seed_data import seed_demo

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="El Faro In Oregon API")

app.include_router(auth_router)
app.include_router(elections_router)
app.include_router(sponsors_router)
app.include_router(content_router)
app.include_router(ai_router)
app.include_router(media_router)


@app.get("/api/")
async def api_root():
    return {"status": "ok", "service": "El Faro In Oregon"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "El Faro In Oregon"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await seed_admin()
    if os.environ.get("SEED_DEMO", "true").lower() == "true":
        try:
            await seed_demo()
            logger.info("Demo content ready")
        except Exception as e:
            logger.error(f"Seed demo failed: {e}")
    for coll in [db.articles, db.resources, db.oregon_info, db.places]:
        await coll.create_index("slug")
        await coll.create_index("status")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    from core import client
    client.close()
