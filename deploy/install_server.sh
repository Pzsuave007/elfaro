#!/bin/bash
# Se ejecuta como usuario de cPanel (lo llama deploy.sh). NO uses sudo aquí.
set -e
REPO="/home/${CPANEL_USER}/repo"
PROD="/opt/${CPANEL_USER}/backend"
PUB="/home/${CPANEL_USER}/public_html"

echo ">>> [user] Creando venv e instalando dependencias de Python (Py 3.9 compatible)"
cd "$PROD"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r "$REPO/deploy/requirements.prod.txt" \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

echo ">>> [user] Copiando código del backend a $PROD (el .env de prod NO se toca)"
cp "$REPO"/backend/*.py "$PROD"/

echo ">>> [user] Construyendo el frontend con la URL de producción"
cd "$REPO/frontend"
printf 'REACT_APP_BACKEND_URL=https://%s\nGENERATE_SOURCEMAP=false\n' "$DOMAIN" > .env
export NODE_OPTIONS=--max-old-space-size=2048
export CI=false
yarn install --ignore-engines
yarn build

echo ">>> [user] Publicando el frontend en public_html"
mkdir -p "$PUB"
rm -rf "$PUB/static" "$PUB/index.html" "$PUB/asset-manifest.json" "$PUB/manifest.json" "$PUB/robots.txt" "$PUB/favicon.ico"
cp -r "$REPO/frontend/build/." "$PUB/"
cp "$REPO/deploy/htaccess" "$PUB/.htaccess"
sed -i "s|__PORT__|$PORT|g" "$PUB/.htaccess"

echo ">>> [user] Ajustando permisos"
find "$PUB" -type f -exec chmod 644 {} \;
find "$PUB" -type d -exec chmod 755 {} \;

echo ">>> [user] Arrancando el backend"
PORT="$PORT" CPANEL_USER="$CPANEL_USER" bash "$REPO/deploy/restart.sh"
echo ">>> [user] install_server.sh terminado"
