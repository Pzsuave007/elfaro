#!/bin/bash
# Actualización (lo llama deploy.sh). Se ejecuta como usuario de cPanel. NO uses sudo.
set -e
REPO="/home/${CPANEL_USER}/repo"
PROD="/opt/${CPANEL_USER}/backend"
PUB="/home/${CPANEL_USER}/public_html"

echo ">>> [user] git pull"
cd "$REPO" && git pull --ff-only || true

echo ">>> [user] Actualizando dependencias del backend"
cd "$PROD" && source venv/bin/activate
pip install -r "$REPO/deploy/requirements.prod.txt" \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
cp "$REPO"/backend/*.py "$PROD"/

echo ">>> [user] Publicando el frontend YA CONSTRUIDO (el servidor NO reconstruye)"
if [ ! -f "$REPO/frontend/build/index.html" ]; then
  echo "  ❌ Falta $REPO/frontend/build. Construye en Emergent y haz 'Save to Github'. NO se hace build aquí."
  exit 1
fi
rm -rf "$PUB/static" "$PUB/index.html" "$PUB/asset-manifest.json" "$PUB/manifest.json" "$PUB/robots.txt" "$PUB/favicon.ico"
cp -r "$REPO/frontend/build/." "$PUB/"
cp "$REPO/deploy/htaccess" "$PUB/.htaccess"
sed -i "s|__PORT__|$PORT|g" "$PUB/.htaccess"
find "$PUB" -type f -exec chmod 644 {} \;
find "$PUB" -type d -exec chmod 755 {} \;

echo ">>> [user] Reiniciando el backend"
PORT="$PORT" CPANEL_USER="$CPANEL_USER" bash "$REPO/deploy/restart.sh"
echo ">>> [user] fix.sh terminado"
