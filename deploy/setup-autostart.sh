#!/bin/bash
# Configura arranque automático del backend al reiniciar el servidor (crontab @reboot).
# Se ejecuta como usuario de cPanel.
CPANEL_USER="${CPANEL_USER:-$(whoami)}"
PORT="${PORT:-8008}"
REPO="/home/${CPANEL_USER}/repo"
LINE="@reboot PORT=${PORT} CPANEL_USER=${CPANEL_USER} bash ${REPO}/deploy/restart.sh"

( crontab -l 2>/dev/null | grep -v "deploy/restart.sh" ; echo "$LINE" ) | crontab -
echo "  ✅ Autostart @reboot configurado (puerto ${PORT})"
