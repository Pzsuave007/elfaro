"""Shared core: env, db connection, helpers and constants."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def clean(doc):
    """Strip MongoDB _id so documents are JSON serializable."""
    if doc is None:
        return None
    doc.pop("_id", None)
    return doc


def slugify(text: str) -> str:
    import re
    import unicodedata
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text)
    return text.strip("-") or new_id()[:8]


# --- Role hierarchy ---
ROLES = ["contributor", "writer", "editor", "admin", "super_admin"]
ROLE_LEVEL = {r: i for i, r in enumerate(ROLES)}

# Workflow states
WORKFLOW_STATES = ["draft", "needs_review", "approved", "scheduled", "published", "archived"]

# Content taxonomies
ARTICLE_CATEGORIES = [
    "Oregon", "Política", "Gobierno", "Comunidad", "Educación", "Economía",
    "Inmigración", "Vivienda", "Salud", "Seguridad", "Elecciones",
]
ARTICLE_TYPES = ["Noticias", "Opinión", "Entrevista", "Análisis", "Información pública", "Contenido patrocinado"]

RESOURCE_CATEGORIES = [
    "Vivienda", "Renta", "Alimentos", "Salud", "Salud mental", "Empleo", "Educación",
    "Familias", "Niños", "Adultos mayores", "Inmigración", "Asistencia legal",
    "Transporte", "Servicios públicos", "Emergencias", "Instituciones públicas", "Programas estatales",
]

OREGON_INFO_CATEGORIES = [
    "Leyes", "Gobierno", "Impuestos", "Trabajo", "Vivienda", "Educación", "Salud",
    "Tránsito", "Licencias", "Elecciones", "Derechos", "Servicios públicos",
]

PLACE_CATEGORIES = [
    "Parques estatales", "Historia", "Ciudades", "Museos", "Recursos naturales",
    "Lugares culturales", "Lugares importantes",
]

SOURCE_TYPES = ["Gobierno", "Agencia estatal", "Municipio", "Organización", "Medio", "Candidato", "Documento", "Otro"]

RACE_TYPES = [
    "Gobernador", "Senado estatal", "Representante estatal", "Alcalde",
    "County Commissioner", "School Board", "Congreso", "Senado federal",
]

OREGON_CITIES = [
    "Portland", "Salem", "Beaverton", "Hillsboro", "Woodburn", "Gresham",
    "Eugene", "Bend", "Medford", "Tualatin", "Corvallis", "Springfield",
    "Hermiston", "Ontario", "McMinnville",
]

OREGON_COUNTIES = [
    "Multnomah", "Marion", "Washington", "Clackamas", "Lane", "Jackson",
    "Deschutes", "Umatilla", "Malheur", "Yamhill", "Benton", "Linn",
]
