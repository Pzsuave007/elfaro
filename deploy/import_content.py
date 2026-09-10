#!/usr/bin/env python3
"""Importa el contenido exportado (deploy/content_export/*.json) a la base de datos de producción.
Hace UPSERT por 'id', así que es seguro correrlo varias veces (no duplica).
Uso (en el servidor, dentro del venv del backend):
    cd /opt/elfaroinoregon/backend
    source venv/bin/activate
    python /home/elfaroinoregon/repo/deploy/import_content.py
"""
import os, json, glob
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# Carga el .env de producción (mismo dir que el backend en /opt/USER/backend)
load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")  # fallback
# En prod el backend corre desde /opt/USER/backend con su .env; si corres desde ahí, ya está cargado.
if not os.environ.get("MONGO_URL"):
    load_dotenv()

EXPORT_DIR = Path(__file__).resolve().parent / "content_export"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "elfaroinoregon_prod")

# nombre de archivo -> nombre de coleccion
COLLECTIONS = ["articles", "resources", "oregon_info", "places", "settings", "media"]


def main():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Importando a DB: {DB_NAME}")
    total = {}
    for coll in COLLECTIONS:
        fpath = EXPORT_DIR / f"{coll}.json"
        if not fpath.exists():
            print(f"  (saltado) no existe {fpath.name}")
            continue
        docs = json.loads(fpath.read_text(encoding="utf-8"))
        n = 0
        for d in docs:
            d.pop("_id", None)
            key = {"id": d["id"]} if d.get("id") else d
            db[coll].replace_one(key, d, upsert=True)
            n += 1
        # indices utiles
        if coll in ("articles", "resources", "oregon_info", "places"):
            db[coll].create_index("slug")
            db[coll].create_index("status")
        total[coll] = n
        print(f"  {coll:12} importados/actualizados: {n}")
    print("Listo:", total)


if __name__ == "__main__":
    main()
