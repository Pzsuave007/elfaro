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

echo ">>> [user] Rebuild del frontend"
cd "$REPO/frontend"
printf 'REACT_APP_BACKEND_URL=https://%s\nGENERATE_SOURCEMAP=false\n' "$DOMAIN" > .env
export NODE_OPTIONS=--max-old-space-size=2048
export CI=false
yarn install --ignore-engines
yarn build
rm -rf "$PUB/static" "$PUB/index.html" "$PUB/asset-manifest.json" "$PUB/manifest.json" "$PUB/robots.txt" "$PUB/favicon.ico"
cp -r "$REPO/frontend/build/." "$PUB/"
cp "$REPO/deploy/htaccess" "$PUB/.htaccess"
sed -i "s|__PORT__|$PORT|g" "$PUB/.htaccess"
find "$PUB" -type f -exec chmod 644 {} \;
find "$PUB" -type d -exec chmod 755 {} \;

echo ">>> [user] Reiniciando el backend"
PORT="$PORT" CPANEL_USER="$CPANEL_USER" bash "$REPO/deploy/restart.sh"
echo ">>> [user] fix.sh terminado"
