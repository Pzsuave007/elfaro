#!/usr/bin/env python3
"""Importa el contenido exportado (deploy/content_export/*.json) a la base de datos de producción.
Hace UPSERT por 'id', así que es seguro correrlo varias veces (no duplica).
Uso (en el servidor, dentro del venv del backend):
    cd /opt/elfaroinoregon/backend
    source venv/bin/activate
    python /home/elfaroinoregon/repo/deploy/import_content.py
"""
import os, json
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# Carga el .env de producción. Ejecuta este script DESDE /opt/USER/backend
# (ahí está el .env con MONGO_URL, DB_NAME y MEDIA_DIR de producción).
load_dotenv()  # .env del directorio actual
if not os.environ.get("MONGO_URL"):
    # fallback: intenta el .env junto a este script
    load_dotenv(Path(__file__).resolve().parent / ".env")

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

    # Copia los archivos de imagen al almacenamiento local del servidor (MEDIA_DIR)
    media_dir = os.environ.get("MEDIA_DIR")
    src = EXPORT_DIR / "media_files"
    if media_dir and src.exists():
        import shutil
        copied = 0
        for f in src.rglob("*"):
            if f.is_file():
                rel = f.relative_to(src)
                dest = Path(media_dir) / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dest)
                copied += 1
        print(f"  imágenes copiadas a {media_dir}: {copied}")
    elif not media_dir:
        print("  (MEDIA_DIR no definido; me salto la copia de imágenes a disco)")

    print("Listo:", total)


if __name__ == "__main__":
    main()
