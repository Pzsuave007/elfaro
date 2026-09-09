"""AI editorial assistant (GPT-5.4 via emergentintegrations)."""
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from core import now_iso, new_id
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
