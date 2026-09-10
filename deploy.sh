#!/bin/bash
set -e
# ============ AJUSTA ESTAS 4 VARIABLES ============
REPO_URL="https://github.com/Pzsuave007/elfaro.git"   # repo de GitHub
CPANEL_USER="elfaroinoregon"                          # usuario de cPanel
PORT=8008                                             # puerto libre (verificado)
DOMAIN="elfaroinoregon.com"                           # dominio
# ===================================================
REPO="/home/${CPANEL_USER}/repo"
PROD="/opt/${CPANEL_USER}/backend"

[ "$EUID" -ne 0 ] && { echo "❌ Corre este script como root"; exit 1; }
git config --global --add safe.directory '*' 2>/dev/null || true
as_user() { su -s /bin/bash -l "$CPANEL_USER" -c "$1"; }

if [ ! -d "$PROD/venv" ]; then
    echo ">>> FIRST-TIME INSTALL"
    if [ ! -d "$REPO/.git" ]; then rm -rf "$REPO" && git clone "$REPO_URL" "$REPO"; fi
    chown -R "$CPANEL_USER:$CPANEL_USER" "$REPO"
    chmod 711 "/home/$CPANEL_USER"
    mkdir -p "$PROD" && chown -R "$CPANEL_USER:$CPANEL_USER" "/opt/$CPANEL_USER"
    if [ ! -f "$PROD/.env" ]; then
        cp "$REPO/deploy/backend.env.production.example" "$PROD/.env"
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 64)|" "$PROD/.env"
        sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN|" "$PROD/.env"
        chown "$CPANEL_USER:$CPANEL_USER" "$PROD/.env"; chmod 600 "$PROD/.env"
        echo ""
        echo "  ⚠️  IMPORTANTE: edita $PROD/.env y pon tu EMERGENT_LLM_KEY real y un ADMIN_PASSWORD fuerte."
        echo "     Luego vuelve a correr:  bash deploy.sh"
        echo ""
    fi
    as_user "PORT=$PORT DOMAIN=$DOMAIN CPANEL_USER=$CPANEL_USER bash $REPO/deploy/install_server.sh"
    as_user "PORT=$PORT CPANEL_USER=$CPANEL_USER bash $REPO/deploy/setup-autostart.sh"
else
    echo ">>> UPDATE"
    chown -R "$CPANEL_USER:$CPANEL_USER" "$REPO"
    as_user "PORT=$PORT DOMAIN=$DOMAIN CPANEL_USER=$CPANEL_USER bash $REPO/deploy/fix.sh"
fi

sleep 3
if curl -sf "http://127.0.0.1:$PORT/api/" >/dev/null; then
    echo "  ✅ Backend OK en 127.0.0.1:$PORT"
else
    echo "  ❌ Backend no responde. Últimas líneas del log:"
    tail -n 30 "$PROD/backend.log" 2>/dev/null
    exit 1
fi
echo "🎉 Listo → https://$DOMAIN/   (admin: https://$DOMAIN/admin/login )"
