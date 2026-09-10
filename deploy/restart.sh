#!/bin/bash
# Reinicia el backend con nohup (sin supervisor/systemd). Se corre como usuario de cPanel.
CPANEL_USER="${CPANEL_USER:-$(whoami)}"
PORT="${PORT:-8008}"
PROD="/opt/${CPANEL_USER}/backend"

pkill -f "uvicorn server:app --host 127.0.0.1 --port ${PORT}" 2>/dev/null || true
sleep 1
cd "$PROD"
source venv/bin/activate
nohup uvicorn server:app --host 127.0.0.1 --port "$PORT" > "$PROD/backend.log" 2>&1 &
sleep 2
if pgrep -f "uvicorn server:app --host 127.0.0.1 --port ${PORT}" >/dev/null; then
    echo "  ✅ Backend corriendo en 127.0.0.1:${PORT}"
else
    echo "  ❌ El backend no arrancó. Revisa: tail -n 40 $PROD/backend.log"
fi
