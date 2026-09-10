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

EDITORIAL_SYSTEM_PROMPT = """Eres editor de El Foro In Oregon, una plataforma informativa NO partidista en español para la comunidad latina de Oregon.

REGLAS DE CONTENIDO:
- No promuevas ni ataques partidos, candidatos o ideologías. Separa hechos, declaraciones y opiniones.
- NO inventes datos. Nunca inventes nombres de personas, teléfonos, direcciones, fechas, montos, premios, estadísticas ni URLs. Si no lo sabes con certeza, no lo escribas.
- En temas legales, electorales, de salud, gobierno o asistencia, remite a fuentes oficiales.

REGLAS DE ESTILO (MUY IMPORTANTES):
- Escribe CONCRETO y ÚTIL. Cada párrafo debe dar información específica que ayude al lector: qué es, a quién aplica, qué hacer, dónde ir, qué documentos, cuánto cuesta, cuándo, cómo.
- PROHIBIDO el relleno y las generalidades vacías. Nada de frases de adorno tipo "el arte es una herramienta poderosa" o "la representación importa". Ve directo a la información.
- SÉ BREVE. Prefiere textos cortos y densos en información. NO alargues para alcanzar una longitud. Si no tienes suficiente información concreta y verificable, escribe menos.
- NUNCA escribas notas dirigidas al editor dentro del contenido (por ejemplo: "para una versión publicada conviene...", "se recomienda verificar...", "este artículo puede servir como punto de partida"). El texto es para el lector final.
- Español claro y accesible. Sin lenguaje sensacionalista ni emocional.
- Al comparar candidatos usa "Candidato A propone..." / "Candidato B propone...". Nunca declares quién es mejor."""

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


GROUND_MODEL = os.environ.get("AI_SEARCH_MODEL", "gemini-2.5-flash")


def _extract_citations(raw):
    """Extrae enlaces reales (fuentes) de la respuesta de Gemini con googleSearch."""
    out = []
    try:
        msg = raw.choices[0].message
        anns = getattr(msg, "annotations", None) or []
        for a in anns:
            uc = a.get("url_citation") if isinstance(a, dict) else getattr(a, "url_citation", None)
            if not uc:
                continue
            title = (uc.get("title") if isinstance(uc, dict) else getattr(uc, "title", "")) or ""
            url = (uc.get("url") if isinstance(uc, dict) else getattr(uc, "url", "")) or ""
            if url:
                out.append({"name": title or url, "url": url, "organization": "", "type": "Web", "date": ""})
    except Exception:
        pass
    seen, dedup = set(), []
    for c in out:
        if c["url"] not in seen:
            seen.add(c["url"])
            dedup.append(c)
    return dedup


async def _run_grounded(system: str, prompt: str):
    """Ejecuta Gemini con Google Search (grounding). Devuelve (texto, citas)."""
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="No hay clave de AI configurada")
    chat = (LlmChat(api_key=key, session_id=new_id(), system_message=system)
            .with_model("gemini", GROUND_MODEL)
            .with_tools([{"googleSearch": {}}]))
    try:
        resp = await chat.send_message_with_tools(UserMessage(text=prompt))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error de AI: {str(e)[:200]}")
    return (resp.content or ""), _extract_citations(resp.raw)


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

NO_INVENT = ("Reglas: NO inventes nombres de personas, teléfonos, direcciones, fechas, montos, premios, estadísticas ni URLs; "
             "si no lo sabes con certeza, omítelo (no lo rellenes con generalidades). Escribe CONCRETO y ÚTIL, sin relleno "
             "ni frases de adorno, y SÉ BREVE. Nunca escribas notas al editor dentro del texto. Si el editor te da datos, "
             "nombres o enlaces oficiales, úsalos como base y no los cambies.")

# Guía de concreción y longitud por tipo de contenido (para generate-post)
GEN_GUIDE = {
    "articles": ("El cuerpo debe ser CONCISO: 3 a 6 párrafos cortos, máximo ~450 palabras. Empieza con lo más útil. "
                 "Incluye información práctica y concreta (qué es, a quién le sirve, pasos, requisitos, cómo o dónde "
                 "obtener ayuda o más información). Si el tema pide nombres de personas o casos específicos que no "
                 "puedes verificar, NO los inventes: en su lugar escribe una guía práctica concreta (qué existe, cómo "
                 "encontrarlo, cómo participar o acceder). Nada de relleno ni frases de adorno."),
    "resources": ("Enfócate en información accionable: qué ofrece exactamente, quién califica, qué documentos se "
                  "necesitan y cómo aplicar paso a paso. Específico y breve."),
    "oregon-info": ("Explica en lenguaje sencillo y concreto: qué cambió, a quién afecta, cuándo y qué debe hacer la "
                    "persona, con pasos claros. Breve, sin relleno."),
    "places": ("Da información práctica del lugar: qué es, qué se puede hacer, ubicación general, horario/costo y "
               "accesibilidad si los conoces. Concreto y breve, sin adornos."),
}


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
    extra = f" Datos/instrucciones del editor: {req.instructions}." if req.instructions else ""
    prompt = (f"Busca en la web información REAL y actual sobre: \"{req.topic}\". "
              f"Contexto: estamos preparando {ctx} para la comunidad latina de Oregon.{extra}\n\n"
              f"Devuelve entre 4 y 6 resultados REALES encontrados en la búsqueda (noticias, artículos, publicaciones, "
              f"perfiles o páginas oficiales). Para cada resultado incluye:\n"
              f"- title: el tema/persona/organización específica y concreta (por ejemplo el nombre real de la persona o programa).\n"
              f"- summary: 2-3 frases con datos CONCRETOS de la fuente (qué, quién, dónde, cuándo).\n"
              f"- source: el nombre o dominio de la fuente.\n"
              f"Usa SOLO información real encontrada en la búsqueda. NUNCA inventes personas, datos ni fuentes. "
              f"Si no encuentras resultados reales suficientes, devuelve menos. "
              f'Responde SOLO con JSON: {{"options":[{{"title":"","summary":"","source":""}}]}}')
    content, cites = await _run_grounded(EDITORIAL_SYSTEM_PROMPT, prompt)
    data = _parse_json(content)
    options = data.get("options", []) or []
    # Adjunta el enlace real de la fuente a cada opción (heurística por orden) y una lista global.
    for i, opt in enumerate(options):
        if isinstance(opt, dict) and i < len(cites):
            opt["source_url"] = cites[i]["url"]
            if not opt.get("source"):
                opt["source"] = cites[i]["name"]
    return {"options": options, "sources": cites}


@ai_router.post("/generate-post")
async def generate_post(req: GenerateRequest, user: dict = Depends(get_current_user)):
    schema = GEN_SCHEMA.get(req.kind)
    if not schema:
        raise HTTPException(status_code=400, detail="Tipo de contenido no válido")
    sel = req.selection or {}
    ctx = KIND_CONTEXT.get(req.kind, "contenido informativo")
    guide = GEN_GUIDE.get(req.kind, "")
    extra = f" Datos/instrucciones del editor (úsalos como base, no inventes más allá de esto): {req.instructions}." if req.instructions else ""
    src_line = f"\nFuente encontrada: {sel.get('source','')} {sel.get('source_url','')}" if (sel.get('source') or sel.get('source_url')) else ""
    prompt = (f"Investiga en la web y crea un BORRADOR completo de {ctx} basado en este resultado elegido:\n"
              f"Tema/título: {sel.get('title','')}\nResumen: {sel.get('summary','')}{src_line}\n"
              f"Tema general: {req.topic}.{extra}\n\n"
              f"Usa información REAL y verificable encontrada en la búsqueda web. Incluye datos concretos (nombres, "
              f"lugares, fechas, cifras) SOLO si aparecen en fuentes reales. NO inventes nada.\n\n{guide}\n\n{NO_INVENT}\n\n"
              f"Rellena TODOS los campos posibles con información concreta y útil (sin relleno). "
              f"Responde SOLO con JSON con esta forma exacta:\n{schema}")
    content, cites = await _run_grounded(EDITORIAL_SYSTEM_PROMPT, prompt)
    fields = _parse_json(content)
    if not isinstance(fields, dict):
        fields = {}
    # Normaliza campos: la AI a veces devuelve listas/objetos o markdown para campos de texto.
    KEEP_LIST = {"tags", "sources", "gallery"}
    for k, v in list(fields.items()):
        if k in KEEP_LIST:
            continue
        if isinstance(v, list):
            v = "\n".join(str(x) for x in v)
        elif isinstance(v, dict):
            v = "\n".join(f"{kk}: {vv}" for kk, vv in v.items())
        if isinstance(v, str):
            fields[k] = v.replace("**", "").replace("* ", "- ")
    fields["used_ai"] = True
    fields["status"] = "draft"
    if cites:
        fields["sources"] = cites[:6]
        if "official_source" in schema and not fields.get("official_source"):
            fields["official_source"] = cites[0]["url"]
    return {"fields": fields}


STYLE_PREFIX = {
    "comic": ("Modern digital comic book / pop-art illustration. Bold, clean, crisp black ink outlines of even weight; "
              "vibrant saturated flat colors; prominent Ben-Day halftone dot shading and halftone gradients in skies and "
              "shadows; smooth cel shading; sharp high-quality vector-like linework; well-proportioned faces and correct, "
              "clean anatomy; dynamic polished composition. Professional pop-art comic look. NOT painterly, NOT faded, "
              "NOT sketchy, no cross-hatching. A single clear scene. "
              "NO text, NO words, NO speech bubbles, NO captions, no logos, no watermarks. "),
    "illustration": ("Editorial illustration, warm flat vector style, clean shapes, soft harmonious palette, subtle "
                     "texture, culturally relevant, no text, no words, no logos, no watermarks. "),
    "photo": ("Documentary-style realistic photograph, editorial, natural lighting, no text, no logos, no watermarks. "),
}


async def _gen_and_store(styled_prompt: str, user: dict) -> str:
    from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
    from storage import put_object
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="No hay clave de AI configurada")
    try:
        image_gen = OpenAIImageGeneration(api_key=key)
        images = await image_gen.generate_images(prompt=styled_prompt, model="gpt-image-1", number_of_images=1, quality="high")
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
    return f"/api/media/file/{result['path']}"


@ai_router.post("/image")
async def generate_image(req: ImageRequest, user: dict = Depends(get_current_user)):
    styled = STYLE_PREFIX["photo"] + req.prompt
    url = await _gen_and_store(styled, user)
    return {"url": url}


class IllustrateRequest(BaseModel):
    kind: Optional[str] = "articles"
    title: str = ""
    summary: str = ""
    body: str = ""
    style: Optional[str] = "comic"   # comic | illustration | photo
    custom_prompt: Optional[str] = ""


@ai_router.post("/illustrate")
async def illustrate(req: IllustrateRequest, user: dict = Depends(get_current_user)):
    """Genera una ilustración (o foto) que escenifica el artículo. Crea la descripción visual a partir del contenido."""
    scene = (req.custom_prompt or "").strip()
    if not scene:
        ctx_txt = f"Título: {req.title}\nResumen: {req.summary}\nExtracto: {(req.body or '')[:800]}"
        prompt = ("A partir de este contenido de un artículo para la comunidad latina de Oregon, escribe UNA descripción "
                  "visual en INGLÉS (1-2 oraciones) para ilustrarlo. Describe UNA sola escena concreta, representativa y "
                  "respetuosa, con un momento narrativo claro que se entienda de un vistazo. Sin texto, sin palabras, sin "
                  f"logos ni marcas de agua. Devuelve SOLO la descripción, sin comillas.\n\n{ctx_txt}")
        scene = (await _run(EDITORIAL_SYSTEM_PROMPT, prompt)).strip()
    if not scene:
        raise HTTPException(status_code=400, detail="No hay suficiente contenido para ilustrar")
    prefix = STYLE_PREFIX.get(req.style, STYLE_PREFIX["comic"])
    url = await _gen_and_store(prefix + scene, user)
    return {"url": url, "prompt": scene}
