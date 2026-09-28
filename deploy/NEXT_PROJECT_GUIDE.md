# 🚀 Emergent → VPS Deploy — Guía para el Próximo Proyecto (v2, Jun 2026)

> Actualiza la guía original (La Campeona, Feb 2026) con lo aprendido en el deploy de
> **El Faro en Oregon** (Jun 2026): puertos al día, **swap**, **backend como servicio systemd
> con auto-reinicio**, **frontend pre-construido** (el server ya NO hace `yarn build`),
> **almacenamiento local en disco**, y manejo correcto de la **clave de Emergent** y las **URLs**.
>
> Perfil del server: **GoDaddy VPS + AlmaLinux + Apache (cPanel) + Python + Node + MongoDB local, RAM baja.**

---

## 🆕 LO NUEVO (léelo primero — resuelve el 90% de los dolores de cabeza)

1. **El server tiene POCA RAM.** Nunca ejecutes `yarn build` en el servidor: se queda sin memoria y mata MongoDB/backend.
   → El frontend se construye **en Emergent** y se commitea `frontend/build/` al repo. El server solo COPIA.
2. **Agrega SWAP (2 GB)** en cada server nuevo → evita que MongoDB muera por OOM. (Script `harden.sh`.)
3. **El backend va como servicio `systemd` con `Restart=always`** (NO nohup+cron). Si se cae, vuelve solo en segundos y arranca en cada reboot.
4. **Almacenamiento de imágenes en DISCO LOCAL** (`MEDIA_DIR`), no dependas de almacenamiento externo. Cuida los permisos.
5. **`REACT_APP_BACKEND_URL` vacío → rutas relativas `/api`** al construir. Funciona igual en `dominio.com` y `www.dominio.com` sin líos de CORS.
6. **Las claves de Emergent CADUCAN/ROTAN.** Una clave "que parece válida" puede dar **401**. El script de deploy debe **escribir siempre la clave actual** (guardada en base64 para no exponerla en GitHub).
7. **Dos claves de AI, cada una a lo suyo:** la clave OpenAI del usuario para texto/imágenes (directo a `api.openai.com`); la clave Emergent solo para búsqueda web con Gemini (grounding) vía el proxy.
8. **Health-check con reintentos** tras reiniciar (el backend tarda unos segundos en levantar).

---

## 🔢 Tabla de Puertos por App (ACTUALIZADA)

| App | Puerto | Estado |
|---|---|---|
| GradeProphet | 8001 | usado |
| OnPar Live | 8005 | usado |
| La Campeona | 8006 | usado |
| (reservado) | 8007 | reservado |
| **El Faro en Oregon** | **8008** | usado |
| **TU NUEVO PROYECTO** | **8009** | ← elige este (siguiente libre) |

⚠️ **NUNCA reutilices un puerto.** Cada app tiene el suyo. Defínelo en UNA variable usada en TODOS los scripts.
Para ver qué puertos están ocupados en el server: `ss -ltnp | grep -E '80(0[1-9]|1[0-9])'`

---

## 🏗️ Estructura del Repo (antes del push)

```
/repo-raiz/
├── deploy.sh                    ← primer install (root) — clona, swap, systemd, arranca
├── bootstrap.sh                 ← one-liner para server fresco (descarga y corre deploy.sh)
├── backend/
│   ├── server.py                 ← carga .env, arranca FastAPI, seed admin
│   ├── requirements.txt          ← deps de DEV
│   └── .env                      ← DEV (localhost)
├── frontend/
│   ├── build/                    ← ✅ PRE-CONSTRUIDO Y COMMITEADO (el server NO reconstruye)
│   ├── package.json
│   └── src/
└── deploy/
    ├── install_server.sh         ← primer install como user (venv, deps, copia backend)
    ├── repair.sh                 ← updates 1-comando (pull + copia build + clave + restart + verify)
    ├── harden.sh                 ← UNA vez: swap + MongoDB autostart + servicio systemd
    ├── htaccess                  ← Apache proxy /api + SPA fallback
    ├── requirements.prod.txt     ← deps SLIM para el server
    └── backend.env.production.example
```

---

## 📝 Reglas de Oro (v2)

### ✅ HACER
1. `git config --global --add safe.directory '*'` (una vez por server).
2. Repo en `/home/USER/repo/` (subcarpeta, NO en `/home/USER/`).
3. **Puerto único** por app (ver tabla). Este proyecto: **8009**.
4. **Construir el frontend EN EMERGENT** con la URL relativa y **commitear `frontend/build/`**:
   ```bash
   cd frontend && REACT_APP_BACKEND_URL="" GENERATE_SOURCEMAP=false yarn build
   ```
   (La variable inline vacía SÍ gana; un `.env.production` vacío NO tiene prioridad sobre `.env`.)
5. **Correr `harden.sh` UNA vez** en cada server nuevo (swap + mongo autostart + systemd).
6. **`repair.sh` para cada update** (pull + copiar build + asegurar clave + restart + verificar con reintentos).
7. `requirements.prod.txt` **SLIM** (incluye `Pillow` si generas/comprimes imágenes; sin pandas/numpy/pytest).
8. `pip install ... --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/` para `emergentintegrations`.
9. `MEDIA_DIR=/opt/USER/backend/media_store` y arreglar permisos: `chown -R USER:USER $MEDIA && chmod -R u+rwX $MEDIA`.
10. Generar `JWT_SECRET` con `openssl rand -hex 64` en el primer install.
11. Clave Emergent **siempre escrita por el script** (codificada en base64 para no dejarla en texto plano en GitHub).

### ❌ NO HACER
1. **NO** `yarn build` en el server (OOM → mata Mongo/backend). El build va commiteado.
2. **NO** dejar `EMERGENT_LLM_KEY=sk-emergent-XXXX` (placeholder) ni una clave vieja → da 401 en storage y en Gemini.
3. **NO** subir la clave en texto plano al repo (usa base64 + inyección por script).
4. **NO** repo en `/home/USER/` directo.
5. **NO** `sudo` dentro de scripts que corren como user.
6. **NO** versiones pineadas en `requirements.prod.txt`.
7. **NO** depender de almacenamiento externo para imágenes: usa disco local (`MEDIA_DIR`).
8. **NO** hornear la URL del preview de Emergent en el build (usa `REACT_APP_BACKEND_URL=""`).
9. **NO** cookies httpOnly con el proxy de cPanel → usa Bearer token en localStorage.

---

## ⚙️ requirements.prod.txt (El Faro — cópialo tal cual)
```
fastapi
uvicorn
python-dotenv
pymongo
motor
pydantic
email-validator
pyjwt
bcrypt
passlib
python-multipart
requests
tzdata
python-jose
Pillow
emergentintegrations
```

## 🌐 htaccess (cambia SOLO el puerto → 8009)
```apache
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^(.*)$ http://127.0.0.1:8009/$1 [P,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 🔑 backend.env.production.example
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=miapp_prod
CORS_ORIGINS=https://miapp.com,https://www.miapp.com
JWT_SECRET=GENERATED_BY_DEPLOY_SCRIPT
JWT_EXPIRY_HOURS=12
ADMIN_EMAIL=admin@miapp.com
ADMIN_PASSWORD=CHANGE_ME
APP_NAME=miapp
MEDIA_DIR=/opt/miapp/backend/media_store
EMERGENT_LLM_KEY=sk-emergent-XXXXXXXXXXXXXXXX
# OPENAI_API_KEY=  (opcional: la clave propia del usuario para texto/imágenes)
```

---

## 🩺 harden.sh (correr UNA vez en cada server nuevo)

Hace 3 cosas para que el backend NO se caiga:
1. **Swap 2 GB** (evita que MongoDB muera por RAM).
2. **MongoDB con arranque automático.**
3. **Backend como servicio systemd** con `Restart=always` y arranque en boot.

Uso:
```bash
sudo bash -c "curl -sSL https://raw.githubusercontent.com/TUUSUARIO/TUREPO/main/deploy/harden.sh | bash"
```
Plantilla del servicio systemd que genera (ajusta nombre/usuario/puerto):
```ini
[Unit]
Description=miapp backend (FastAPI/uvicorn)
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=miapp
Group=miapp
WorkingDirectory=/opt/miapp/backend
Environment=PORT=8009
ExecStart=/opt/miapp/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8009
Restart=always
RestartSec=3
StartLimitIntervalSec=0

[Install]
WantedBy=multi-user.target
```

---

## 🔁 repair.sh (para CADA update — lo único que corres luego del primer install)

Debe hacer, en orden:
1. `git fetch && git reset --hard origin/main` (traer lo último).
2. Instalar deps de `requirements.prod.txt` y copiar `backend/*.py` a `/opt/USER/backend/`.
3. **Asegurar la clave de Emergent** en el `.env` de prod (escribir SIEMPRE la clave actual, decodificada de base64):
   ```bash
   EMK="$(printf '%s' 'BASE64_DE_TU_CLAVE' | base64 -d)"
   sed -i '/^EMERGENT_LLM_KEY=/d' "$ENVF"; echo "EMERGENT_LLM_KEY=$EMK" >> "$ENVF"
   ```
   (Para obtener el base64: `printf '%s' 'sk-emergent-TUCLAVE' | base64`.)
4. **Verificar que existe `frontend/build/index.html`**; si no, abortar (“construye en Emergent y haz Save to Github”). El server NUNCA hace build.
5. Publicar el build: `rm` de `static/ index.html asset-manifest.json ...` en `public_html/` y `cp -r frontend/build/. public_html/`.
6. Copiar `htaccess` y sustituir el puerto.
7. Permisos: `public_html` (644 archivos / 755 carpetas) y `MEDIA_DIR` (`chown -R USER:USER`, `chmod -R u+rwX`).
8. Asegurar MongoDB arriba; reiniciar el backend por systemd (`systemctl restart miapp-backend`).
9. **Verificar con reintentos** (el backend tarda en levantar):
   ```bash
   for i in $(seq 1 12); do
     RESP="$(curl -s --max-time 8 http://127.0.0.1:$PORT/api/)"
     echo "$RESP" | grep -q '"ok"' && break
     sleep 3
   done
   ```

Uso:
```bash
sudo bash -c "curl -sSL https://raw.githubusercontent.com/TUUSUARIO/TUREPO/main/deploy/repair.sh | bash"
```

---

## 🛠️ Pasos de Despliegue (server fresco)

1. **En Emergent:** termina la app, **construye el frontend con URL relativa** y commitea `frontend/build/`. Click en **"Save to Github"**.
2. **En el server (root), una vez:**
   ```bash
   git config --global --add safe.directory '*'
   curl -sSL https://raw.githubusercontent.com/TUUSUARIO/TUREPO/main/bootstrap.sh | bash   # clona + primer install
   sudo bash -c "curl -sSL https://raw.githubusercontent.com/TUUSUARIO/TUREPO/main/deploy/harden.sh | bash"   # swap + systemd
   ```
3. **cPanel UI:** SSL (Let's Encrypt) + Force HTTPS + WHM EasyApache: `mod_proxy`, `mod_proxy_http`, `mod_headers`, `mod_rewrite`.
4. **Verificar:** `curl -i https://miapp.com/api/` → HTTP 200 + JSON ✅
5. **Updates futuros:** solo `repair.sh` (comando de arriba). Y recarga el navegador con **Ctrl+Shift+R**.

---

## 🔥 Errores Comunes y Fixes (v2 — incluye los nuevos)

| Error | Causa | Fix |
|---|---|---|
| Backend se cae solo cada rato | OOM (poca RAM) / sin auto-restart | `harden.sh`: swap 2G + servicio systemd `Restart=always` |
| `yarn build` mata el server | OOM en build | NO buildear en server; commitear `frontend/build/` |
| Falta `frontend/build/index.html` en deploy | No se commiteó el build | Construir en Emergent + "Save to Github"; `repair.sh` valida su existencia |
| **401 Unauthorized** en `objstore/init` o en Gemini | Clave Emergent **vieja/placeholder** | `repair.sh` escribe SIEMPRE la clave actual (base64); no confiar en “parece válida” |
| “Investigar con AI” no trae resultados | Misma causa (clave 401) o sin OPENAI_API_KEY para texto | Clave Emergent correcta (búsqueda) + clave OpenAI del usuario (redacción/imágenes) |
| Subir imagen falla en prod | Permisos de `MEDIA_DIR` | `chown -R USER:USER $MEDIA && chmod -R u+rwX $MEDIA` |
| El sitio llama al preview de Emergent | URL horneada en el build | Reconstruir con `REACT_APP_BACKEND_URL=""` (rutas relativas `/api`) |
| CORS al usar `www` vs no-`www` | URL absoluta a un solo host | URL relativa `/api` (el `.htaccess` proxya en cualquier host) |
| `[7/7] FAIL` pero el backend sí levanta | Curl antes de que arranque | Health-check con reintentos (12× cada 3s) |
| `dubious ownership` | Git ≥2.35 | `git config --global --add safe.directory '*'` |
| `Shell access not enabled` | cPanel sin shell | `su -s /bin/bash -l USER -c "..."` |
| `502 Bad Gateway` en `/api` | Backend no corre | `systemctl status miapp-backend` → `systemctl restart miapp-backend` |
| Cambios no se ven | Navegador cacheado | Ctrl+Shift+R (y confirmar que `repair.sh` copió el build nuevo) |

---

## 📞 Logs útiles cuando algo falle
```bash
# Backend (systemd)
journalctl -u miapp-backend -n 60 --no-pager
# Estado del servicio
systemctl is-active miapp-backend
# ¿Mongo arriba?
ss -ltn | grep 27017
# Apache
tail -n 50 /usr/local/apache/logs/error_log
# .env de prod (sin exponer secretos)
grep -v "JWT_SECRET\|PASSWORD\|LLM_KEY\|OPENAI" /opt/miapp/backend/.env
```

---

## ✅ Checklist del Próximo Proyecto
- [ ] Elegir puerto **8009** (siguiente libre; verifica con `ss -ltnp`)
- [ ] Crear cuenta cPanel + dominio + DNS
- [ ] Crear repo en GitHub
- [ ] Copiar carpeta `deploy/` de El Faro y reemplazar: usuario, dominio, puerto (8008→8009), nombre del servicio systemd
- [ ] Poner tu clave Emergent en base64 dentro de `repair.sh`
- [ ] **Construir frontend en Emergent con `REACT_APP_BACKEND_URL=""` y commitear `frontend/build/`**
- [ ] "Save to Github"
- [ ] Server: `bootstrap.sh` → luego `harden.sh`
- [ ] cPanel: SSL + Force HTTPS + módulos Apache
- [ ] `curl https://miapp.com/api/` → 200 ✅
- [ ] Updates: `repair.sh` + Ctrl+Shift+R

---

**Hecho tras el deploy de El Faro en Oregon (Jun 2026).**
**Pzsuave007 — con swap, systemd y build pre-construido, el server ya no se cae. 🙌**
