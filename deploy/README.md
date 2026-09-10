# 🚀 Deploy de El Foro In Oregon → cPanel / AlmaLinux / Apache

Basado en tu guía `NEXT_PROJECT_GUIDE.md`. Puerto asignado: **8008** (el 8007 ya está ocupado en tu servidor).

## Antes de subir (en Emergent)
1. Abre `deploy.sh` y `bootstrap.sh` y ajusta el encabezado:
   - `REPO_URL` = tu repo de GitHub
   - `CPANEL_USER` = tu usuario de cPanel (ej. `elforo`)
   - `PORT=8008`  (ya puesto)
   - `DOMAIN` = tu dominio (sin `https://`)
2. Click en **"Save to Github"** en el chat de Emergent.

## En el servidor (como root, primera vez)
```bash
git config --global --add safe.directory '*'
curl -sSL https://raw.githubusercontent.com/TUUSUARIO/TUREPO/main/bootstrap.sh | bash
```
- La 1ª corrida crea `/opt/USER/backend/.env` y **se detiene** para que pongas tu
  `EMERGENT_LLM_KEY` real y un `ADMIN_PASSWORD` fuerte.
- Edita ese archivo:  `nano /opt/USER/backend/.env`
- Vuelve a correr:  `cd /home/USER/repo && bash deploy.sh`

## En cPanel (3 clicks)
1. **SSL/TLS Status** → Let's Encrypt para tu dominio + www.
2. **Domains** → **Force HTTPS Redirect** ON.
3. **WHM → EasyApache 4 → Apache Modules** → habilita `mod_proxy`, `mod_proxy_http`, `mod_headers`, `mod_rewrite`.

## Verificar
```bash
curl -i https://tudominio.com/api/       # → HTTP 200 + JSON
```
Abre `https://tudominio.com/admin/login` → entra con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Updates futuros (2 líneas)
```bash
cd /home/USER/repo && git pull && bash deploy.sh
```

---

## 🖼️ Imágenes (se guardan en el disco de tu servidor)
Las imágenes ahora se guardan y se sirven desde el **disco local** del servidor (variable
`MEDIA_DIR`), así NO dependen del almacenamiento de Emergent ni de la clave. Los archivos
reales viajan en el repo en `deploy/content_export/media_files/` y el import los copia a
`MEDIA_DIR`.

### Si YA desplegaste y las imágenes salían en blanco, arréglalo así:
```bash
# 1) trae los cambios y el fix
cd /home/elfaroinoregon/repo && git pull && bash deploy.sh

# 2) AÑADE MEDIA_DIR a tu .env de producción (solo la primera vez)
grep -q '^MEDIA_DIR=' /opt/elfaroinoregon/backend/.env || \
  printf 'MEDIA_DIR=/opt/elfaroinoregon/backend/media_store\n' >> /opt/elfaroinoregon/backend/.env

# 3) reinicia el backend para tomar MEDIA_DIR
cd /opt/elfaroinoregon/backend && source venv/bin/activate
PORT=8008 CPANEL_USER=elfaroinoregon bash /home/elfaroinoregon/repo/deploy/restart.sh

# 4) importa contenido + copia las imágenes al disco
cd /opt/elfaroinoregon/backend && source venv/bin/activate
python /home/elfaroinoregon/repo/deploy/import_content.py
```
Recarga el sitio → las imágenes ya deben verse. (El import hace **upsert por id** y copia
las 47 imágenes a `MEDIA_DIR`; es seguro repetirlo.)

⚠️ Importante: los registros en la base (`media`) y los archivos en `MEDIA_DIR` deben ir
juntos — por eso el import hace ambas cosas. No borres uno sin el otro.

## ⚠️ Notas específicas de ESTA app
- **Pillow** es obligatorio (comprime imágenes a WebP). Ya está en `requirements.prod.txt`.
- **emergentintegrations** va SIN pin (usa la última) porque la app usa búsqueda web de
  Gemini (googleSearch) y generación de imágenes gpt-image-1. `litellm` viene incluido.
- **Dependencia externa (importante):** las imágenes (subidas y de AI) se guardan en
  **Emergent Object Storage** y la AI usa el proxy de Emergent. El servidor debe permitir
  **salida HTTPS a `integrations.emergentagent.com`** y el `EMERGENT_LLM_KEY` debe estar
  válido y con saldo. Las imágenes NO se guardan en el disco del servidor.
- **SEED_DEMO=false** en producción → arranca sin contenido de demostración. En el primer
  arranque solo se crea el admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- Si tu dominio es **addon domain**, el docroot NO es `/home/USER/public_html`; ajusta la
  variable `PUB` en `install_server.sh` y `fix.sh` a la carpeta correcta del addon.
- El frontend se construye **en el servidor** con la URL del dominio (con límite de RAM y
  `CI=false`). Si tu VPS tuviera muy poca RAM y fallara el build, avísame y lo cambiamos a
  build en Emergent + commit de `frontend/build/`.
