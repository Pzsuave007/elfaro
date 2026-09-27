# Guía de generación de ilustraciones con AI (para otro agente / webapp)

Este documento describe EXACTAMENTE cómo generar las ilustraciones tipo cómic,
ilustración editorial y foto documental que se usan en "El Faro en Oregon".
Copia y pega esto tal cual a tu otro agente.

---

## 1. Modelo e infraestructura

- **Modelo de imagen:** `gpt-image-1` (OpenAI).
- **Generación desde texto:** endpoint `POST https://api.openai.com/v1/images/generations`
  (o vía `litellm.image_generation` con `model="openai/gpt-image-1"`).
- **Edición con imagen de referencia (foto → cómic):** endpoint
  `POST https://api.openai.com/v1/images/edits` (multipart/form-data).
- **Parámetros:**
  - `quality`: `"medium"` (opciones válidas: low | medium | high | auto)
  - `size`: `"1536x1024"` para generación (horizontal); `"auto"` para edición con referencia
    (opciones: 1024x1024 | 1536x1024 | 1024x1536 | auto)
  - `n`: 1
  - Salida: base64 en `data[0].b64_json`
  - IMPORTANTE: NO enviar el parámetro `response_format` con gpt-image-1 (da error 400).

---

## 2. Prompt final = ESTILO + ESCENA

El prompt que se envía al modelo SIEMPRE es la concatenación de:
1. Un **prefijo de ESTILO** (elige uno de los 3 de abajo), y
2. Una **ESCENA** concreta (1-2 oraciones en inglés describiendo qué se ve).

---

## 3. Prefijos de ESTILO (texto exacto)

### 🎨 COMIC (comic book moderno)
```
Modern digital comic book illustration. Bold, clean, crisp black ink outlines of even weight; FULL COLOR with a natural, realistic color palette and true-to-life skin tones and natural lighting; subtle Ben-Day halftone dot shading; smooth cel shading; sharp high-quality vector-like linework; well-proportioned faces and correct, clean anatomy; dynamic polished composition. Professional comic-book look. NOT oversaturated, NOT painterly, NOT faded, NOT sketchy, no cross-hatching. A single clear scene. NO text, NO words, NO speech bubbles, NO captions, no logos, no watermarks. 
```

### ✏️ ILLUSTRATION (ilustración editorial plana)
```
Editorial illustration, warm flat vector style, clean shapes, soft harmonious palette, subtle texture, culturally relevant, no text, no words, no logos, no watermarks. 
```

### 📷 PHOTO (foto documental realista)
```
Documentary-style realistic photograph, editorial, natural lighting, no text, no logos, no watermarks. 
```

---

## 4. Cómo se obtiene la ESCENA

Opción A — la escribe la persona (texto libre en inglés).

Opción B — la genera un modelo de texto a partir del artículo, con esta instrucción exacta:
```
A partir de este contenido de un artículo para la comunidad latina de Oregon, escribe UNA descripción visual en INGLÉS (1-2 oraciones) para ilustrarlo. Describe UNA sola escena concreta, representativa y respetuosa, con un momento narrativo claro que se entienda de un vistazo. Sin texto, sin palabras, sin logos ni marcas de agua. Devuelve SOLO la descripción, sin comillas.

Título: {titulo}
Resumen: {resumen}
Extracto: {primeros_800_caracteres_del_cuerpo}
```

---

## 5. Edición con imagen de referencia (convertir una foto a cómic/ilustración)

Prompt final = PREFIJO_DE_ESTILO + una de estas instrucciones:

- Para COMIC:
```
Recreate the SAME scene, people, poses, clothing and composition as the provided reference photo, but redrawn in the comic-book style described above. Keep faces and likeness as close to the reference as possible.
```
- Para ILLUSTRATION:
```
Recreate the SAME scene, people, poses and composition as the provided reference photo in the flat editorial illustration style described above. Keep the likeness close to the reference.
```
- Para PHOTO:
```
Enhance/restyle the provided reference photo as a clean documentary editorial photograph. Keep the same scene, people, poses and composition; improve lighting and clarity.
```

Para RE-EDITAR una imagen ya generada (ej. "cambia el fondo a un parque"):
```
Edit the provided image keeping the overall scene and style, applying ONLY this change: {instruccion_del_usuario}. No text, no words, no logos, no watermarks.
```

---

## 6. Código Python — Generación desde texto (con clave OpenAI del usuario)

```python
import base64, requests

def generar_imagen(prompt_final, openai_api_key, size="1536x1024"):
    r = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={"Authorization": f"Bearer {openai_api_key}"},
        json={"model": "gpt-image-1", "prompt": prompt_final,
              "n": 1, "quality": "medium", "size": size},
        timeout=180,
    )
    r.raise_for_status()
    b64 = r.json()["data"][0]["b64_json"]
    return base64.b64decode(b64)   # bytes PNG

# Ejemplo:
ESTILO_COMIC = "Modern digital comic book illustration. Bold, clean, crisp black ink outlines of even weight; FULL COLOR with a natural, realistic color palette and true-to-life skin tones and natural lighting; subtle Ben-Day halftone dot shading; smooth cel shading; sharp high-quality vector-like linework; well-proportioned faces and correct, clean anatomy; dynamic polished composition. Professional comic-book look. NOT oversaturated, NOT painterly, NOT faded, NOT sketchy, no cross-hatching. A single clear scene. NO text, NO words, NO speech bubbles, NO captions, no logos, no watermarks. "
escena = "A family reviewing housing documents at a community center table, a helper pointing to a form, warm daylight through a window."
img_bytes = generar_imagen(ESTILO_COMIC + escena, "sk-...")
```

---

## 7. Código Python — Edición con imagen de referencia

```python
import base64, requests

def editar_imagen(prompt_final, image_png_bytes, openai_api_key, size="auto"):
    files = {"image": ("ref.png", image_png_bytes, "image/png")}
    data = {"model": "gpt-image-1", "prompt": prompt_final,
            "size": size, "quality": "medium", "n": "1"}
    r = requests.post(
        "https://api.openai.com/v1/images/edits",
        headers={"Authorization": f"Bearer {openai_api_key}"},
        files=files, data=data, timeout=180,
    )
    r.raise_for_status()
    b64 = r.json()["data"][0]["b64_json"]
    return base64.b64decode(b64)   # bytes PNG
```
Nota: convierte la imagen de referencia a PNG (RGBA) y redúcela a un ancho máx ~1536px antes de enviarla.

---

## 8. Ejemplo de prompt COMPLETO (listo para pegar en el modelo)

```
Modern digital comic book illustration. Bold, clean, crisp black ink outlines of even weight; FULL COLOR with a natural, realistic color palette and true-to-life skin tones and natural lighting; subtle Ben-Day halftone dot shading; smooth cel shading; sharp high-quality vector-like linework; well-proportioned faces and correct, clean anatomy; dynamic polished composition. Professional comic-book look. NOT oversaturated, NOT painterly, NOT faded, NOT sketchy, no cross-hatching. A single clear scene. NO text, NO words, NO speech bubbles, NO captions, no logos, no watermarks. A young Latina teacher helping two students with a book in a bright classroom, colorful posters on the wall, warm afternoon light.
```
