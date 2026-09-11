#!/bin/bash
# ============================================================
#  harden.sh — Estabiliza El Faro In Oregon (correr UNA vez, como root)
#  Uso:
#    sudo bash -c "curl -sSL https://raw.githubusercontent.com/Pzsuave007/elfaro/main/deploy/harden.sh | bash"
#  Hace 3 cosas para que el backend NO se vuelva a caer:
#    1) Agrega swap (2G) → evita que MongoDB muera por falta de RAM
#    2) Deja MongoDB con arranque automático
#    3) Convierte el backend en servicio systemd con auto-reinicio y arranque en boot
# ============================================================
set -u
U="${CPANEL_USER:-elfaroinoregon}"
PORT="${PORT:-8008}"
PROD="/opt/${U}/backend"

echo "==================================================="
echo "  Estabilizando El Faro In Oregon (usuario: $U, puerto: $PORT)"
echo "==================================================="

# --- 1) SWAP ---
echo ">>> [1/4] Swap (memoria de respaldo para que no muera Mongo)"
if swapon --show 2>/dev/null | grep -q .; then
  echo "  Ya existe swap. OK."
else
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "  Swap de 2G creado y activado."
fi

# --- 2) MongoDB autostart ---
echo ">>> [2/4] MongoDB con arranque automático"
MONGO_SVC=""
for s in mongod mongodb; do
  if systemctl list-unit-files 2>/dev/null | grep -q "^${s}.service"; then MONGO_SVC="$s"; break; fi
done
if [ -n "$MONGO_SVC" ]; then
  systemctl enable "$MONGO_SVC" 2>/dev/null
  systemctl start "$MONGO_SVC" 2>/dev/null
  sleep 3
  ss -ltn 2>/dev/null | grep -q 27017 && echo "  MongoDB ($MONGO_SVC) ARRIBA." || echo "  ⚠ MongoDB no responde en 27017 (revisar 'systemctl status $MONGO_SVC')."
else
  echo "  ⚠ No encontré el servicio de MongoDB (mongod/mongodb). Verifica que esté instalado."
fi

# --- 3) Servicio systemd del backend con auto-reinicio ---
echo ">>> [3/4] Servicio systemd del backend (auto-reinicio + arranque en boot)"
# Detener el proceso viejo (nohup) y quitar el cron @reboot que lo lanzaba
pkill -9 -f "uvicorn server:app" 2>/dev/null || true
( crontab -u "$U" -l 2>/dev/null | grep -v "deploy/restart.sh" ) | crontab -u "$U" - 2>/dev/null || true

cat > /etc/systemd/system/elfaro-backend.service <<EOF
[Unit]
Description=El Faro In Oregon backend (FastAPI/uvicorn)
After=network.target ${MONGO_SVC:-mongod}.service
Wants=${MONGO_SVC:-mongod}.service

[Service]
Type=simple
User=${U}
Group=${U}
WorkingDirectory=${PROD}
Environment=PORT=${PORT}
ExecStart=${PROD}/venv/bin/uvicorn server:app --host 127.0.0.1 --port ${PORT}
Restart=always
RestartSec=3
StartLimitIntervalSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable elfaro-backend 2>/dev/null
systemctl restart elfaro-backend
sleep 6

# --- 4) Verificar ---
echo ">>> [4/4] Probando"
echo -n "  Servicio: "; systemctl is-active elfaro-backend
RESP="$(curl -s http://127.0.0.1:${PORT}/api/)"
echo "  API: $RESP"
echo ""
if echo "$RESP" | grep -q '"ok"'; then
  echo "==================================================="
  echo "  RESULTADO: PASS. El backend ahora se reinicia solo."
  echo "  A partir de ahora, si se cae, vuelve en segundos, y"
  echo "  arranca automáticamente cuando reinicies el servidor."
  echo "==================================================="
else
  echo "==================================================="
  echo "  RESULTADO: FAIL. Revisa el log:"
  echo "    journalctl -u elfaro-backend -n 40 --no-pager"
  echo "==================================================="
  exit 1
fi
