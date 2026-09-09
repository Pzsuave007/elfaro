# El Foro In Oregon — PRD

## Problem Statement
Plataforma web informativa, no partidista y en español para la comunidad hispanohablante de Oregon. Ayuda a responder: ¿Qué está pasando en Oregon? ¿Qué recursos existen para mí? ¿Qué leyes debo conocer? ¿Qué debo conocer sobre Oregon? Identidad editorial/institucional (verde profundo, charcoal, blanco, tonos tierra; tipografía Lora + Work Sans).

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui. Public site (PublicLayout) + Admin CMS (/admin, JWT protected).
- **Backend**: FastAPI modular (core, auth, content, elections, ai, storage, seed_data). All routes under /api.
- **DB**: MongoDB. Collections: users, articles, resources, oregon_info, places, elections, races, candidates, media, searches, analytics.
- **Auth**: JWT Bearer (localStorage `foro_token`). Roles: contributor < writer < editor < admin < super_admin. Publishing requires editor+.
- **AI**: GPT-5.4 via emergentintegrations (EMERGENT_LLM_KEY; supports own OPENAI_API_KEY via env). Editorial non-partisan system prompt. AI content forced to draft/needs_review.
- **Storage**: Emergent Object Storage for media library.

## User Personas
- Community reader (Spanish-speaking Oregon resident) — reads news, finds resources, understands laws, compares candidates.
- Editorial team (writer/editor/admin) — manages content via CMS with AI assistant.

## Core Requirements (static)
5 public sections (Inicio, Entérate, Recursos, Oregon Te Informa, Conoce Oregon) + Elecciones (subsection, neutral candidate comparison, "El Foro Pregunta"). Full CMS, AI editorial assistant, sources, corrections, global search, filters, localization (cities/counties), demo content marked DEMO.

## Implemented (2026-06)
- ✅ Public site: Home (hero+search, featured, resources grid, Oregon Te Informa, Conoce Oregon, Elecciones banner), 4 list pages with category/search filters, 4 detail page types, elections list + side-by-side compare + candidate detail, global search grouped by type, 6 institutional static pages, dark/light theme.
- ✅ Backend: JWT auth + roles + user management, generic content CRUD with workflow states + slug + views, elections/races/candidates + questions applied to race, AI assist (18+ actions incl. structured explain_law/extract_resource/tags/generate_questions), media upload/serve/list, search + analytics tracking, dashboard stats, config taxonomies.
- ✅ Admin CMS: dashboard with stats, generic list+editor per content type, AI Assistant dialog, media library, elections manager, race/candidate editors, users & roles.
- ✅ Demo content seeded (3 articles, 3 resources, 3 oregon-info, 3 places, 1 election / 2 races / 4 candidates, all DEMO).
- ✅ Testing: 23/23 backend pytest pass; frontend flows verified.
- ✅ AI "Investigar con AI" flow (2026-06): AIResearch component integrated into ContentEditor for all kinds (articles/resources/oregon-info/places). Admin types a topic → AI returns 4 distinct options → picks one → full draft fills editor fields (used_ai=true, status=draft) → optional copyright-free AI image (gpt-image-1) applied to featured_image. Backend endpoints /api/ai/research, /api/ai/generate-post, /api/ai/image. Verified E2E (testing iteration_2: 6/6 frontend behaviors pass).
- ✅ Site Settings + batch drafts (2026-06): New admin section "Configuración del sitio" (/admin/settings, editor+) to edit homepage hero (eyebrow, title, subtitle, search label, background image) with live preview. AI buttons: "Generar textos con AI" (POST /ai/hero-text → 4 options) and "Generar imagen con AI" (POST /ai/image, copyright-free). Persisted in db.settings singleton via GET /api/site-settings + PUT /api/admin/site-settings; Home.jsx consumes it live. Also: "Investigar con AI" now has "Crear borradores de todas" to batch-create a draft per research option at once. Verified E2E (testing iteration_3: 7/7 pass).
- ✅ Color palettes + section texts + mobile preview (2026-06): Palette picker in /admin/settings with 6 presets (green/ocean/wine/indigo/teal/earth) applied site-wide via CSS vars (lib/palettes.js applyPalette + ThemeApplier in App.js), live preview + persistence (settings.palette). Editable section texts for "Recursos" and "Oregon Te Informa" (title+description) reflected on Home. Desktop/Mobile hero preview toggle in settings. Verified E2E (testing iteration_4: 100% pass).

## Backlog / Remaining (P1/P2)
- P1: Rich text editor (currently textarea), scheduled auto-publish job, SEO meta tags injection + sitemap.xml/robots.txt served, ballot measures.
- P2: Newsletter, WhatsApp, push, member accounts, saved articles, English version, "Who Represents Me" + ZIP lookup, PWA. (Architecture ready.)

## Test Credentials
admin@elforo.org / ForoOregon2026 (super_admin). See /app/memory/test_credentials.md.
