"""Demo content seeding. All demo content marked is_demo=True."""
from core import db, now_iso, new_id, slugify

IMG = {
    "housing": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "health": "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "family": "https://images.unsplash.com/photo-1611024847487-e26177381a3f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "capitol": "https://images.unsplash.com/photo-1608277803254-df3c69fef2f9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "portland": "https://images.unsplash.com/photo-1590866249433-0310439fdab9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "forest": "https://images.unsplash.com/photo-1530563937443-1f02f662fa5c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "falls": "https://images.unsplash.com/photo-1697490595762-adbe33c26d2f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "mountains": "https://images.unsplash.com/photo-1638176818276-a4e90c753da6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "education": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "candidate1": "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "candidate2": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "candidate3": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "candidate4": "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
}


def _doc(title, **kw):
    return {"id": new_id(), "slug": slugify(title), "title": title, "status": "published",
            "views": 0, "is_demo": True, "created_at": now_iso(), "updated_at": now_iso(),
            "published_at": now_iso(), **kw}


async def seed_demo():
    if await db.articles.count_documents({"is_demo": True}) > 0:
        return

    articles = [
        _doc("Oregon amplía la ayuda para el pago de renta en 2026",
             subtitle="Nuevos fondos estatales buscan prevenir desalojos en comunidades de bajos ingresos",
             category="Vivienda", content_type="Noticias", featured=True,
             featured_image=IMG["housing"], reading_time=5, city="Portland", county="Multnomah",
             tags=["renta", "vivienda", "asistencia"], used_ai=False,
             summary="El estado destinó nuevos recursos para asistencia de renta. Te explicamos quién califica y cómo solicitar.",
             body="El estado de Oregon anunció una ampliación de los fondos de asistencia para el pago de renta dirigidos a familias de bajos ingresos. Este programa busca reducir los desalojos y estabilizar a la comunidad.\n\nLas familias que ganan menos del 80% del ingreso medio del área podrían calificar. La solicitud se realiza a través de las agencias comunitarias locales.\n\nEste es contenido de demostración para mostrar el formato editorial de la plataforma.",
             sources=[{"name": "Oregon Housing and Community Services", "url": "https://www.oregon.gov/ohcs", "organization": "Agencia estatal", "type": "Agencia estatal", "date": "2026-01-15"}]),
        _doc("Clínicas comunitarias ofrecen servicios de salud gratuitos en el Valle de Willamette",
             subtitle="Varias organizaciones amplían el acceso a chequeos y vacunas sin costo",
             category="Salud", content_type="Noticias", featured=True,
             featured_image=IMG["health"], reading_time=4, city="Salem", county="Marion",
             tags=["salud", "clínicas", "gratis"], used_ai=False,
             summary="Conoce dónde encontrar servicios de salud gratuitos o de bajo costo en tu comunidad.",
             body="Diversas clínicas comunitarias del Valle de Willamette están ofreciendo servicios de salud gratuitos o de bajo costo, incluyendo chequeos generales y vacunas.\n\nEstos servicios están disponibles sin importar el estatus migratorio. Contenido de demostración.",
             sources=[{"name": "Oregon Health Authority", "url": "https://www.oregon.gov/oha", "organization": "Agencia estatal", "type": "Agencia estatal", "date": "2026-02-01"}]),
        _doc("Cómo participar en las juntas escolares de tu distrito",
             subtitle="Una guía sobre cómo las familias latinas pueden involucrarse en la educación",
             category="Educación", content_type="Análisis", featured=False,
             featured_image=IMG["education"], reading_time=6, city="Beaverton", county="Washington",
             tags=["educación", "juntas escolares", "participación"], used_ai=True,
             summary="Participar en las juntas escolares te da voz en decisiones que afectan a tus hijos.",
             body="Las juntas escolares toman decisiones importantes sobre el presupuesto, los programas y las políticas de las escuelas. Las familias tienen derecho a participar y expresar sus opiniones.\n\nContenido de demostración creado para ilustrar el formato.",
             sources=[{"name": "Oregon Department of Education", "url": "https://www.oregon.gov/ode", "organization": "Agencia estatal", "type": "Agencia estatal", "date": "2026-01-20"}]),
    ]
    await db.articles.insert_many(articles)

    resources = [
        _doc("Asistencia de Emergencia para el Pago de Renta",
             category="Vivienda", featured_image=IMG["housing"],
             organization="Community Action Program", program_type="Asistencia financiera",
             who_helps="Familias de bajos ingresos en riesgo de desalojo",
             requirements="Comprobante de ingresos, aviso de renta atrasada, identificación",
             what_offers="Pago de hasta 3 meses de renta atrasada",
             documents="Identificación, comprobante de domicilio, aviso de desalojo si aplica",
             how_to_apply="Llama a la línea de asistencia o visita la oficina local",
             phone="211", email="ayuda@example.org", website="https://www.211info.org",
             address="123 Main St", city="Portland", county="Multnomah", state="Oregon",
             languages="Español, Inglés", last_verified="2026-02-10",
             official_source="https://www.211info.org",
             summary="Ayuda económica para familias en riesgo de perder su vivienda.",
             sources=[{"name": "211info", "url": "https://www.211info.org", "type": "Organización"}]),
        _doc("Programa de Alimentos para Familias (SNAP)",
             category="Alimentos", featured_image=IMG["family"],
             organization="Oregon Department of Human Services", program_type="Beneficios de alimentos",
             who_helps="Familias e individuos de bajos ingresos",
             requirements="Cumplir con los límites de ingresos del hogar",
             what_offers="Beneficios mensuales para comprar alimentos",
             documents="Identificación, comprobante de ingresos, número de seguro social si aplica",
             how_to_apply="Solicita en línea o en la oficina local del DHS",
             phone="1-800-699-9075", email="", website="https://www.oregon.gov/dhs",
             address="", city="Salem", county="Marion", state="Oregon",
             languages="Español, Inglés", last_verified="2026-02-05",
             official_source="https://www.oregon.gov/dhs",
             summary="Beneficios mensuales para comprar alimentos para tu familia.",
             sources=[{"name": "Oregon DHS", "url": "https://www.oregon.gov/dhs", "type": "Agencia estatal"}]),
        _doc("Servicios Legales Gratuitos de Inmigración",
             category="Asistencia legal", featured_image=IMG["capitol"],
             organization="Immigration Counseling Service", program_type="Asesoría legal",
             who_helps="Inmigrantes que necesitan orientación legal",
             requirements="Cita previa",
             what_offers="Consultas legales gratuitas y representación en algunos casos",
             documents="Documentos relacionados con tu caso migratorio",
             how_to_apply="Agenda una cita por teléfono",
             phone="503-221-1689", email="info@example.org", website="https://example.org",
             address="", city="Portland", county="Multnomah", state="Oregon",
             languages="Español, Inglés", last_verified="2026-01-28",
             official_source="https://example.org",
             summary="Orientación legal gratuita para asuntos de inmigración.",
             sources=[{"name": "ICS", "url": "https://example.org", "type": "Organización"}]),
    ]
    await db.resources.insert_many(resources)

    oregon_info = [
        _doc("Nueva ley de licencias de conducir en Oregon",
             category="Licencias", featured_image=IMG["portland"], reading_time=4,
             tags=["licencia", "conducir", "DMV"], used_ai=True,
             summary="Cambios en el proceso para obtener licencia de conducir en Oregon.",
             que_cambio="Se ampliaron las opciones de documentos aceptados para solicitar la licencia de conducir estándar.",
             a_quien_afecta="A todas las personas que necesitan obtener o renovar su licencia, sin importar su estatus migratorio.",
             cuando_entra_en_vigor="1 de enero de 2026",
             que_necesitas_hacer="Reúne tus documentos de identidad y residencia, y agenda una cita en el DMV.",
             official_source="https://www.oregon.gov/odot/dmv",
             body="Esta es una explicación en lenguaje sencillo de los cambios en las licencias de conducir. Contenido de demostración.",
             sources=[{"name": "Oregon DMV", "url": "https://www.oregon.gov/odot/dmv", "type": "Agencia estatal"}]),
        _doc("Tus derechos como inquilino en Oregon",
             category="Derechos", featured_image=IMG["housing"], reading_time=5,
             tags=["derechos", "inquilino", "renta"], used_ai=False,
             summary="Conoce tus derechos básicos como inquilino en el estado.",
             que_cambio="Se reforzaron las protecciones contra los aumentos excesivos de renta.",
             a_quien_afecta="A todos los inquilinos que rentan vivienda en Oregon.",
             cuando_entra_en_vigor="Vigente actualmente",
             que_necesitas_hacer="Conoce el límite anual de aumento de renta y guarda todos tus recibos y contratos.",
             official_source="https://www.oregon.gov/ohcs",
             body="Explicación de los derechos de los inquilinos en Oregon. Contenido de demostración.",
             sources=[{"name": "Oregon Housing", "url": "https://www.oregon.gov/ohcs", "type": "Agencia estatal"}]),
        _doc("Cómo registrarte para votar en Oregon",
             category="Elecciones", featured_image=IMG["capitol"], reading_time=3,
             tags=["elecciones", "votar", "registro"], used_ai=False,
             summary="Guía sencilla para registrarte y participar en las elecciones.",
             que_cambio="Oregon cuenta con registro automático de votantes al tramitar la licencia de conducir.",
             a_quien_afecta="A todos los ciudadanos estadounidenses mayores de 18 años residentes en Oregon.",
             cuando_entra_en_vigor="Vigente actualmente",
             que_necesitas_hacer="Verifica tu registro en línea y actualiza tu dirección si te mudaste.",
             official_source="https://sos.oregon.gov/voting",
             body="Guía para registrarte para votar en Oregon. Contenido de demostración.",
             sources=[{"name": "Oregon Secretary of State", "url": "https://sos.oregon.gov/voting", "type": "Agencia estatal"}]),
    ]
    await db.oregon_info.insert_many(oregon_info)

    places = [
        _doc("Silver Falls State Park",
             category="Parques estatales", featured_image=IMG["falls"],
             gallery=[IMG["falls"], IMG["forest"]], city="Silverton", county="Marion",
             description="Uno de los parques estatales más grandes de Oregon, famoso por su sendero de las diez cascadas.",
             history="Establecido en 1933, es conocido como la 'joya' del sistema de parques estatales de Oregon.",
             location="20024 Silver Falls Hwy SE, Sublimity, OR",
             hours="Diariamente de amanecer a atardecer", cost="$5 por vehículo",
             accessibility="Algunas áreas y senderos son accesibles para sillas de ruedas",
             parking="Estacionamiento amplio disponible",
             rules="No se permiten mascotas en el Trail of Ten Falls",
             services="Baños, áreas de picnic, camping",
             summary="El parque estatal de las diez cascadas, ideal para conocer la naturaleza de Oregon.",
             official_source="https://stateparks.oregon.gov",
             sources=[{"name": "Oregon State Parks", "url": "https://stateparks.oregon.gov", "type": "Agencia estatal"}]),
        _doc("Capitolio del Estado de Oregon",
             category="Instituciones públicas", featured_image=IMG["capitol"],
             gallery=[IMG["capitol"]], city="Salem", county="Marion",
             description="La sede del gobierno estatal de Oregon, ubicada en Salem.",
             history="El edificio actual se completó en 1938 y es reconocido por su estatua dorada del Pionero de Oregon.",
             location="900 Court St NE, Salem, OR",
             hours="Lunes a viernes de 8am a 5pm", cost="Gratis",
             accessibility="Totalmente accesible", parking="Estacionamiento público cercano",
             rules="Revisión de seguridad al ingresar", services="Visitas guiadas gratuitas",
             summary="Conoce dónde se toman las decisiones del gobierno estatal de Oregon.",
             official_source="https://www.oregonlegislature.gov",
             sources=[{"name": "Oregon Legislature", "url": "https://www.oregonlegislature.gov", "type": "Gobierno"}]),
        _doc("Monte Hood",
             category="Recursos naturales", featured_image=IMG["mountains"],
             gallery=[IMG["mountains"], IMG["forest"]], city="Government Camp", county="Clackamas",
             description="El pico más alto de Oregon y un importante recurso natural y recreativo.",
             history="Considerado un lugar sagrado por los pueblos indígenas de la región durante miles de años.",
             location="Mount Hood National Forest",
             hours="Acceso todo el año (varía por temporada)", cost="Varía según actividad",
             accessibility="Varía por área", parking="Permisos requeridos en algunas zonas",
             rules="Sigue las reglas del bosque nacional", services="Senderos, esquí, campamentos",
             summary="El pico más alto de Oregon y un tesoro natural para toda la comunidad.",
             official_source="https://www.fs.usda.gov/mthood",
             sources=[{"name": "US Forest Service", "url": "https://www.fs.usda.gov/mthood", "type": "Gobierno"}]),
    ]
    await db.places.insert_many(places)

    # Elections
    election = {"id": new_id(), "name": "Elecciones Generales de Oregon 2026", "year": 2026,
                "date": "2026-11-03", "description": "Elecciones generales del estado de Oregon.",
                "status": "active", "is_demo": True, "created_at": now_iso()}
    await db.elections.insert_one(election)

    q_gov = [{"id": new_id(), "text": t} for t in [
        "¿Qué haría para reducir el costo de vivienda en Oregon?",
        "¿Qué propone para mejorar la educación?",
        "¿Qué haría para apoyar a pequeños negocios?",
        "¿Cómo mejoraría la seguridad?",
        "¿Qué quiere que la comunidad latina conozca sobre su campaña?",
    ]]
    race_gov = {"id": new_id(), "election_id": election["id"], "title": "Gobernador de Oregon",
                "race_type": "Gobernador", "district": "Estatal",
                "description": "Carrera por la gobernación del estado de Oregon.",
                "questions": q_gov, "is_demo": True, "created_at": now_iso()}
    q_mayor = [{"id": new_id(), "text": t} for t in [
        "¿Cuál es su principal prioridad para la ciudad?",
        "¿Qué haría para mejorar el transporte público?",
        "¿Cómo apoyaría a las familias inmigrantes?",
    ]]
    race_mayor = {"id": new_id(), "election_id": election["id"], "title": "Alcalde de Portland",
                  "race_type": "Alcalde", "district": "Portland",
                  "description": "Carrera por la alcaldía de Portland.",
                  "questions": q_mayor, "is_demo": True, "created_at": now_iso()}
    await db.races.insert_many([race_gov, race_mayor])

    def cand(race, name, party, photo, ans_texts, priorities):
        qs = race["questions"]
        answers = {qs[i]["id"]: ans_texts[i] for i in range(min(len(qs), len(ans_texts)))}
        return {"id": new_id(), "race_id": race["id"], "name": f"[DEMO] {name}", "party": party,
                "photo": photo, "position": race["title"], "district": race["district"],
                "bio": "Candidato de demostración. Este perfil es contenido de ejemplo y no representa a una persona real.",
                "experience": "Experiencia de demostración en servicio público.",
                "website": "https://example.org", "socials": {"twitter": "@demo", "facebook": "demo"},
                "campaign_info": "Información de campaña de demostración.",
                "priorities": priorities, "proposals": [], "videos": [], "interviews": [],
                "answers": answers, "sources": [{"name": "Sitio de campaña (demo)", "url": "https://example.org", "type": "Candidato"}],
                "is_demo": True, "created_at": now_iso(), "updated_at": now_iso()}

    await db.candidates.insert_many([
        cand(race_gov, "María Fernández", "Partido A", IMG["candidate2"],
             ["Propone ampliar la construcción de vivienda asequible y ayudas de renta.",
              "Propone aumentar la inversión en escuelas públicas y programas bilingües.",
              "Propone créditos y asesoría gratuita para pequeños negocios.",
              "Propone más programas comunitarios de prevención.",
              "Quiere que la comunidad latina sepa que su campaña prioriza el acceso a servicios en español."],
             ["Vivienda asequible", "Educación bilingüe", "Apoyo a pequeños negocios"]),
        cand(race_gov, "Carlos Ramírez", "Partido B", IMG["candidate1"],
             ["Propone incentivos fiscales para incentivar la construcción privada de vivienda.",
              "Propone dar más autonomía a los distritos escolares locales.",
              "Propone reducir regulaciones para facilitar la apertura de negocios.",
              "Propone aumentar la coordinación entre agencias de seguridad.",
              "Quiere que la comunidad latina conozca su plan de desarrollo económico local."],
             ["Desarrollo económico", "Autonomía local", "Reducción de trámites"]),
        cand(race_mayor, "Ana López", "Partido A", IMG["candidate3"],
             ["Su prioridad es la vivienda y la reducción de la falta de vivienda.",
              "Propone expandir las rutas de autobús y tren ligero.",
              "Propone crear una oficina de asuntos de inmigrantes."],
             ["Vivienda", "Transporte público", "Servicios para inmigrantes"]),
        cand(race_mayor, "Jorge Medina", "Partido B", IMG["candidate4"],
             ["Su prioridad es la seguridad pública y la limpieza de la ciudad.",
              "Propone mejorar la infraestructura vial existente.",
              "Propone asociarse con organizaciones comunitarias existentes."],
             ["Seguridad pública", "Infraestructura", "Alianzas comunitarias"]),
    ])
