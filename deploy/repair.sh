#!/bin/bash
# ============================================================
#  Actualizacion + reparacion 1-comando para El Foro In Oregon
#  Uso (como root, en el VPS):
#    sudo bash -c "curl -sSL https://raw.githubusercontent.com/Pzsuave007/elfaro/main/deploy/repair.sh | bash"
#  Trae el codigo mas nuevo, reconstruye el frontend, arregla
#  permisos de imagenes, reinicia el backend y verifica.
# ============================================================
set -u
U="${CPANEL_USER:-elfaroinoregon}"
PORT="${PORT:-8008}"
DOMAIN="${DOMAIN:-elfaroinoregon.com}"
REPO="/home/${U}/repo"
PROD="/opt/${U}/backend"
PUB="/home/${U}/public_html"
MEDIA="${PROD}/media_store"

echo ""
echo "==================================================="
echo "  Actualizando El Foro In Oregon (usuario: $U, puerto: $PORT)"
echo "==================================================="

as_user() { su -s /bin/bash -l "$U" -c "$1"; }

# --- 1. Traer el codigo mas nuevo a la fuerza ---
echo ">>> [1/7] Trayendo el codigo mas nuevo de GitHub..."
git config --global --add safe.directory '*' 2>/dev/null || true
if [ ! -d "$REPO/.git" ]; then echo "  X No existe el repo en $REPO"; exit 1; fi
BR="$(as_user "cd $REPO && git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|origin/||'")"
[ -z "$BR" ] && BR="main"
as_user "cd $REPO && git fetch origin && git reset --hard origin/$BR"
echo "  Rama: $BR | Ultimo commit:"
as_user "cd $REPO && git log --oneline -1"

# --- 2. Backend: dependencias + copiar codigo ---
echo ">>> [2/7] Actualizando dependencias del backend..."
as_user "cd $PROD && source venv/bin/activate && pip install -q -r $REPO/deploy/requirements.prod.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/"
echo ">>> [3/7] Copiando backend a produccion..."
as_user "cp $REPO/backend/*.py $PROD/"

# --- 4. Reconstruir el frontend ---
echo ">>> [4/7] Reconstruyendo el frontend (puede tardar 1-2 min)..."
as_user "cd $REPO/frontend && printf 'REACT_APP_BACKEND_URL=https://%s\nGENERATE_SOURCEMAP=false\n' '$DOMAIN' > .env && export NODE_OPTIONS=--max-old-space-size=2048 && export CI=false && yarn install --ignore-engines --silent && yarn build"
echo ">>> [5/7] Publicando el frontend en public_html..."
rm -rf "$PUB/static" "$PUB/index.html" "$PUB/asset-manifest.json" "$PUB/manifest.json" "$PUB/robots.txt" "$PUB/favicon.ico"
cp -r "$REPO/frontend/build/." "$PUB/"
cp "$REPO/deploy/htaccess" "$PUB/.htaccess"
sed -i "s|__PORT__|$PORT|g" "$PUB/.htaccess"
chown -R "$U:$U" "$PUB"
find "$PUB" -type f -exec chmod 644 {} \;
find "$PUB" -type d -exec chmod 755 {} \;

# --- 6. Arreglar permisos de imagenes + reiniciar backend ---
echo ">>> [6/7] Arreglando permisos de imagenes y reiniciando backend..."
mkdir -p "$MEDIA"
chown -R "$U:$U" "$MEDIA" "$PROD"
chmod -R u+rwX "$MEDIA"
pkill -9 -f "uvicorn server:app" 2>/dev/null || true
sleep 2
as_user "PORT=$PORT CPANEL_USER=$U bash $REPO/deploy/restart.sh"
sleep 3

# --- 7. Verificar ---
echo ">>> [7/7] Probando el backend..."
RESP="$(curl -s "http://127.0.0.1:$PORT/api/public/sponsors")"
echo "  Respuesta: $RESP"
echo ""
if echo "$RESP" | grep -q '"items"'; then
  echo "==================================================="
  echo "  RESULTADO: PASS. Todo actualizado."
  echo "  Abre https://$DOMAIN/  y  https://$DOMAIN/aliados"
  echo "  (si no ves los cambios, recarga con Ctrl+Shift+R)"
  echo "==================================================="
else
  echo "==================================================="
  echo "  RESULTADO: FAIL. El backend no respondio bien."
  echo "  Ultimas lineas del log:"
  tail -n 20 "$PROD/backend.log" 2>/dev/null
  echo "==================================================="
  exit 1
fi
