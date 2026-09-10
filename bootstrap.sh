#!/bin/bash
set -e
# Solo la PRIMERA vez en un servidor fresco. Corre como root.
# Ajusta estas 2 variables (deben coincidir con deploy.sh)
REPO_URL="https://github.com/TUUSUARIO/TUREPO.git"
CPANEL_USER="elforo"

[ "$EUID" -ne 0 ] && { echo "❌ Corre como root"; exit 1; }
git config --global --add safe.directory '*'
REPO="/home/${CPANEL_USER}/repo"
[ -d "$REPO/.git" ] || git clone "$REPO_URL" "$REPO"
chown -R "$CPANEL_USER:$CPANEL_USER" "$REPO"
bash "$REPO/deploy.sh"
