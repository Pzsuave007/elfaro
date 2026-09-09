"""AI editorial assistant (GPT-5.4 via emergentintegrations)."""
import os
import json
import base64
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from core import now_iso, new_id, db
from auth import get_current_user

from emergentintegrations.llm.chat import LlmChat, UserMessage

ai_router = APIRouter(prefix="/api/ai", tags=["ai"])

EDITORIAL_SYSTEM_PROMPT = """El Foro In Oregon es una plataforma informativa no partidista.

Nunca debes promover o atacar partidos políticos, candidatos o ideologías.

Presenta información verificable y separa hechos, declaraciones y opiniones.

No inventes datos.

Cuando un dato no esté confirmado, debes indicarlo.

Nunca elimines referencias importantes.

En temas legales, electorales, de salud, gobierno o asistencia pública, incentiva el uso de fuentes oficiales.

Escribe en español claro y accesible para la comunidad latina de Oregon.

Evita lenguaje político cargado, sensacionalista o emocional.

Cuando compares candidatos usa estructuras neutrales como "Candidato A propone..." y "Candidato B propone...". Nunca declares quién es mejor."""

# action -> instruction template
ACTIONS: Dict[str, str] = {
    "draft": "Crea un borrador de artículo periodístico completo en español a partir de las siguientes notas o instrucciones. Incluye párrafos bien organizados.",
    "expand": "Expande y desarrolla el siguiente contenido manteniendo el tono informativo y los hechos.",
    "summarize": "Crea un resumen claro y conciso del siguiente contenido.",
    "rewrite": "Reescribe el siguiente contenido mejorando la claridad y el flujo, sin cambiar los hechos.",
    "simplify": "Simplifica el siguiente contenido a un lenguaje sencillo y accesible para toda la comunidad.",
    "grammar": "Corrige la gramática y ortografía del siguiente texto sin cambiar su significado.",
    "headline": "Propón un titular claro, informativo y no sensacionalista para el siguiente contenido. Devuelve solo el titular.",
    "subheadline": "Propón un subtítulo informativo para el siguiente contenido. Devuelve solo el subtítulo.",
    "meta_description": "Escribe una meta descripción SEO de máximo 155 caracteres para el siguiente contenido. Devuelve solo el texto.",
    "seo_title": "Escribe un título SEO de máximo 60 caracteres para el siguiente contenido. Devuelve solo el texto.",
    "excerpt": "Escribe un resumen corto (extracto) de 1-2 oraciones para el siguiente contenido.",
    "social_caption": "Escribe un texto breve y neutral para redes sociales sobre el siguiente contenido.",
    "short_version": "Crea una versión corta del siguiente contenido para lectura rápida.",
    "translate": "Traduce el siguiente contenido al inglés manteniendo el tono informativo.",
    "organize": "Organiza y estructura el siguiente contenido con encabezados y listas cuando sea apropiado.",
}

# structured JSON actions
JSON_ACTIONS = {
    "tags": 'Sugiere entre 4 y 8 etiquetas (tags) relevantes para el siguiente contenido. Responde SOLO con JSON: {"tags": ["...", "..."]}',
    "explain_law": ('Analiza la siguiente información oficial sobre una ley o regulación de Oregon y explícala en lenguaje sencillo. '
                     'MANTÉN todos los links y referencias de las fuentes originales. NUNCA inventes leyes, fechas o requisitos. '
                     'Responde SOLO con JSON: {"que_cambio": "...", "a_quien_afecta": "...", "cuando_entra_en_vigor": "...", "que_necesitas_hacer": "...", "resumen": "..."}'),
    "extract_resource": ('Extrae información estructurada del siguiente texto de una organización o página gubernamental. '
                         'Si un campo no aparece, déjalo como cadena vacía. NO inventes datos. '
                         'Responde SOLO con JSON: {"title": "", "organization": "", "what_offers": "", "who_helps": "", "requirements": "", "documents": "", "how_to_apply": "", "phone": "", "email": "", "website": "", "address": "", "city": ""}'),
    "generate_questions": ('Genera preguntas neutrales e imparciales para hacer a candidatos electorales sobre el tema indicado. '
                           'Las preguntas deben ser equivalentes y justas para todos. '
                           'Responde SOLO con JSON: {"questions": ["...", "..."]}'),
    "compare_candidates": ('Compara de manera FACTUAL y NEUTRAL las propuestas de los candidatos en el siguiente contenido. '
                           'Usa "Candidato A propone...", "Candidato B propone...". NUNCA declares quién es mejor. '
                           'Responde SOLO con JSON: {"comparison": "..."}'),
}


class AIRequest(BaseModel):
    action: str
    content: str = ""
    instructions: Optional[str] = ""
    context: Optional[Dict[str, Any]] = None


def _get_ai_key():
    own = (os.environ.get("OPENAI_API_KEY") or "").strip()
    return own or os.environ.get("EMERGENT_LLM_KEY")


async def _run(system: str, prompt: str) -> str:
    key = _get_ai_key()
    if not key:
        raise HTTPException(status_code=500, detail="No hay clave de AI configurada")
    model = os.environ.get("AI_MODEL", "gpt-5.4")
    chat = LlmChat(api_key=key, session_id=new_id(), system_message=system).with_model("openai", model)
    try:
        return await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error de AI: {str(e)[:200]}")


def _parse_json(text: str):
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```")[1] if "```" in t[3:] else t.strip("`")
        t = t.replace("json", "", 1).strip() if t.lower().startswith("json") else t
    start, end = t.find("{"), t.rfind("}")
    if start != -1 and end != -1:
        t = t[start:end + 1]
    try:
        return json.loads(t)
    except Exception:
        return {"raw": text}


@ai_router.post("/assist")
async def assist(req: AIRequest, user: dict = Depends(get_current_user)):
    action = req.action
    extra = f"\n\nInstrucciones adicionales del editor: {req.instructions}" if req.instructions else ""

    if action in JSON_ACTIONS:
        prompt = f"{JSON_ACTIONS[action]}{extra}\n\nContenido:\n{req.content}"
        raw = await _run(EDITORIAL_SYSTEM_PROMPT, prompt)
        return {"action": action, "structured": True, "result": _parse_json(raw)}

    if action not in ACTIONS:
        raise HTTPException(status_code=400, detail="Acción de AI no válida")
    prompt = f"{ACTIONS[action]}{extra}\n\nContenido:\n{req.content}"
    raw = await _run(EDITORIAL_SYSTEM_PROMPT, prompt)
    return {"action": action, "structured": False, "result": raw.strip()}



# ---------- Research → options → generate post ----------
KIND_CONTEXT = {
    "articles": "una historia o artículo evergreen (que no caduca) para la comunidad latina de Oregon",
    "resources": "un recurso comunitario o programa de ayuda disponible en Oregon",
    "oregon-info": "una guía que explica una ley, trámite, derecho o tema de gobierno de Oregon en lenguaje sencillo",
    "places": "un lugar importante de Oregon (parque estatal, museo, sitio histórico, institución pública, recurso natural)",
}

# JSON field schema the AI must fill per kind (draft)
GEN_SCHEMA = {
    "articles": '{"title":"","subtitle":"","summary":"","body":"(varios párrafos separados por dobles saltos de línea)","tags":["",""],"category":"(una de: Oregon, Gobierno, Comunidad, Educación, Economía, Inmigración, Vivienda, Salud, Seguridad)","content_type":"Información pública","seo_title":"","seo_description":"","image_prompt":"(descripción en inglés para generar una foto documental realista, sin texto ni logos)"}',
    "resources": '{"title":"","organization":"","summary":"","what_offers":"","who_helps":"","requirements":"","documents":"","how_to_apply":"","city":"","category":"(una de: Vivienda, Salud, Alimentos, Empleo, Educación, Familias, Inmigración, Asistencia legal, Transporte, Servicios públicos, Emergencias)","official_source":"(URL oficial solo si la conoces con certeza, si no deja vacío)","image_prompt":"(foto documental realista en inglés, sin texto)"}',
    "oregon-info": '{"title":"","summary":"","que_cambio":"","a_quien_afecta":"","cuando_entra_en_vigor":"","que_necesitas_hacer":"","official_source":"(URL oficial solo si la conoces con certeza, si no deja vacío)","category":"(una de: Leyes, Gobierno, Impuestos, Trabajo, Vivienda, Educación, Salud, Tránsito, Licencias, Elecciones, Derechos, Servicios públicos)","image_prompt":"(foto documental realista en inglés, sin texto)"}',
    "places": '{"title":"","summary":"","description":"","history":"","location":"","hours":"","cost":"","accessibility":"","parking":"","rules":"","services":"","city":"","category":"(una de: Parques estatales, Historia, Ciudades, Museos, Recursos naturales, Lugares culturales, Lugares importantes)","official_source":"(URL oficial solo si la conoces con certeza, si no deja vacío)","image_prompt":"(foto documental realista del lugar en inglés, sin texto)"}',
}

NO_INVENT = ("MUY IMPORTANTE: No inventes datos específicos (teléfonos, direcciones, fechas exactas, montos, URLs). "
             "Si no conoces un dato con certeza, deja ese campo vacío. En temas legales, de salud, gobierno o recursos, "
             "recuerda al lector consultar la fuente oficial. Escribe en español claro para la comunidad latina de Oregon.")


class ResearchRequest(BaseModel):
    kind: str
    topic: str
    instructions: Optional[str] = ""


class GenerateRequest(BaseModel):
    kind: str
    topic: str
    selection: Dict[str, Any]  # chosen option {title, angle, summary}
    instructions: Optional[str] = ""


class ImageRequest(BaseModel):
    prompt: str


class HeroTextRequest(BaseModel):
    instructions: Optional[str] = ""


@ai_router.post("/hero-text")
async def hero_text(req: HeroTextRequest, user: dict = Depends(get_current_user)):
    extra = f" Instrucciones del editor: {req.instructions}." if req.instructions else ""
    prompt = ("Eres editor de El Foro In Oregon, una plataforma informativa NO partidista en español para la comunidad "
              "latina de Oregon. Propón 4 versiones DISTINTAS del texto de la portada (hero) del sitio.{extra} "
              "Cada versión debe tener: eyebrow (frase corta superior, máx 8 palabras), title (título principal claro y "
              "acogedor, no sensacionalista, máx 14 palabras) y subtitle (1 oración que resuma qué ofrece el sitio). "
              "Tono cálido, claro y confiable. Nunca lenguaje político ni promesas. "
              'Responde SOLO con JSON: {{"options":[{{"eyebrow":"","title":"","subtitle":""}}]}}').format(extra=extra)
    raw = await _run(EDITORIAL_SYSTEM_PROMPT, prompt)
    data = _parse_json(raw)
    return {"options": data.get("options", [])}


@ai_router.post("/research")
async def research(req: ResearchRequest, user: dict = Depends(get_current_user)):
    ctx = KIND_CONTEXT.get(req.kind, "un contenido informativo para la comunidad de Oregon")
    extra = f" Instrucciones del editor: {req.instructions}." if req.instructions else ""
    prompt = (f"Actúa como asistente de investigación editorial. Sobre el tema \"{req.topic}\", "
              f"propón 4 opciones DISTINTAS de {ctx}.{extra} "
              f"Para cada opción incluye: title (título claro y no sensacionalista), angle (el enfoque en pocas palabras) "
              f"y summary (1-2 oraciones). {NO_INVENT} "
              f'Responde SOLO con JSON: {{"options":[{{"title":"","angle":"","summary":""}}]}}')
    raw = await _run(EDITORIAL_SYSTEM_PROMPT, prompt)
    data = _parse_json(raw)
    return {"options": data.get("options", [])}


@ai_router.post("/generate-post")
async def generate_post(req: GenerateRequest, user: dict = Depends(get_current_user)):
    schema = GEN_SCHEMA.get(req.kind)
    if not schema:
        raise HTTPException(status_code=400, detail="Tipo de contenido no válido")
    sel = req.selection or {}
    ctx = KIND_CONTEXT.get(req.kind, "contenido informativo")
    extra = f" Instrucciones del editor: {req.instructions}." if req.instructions else ""
    prompt = (f"Crea un BORRADOR completo de {ctx} basado en esta opción elegida:\n"
              f"Título: {sel.get('title','')}\nEnfoque: {sel.get('angle','')}\nResumen: {sel.get('summary','')}\n"
              f"Tema general: {req.topic}.{extra}\n\n{NO_INVENT}\n\n"
              f"Rellena TODOS los campos posibles. Responde SOLO con JSON con esta forma exacta:\n{schema}")
    raw = await _run(EDITORIAL_SYSTEM_PROMPT, prompt)
    fields = _parse_json(raw)
    fields["used_ai"] = True
    fields["status"] = "draft"
    return {"fields": fields}


@ai_router.post("/image")
async def generate_image(req: ImageRequest, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
    from storage import put_object
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="No hay clave de AI configurada")
    styled = (f"Documentary-style realistic photograph, editorial, natural lighting, no text, no logos, no watermarks. "
              f"{req.prompt}")
    try:
        image_gen = OpenAIImageGeneration(api_key=key)
        images = await image_gen.generate_images(prompt=styled, model="gpt-image-1", number_of_images=1)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al generar imagen: {str(e)[:200]}")
    if not images:
        raise HTTPException(status_code=502, detail="No se generó ninguna imagen")
    data = images[0]
    path = f"elforo-oregon/ai-images/{user['id']}/{new_id()}.png"
    result = put_object(path, data, "image/png")
    doc = {"id": new_id(), "storage_path": result["path"], "original_filename": "ai-generada.png",
           "content_type": "image/png", "size": result.get("size", len(data)), "kind": "image",
           "uploaded_by": user["id"], "is_deleted": False, "ai_generated": True, "created_at": now_iso()}
    await db.media.insert_one(doc)
    return {"url": f"/api/media/file/{result['path']}"}
