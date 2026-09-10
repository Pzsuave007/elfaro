#!/bin/bash
# ============================================================
#  Reparación 1-comando para El Foro In Oregon (producción)
#  Uso (como root, en el VPS):
#    sudo bash -c "curl -sSL https://raw.githubusercontent.com/Pzsuave007/elfaro/main/deploy/repair.sh | bash"
#  Trae el código más nuevo, reinicia el backend y verifica que
#  la función de Patrocinadores ya responda. Imprime PASS/FAIL.
# ============================================================
set -u
U="${CPANEL_USER:-elfaroinoregon}"
PORT="${PORT:-8008}"
DOMAIN="${DOMAIN:-elfaroinoregon.com}"
REPO="/home/${U}/repo"
PROD="/opt/${U}/backend"

echo ""
echo "==================================================="
echo "  Reparando El Foro In Oregon  (usuario: $U, puerto: $PORT)"
echo "==================================================="

as_user() { su -s /bin/bash -l "$U" -c "$1"; }

# --- 1. Traer el codigo mas nuevo a la fuerza ---
echo ">>> [1/5] Trayendo el codigo mas nuevo de GitHub..."
git config --global --add safe.directory '*' 2>/dev/null || true
if [ ! -d "$REPO/.git" ]; then
  echo "  X No existe el repo en $REPO . Corre primero bootstrap.sh."
  exit 1
fi
BR="$(as_user "cd $REPO && git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|origin/||'")"
[ -z "$BR" ] && BR="main"
as_user "cd $REPO && git fetch origin && git reset --hard origin/$BR"
echo "  Rama: $BR | Ultimo commit:"
as_user "cd $REPO && git log --oneline -1"

# --- 2. Copiar el backend nuevo a produccion ---
echo ">>> [2/5] Copiando backend a produccion..."
cp "$REPO"/backend/*.py "$PROD"/ 2>/dev/null
chown "$U:$U" "$PROD"/*.py 2>/dev/null

# --- 3. Verificar que el codigo nuevo ya esta en produccion ---
echo ">>> [3/5] Verificando codigo..."
if grep -q '"sponsors"' "$PROD/content.py" 2>/dev/null && [ -f "$PROD/sponsors.py" ]; then
  echo "  OK: el codigo de Patrocinadores esta presente en produccion."
else
  echo "  X El codigo de Patrocinadores NO llego a produccion."
  echo "    Casi seguro que 'Save to Github' esta conectado a OTRO repositorio."
  echo "    Repo esperado: github.com/Pzsuave007/elfaro (rama $BR)."
  exit 1
fi

# --- 4. Reiniciar el backend a la fuerza ---
echo ">>> [4/5] Reiniciando el backend..."
pkill -9 -f "uvicorn server:app" 2>/dev/null || true
sleep 2
as_user "cd $PROD && source venv/bin/activate && nohup uvicorn server:app --host 127.0.0.1 --port $PORT > $PROD/backend.log 2>&1 &"
sleep 4

# --- 5. Probar ---
echo ">>> [5/5] Probando el backend..."
RESP="$(curl -s "http://127.0.0.1:$PORT/api/public/sponsors")"
echo "  Respuesta: $RESP"
echo ""
if echo "$RESP" | grep -q '"items"'; then
  echo "==================================================="
  echo "  RESULTADO: PASS. Ya quedo arreglado."
  echo "  Abre https://$DOMAIN/admin/sponsors/new"
  echo "  y guarda un patrocinador: debe decir 'Guardado correctamente'."
  echo "==================================================="
else
  echo "==================================================="
  echo "  RESULTADO: FAIL. El backend no arranco bien."
  echo "  Ultimas lineas del log:"
  tail -n 20 "$PROD/backend.log" 2>/dev/null
  echo "==================================================="
  exit 1
fi
