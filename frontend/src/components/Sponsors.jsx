import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, ExternalLink, Handshake, Star } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";

const TIER_LABEL = { oro: "Oro", plata: "Plata", bronce: "Bronce" };

export function trackSponsorClick(id, type) {
  try { api.post(`/public/sponsors/${id}/click?type=${type}`); } catch (e) { /* fire-and-forget */ }
}

export function useSponsors() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/public/sponsors").then((r) => setItems(r.data.items || [])).catch(() => setItems([])); }, []);
  return items;
}

// Franja de logos (portada y footer)
export function SponsorStrip({ variant = "section" }) {
  const items = useSponsors();
  if (!items || items.length === 0) return null;
  const isFooter = variant === "footer";
  return (
    <div data-testid="sponsor-strip" className={isFooter ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10"}>
      <p className={`text-xs font-semibold uppercase tracking-[0.15em] mb-5 ${isFooter ? "text-primary-foreground/60" : "text-muted-foreground text-center"}`}>
        Con el apoyo de nuestra comunidad
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        {items.map((s) => {
          const big = s.tier === "oro";
          const logo = (
            <img src={mediaUrl(s.logo)} alt={s.title}
              className={`object-contain grayscale hover:grayscale-0 transition-all ${big ? "h-20 sm:h-24" : s.tier === "plata" ? "h-14 sm:h-16" : "h-11 sm:h-12"} ${isFooter ? "brightness-0 invert opacity-70 hover:opacity-100" : "opacity-80 hover:opacity-100"}`} />
          );
          return s.logo ? (
            <Link key={s.id} to="/aliados" title={s.title} data-testid={`sponsor-logo-${s.id}`}>{logo}</Link>
          ) : (
            <Link key={s.id} to="/aliados" className={`font-serif font-bold ${isFooter ? "text-primary-foreground/70" : "text-primary"} ${big ? "text-lg" : "text-base"}`}>{s.title}</Link>
          );
        })}
      </div>
    </div>
  );
}

// Bloque "Patrocinado por" (dentro de artículos): muestra el primer patrocinador Oro/activo
export function SponsoredBy() {
  const items = useSponsors();
  if (!items || items.length === 0) return null;
  const s = items[0];
  return (
    <div data-testid="sponsored-by" className="rounded-xl border border-border bg-secondary/40 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Con el apoyo de</p>
      <Link to="/aliados" className="flex items-center gap-4" onClick={() => trackSponsorClick(s.id, "website")}>
        {s.logo && <img src={mediaUrl(s.logo)} alt={s.title} className="h-12 w-12 object-contain rounded" />}
        <div>
          <p className="font-serif font-bold leading-tight">{s.title}</p>
          {s.summary && <p className="text-sm text-muted-foreground line-clamp-2">{s.summary}</p>}
        </div>
      </Link>
    </div>
  );
}

// Anuncio lateral flotante "Apoya negocios locales" (barra sticky en páginas de detalle).
// Rota entre patrocinadores activos; si no hay, muestra un CTA para conseguir aliados.
export function SponsorAd({ sticky = true }) {
  const items = useSponsors();
  const s = useMemo(
    () => (items && items.length ? items[Math.floor(Math.random() * items.length)] : null),
    [items]
  );
  if (items === null) return null; // cargando
  const dirUrl = s?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : null;
  return (
    <div className={sticky ? "sticky top-20" : ""} data-testid="sponsor-ad">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-terracotta mb-3">Apoya negocios locales</p>
      {s ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            {s.logo
              ? <img src={mediaUrl(s.logo)} alt={s.title} className="h-14 w-14 object-contain rounded-lg border border-border bg-white" />
              : <div className="h-14 w-14 rounded-lg bg-primary/10 grid place-items-center font-serif text-lg font-bold text-primary">{s.title?.[0]}</div>}
            <div className="min-w-0">
              <p className="font-serif font-bold leading-tight truncate">{s.title}</p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta">Aliado {TIER_LABEL[s.tier] || ""}</span>
            </div>
          </div>
          {s.summary && <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{s.summary}</p>}
          <div className="space-y-2">
            {s.phone && (
              <a href={`tel:${s.phone}`} onClick={() => trackSponsorClick(s.id, "call")} data-testid="sponsor-ad-call"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90">
                <Phone className="h-4 w-4" /> Llamar
              </a>
            )}
            {dirUrl && (
              <a href={dirUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackSponsorClick(s.id, "directions")} data-testid="sponsor-ad-directions"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
                <MapPin className="h-4 w-4" /> Cómo llegar
              </a>
            )}
            {s.website && (
              <a href={s.website} target="_blank" rel="noopener noreferrer" onClick={() => trackSponsorClick(s.id, "website")} data-testid="sponsor-ad-web"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
                <ExternalLink className="h-4 w-4" /> Sitio web
              </a>
            )}
          </div>
          <Link to="/aliados" className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary">Ver todos nuestros aliados →</Link>
        </div>
      ) : (
        <Link to="/aliados" className="block rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center hover:bg-secondary transition-colors" data-testid="sponsor-ad-empty">
          <Handshake className="h-7 w-7 text-terracotta mx-auto mb-2" />
          <p className="font-serif font-bold">¿Tu negocio aquí?</p>
          <p className="text-sm text-muted-foreground mt-1">Llega a miles de familias latinas en Oregon y apoya un medio comunitario.</p>
          <span className="mt-3 inline-block text-sm font-medium text-primary">Sé nuestro aliado →</span>
        </Link>
      )}
    </div>
  );
}

const SECTION_NAME = { articles: "Historias", resources: "Recursos", "oregon-info": "Oregon Te Informa", places: "Conoce Oregon" };
const _norm = (v) => (v || "").trim().toLowerCase();

// Botones de contacto compactos (reutilizados por el banner de sección)
function SponsorCtas({ s, size = "sm" }) {
  const dirUrl = s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : null;
  const cls = `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium`;
  return (
    <>
      {s.phone && (
        <a href={`tel:${s.phone}`} onClick={() => trackSponsorClick(s.id, "call")} data-testid="section-sponsor-call"
          className={`${cls} bg-primary text-primary-foreground hover:opacity-90`}><Phone className="h-4 w-4" /> Llamar</a>
      )}
      {dirUrl && (
        <a href={dirUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackSponsorClick(s.id, "directions")} data-testid="section-sponsor-directions"
          className={`${cls} border border-border hover:bg-accent`}><MapPin className="h-4 w-4" /> Cómo llegar</a>
      )}
      {s.website && (
        <a href={s.website} target="_blank" rel="noopener noreferrer" onClick={() => trackSponsorClick(s.id, "website")} data-testid="section-sponsor-web"
          className={`${cls} border border-border hover:bg-accent`}><ExternalLink className="h-4 w-4" /> Sitio web</a>
      )}
    </>
  );
}

// Banner de patrocinador de SECCIÓN (lugar premium, arriba de cada sección).
// Prioridad: patrocinador de la sub-sección (categoría/grupo activo) > patrocinador de la sección.
// Si no hay ninguno, muestra un CTA sutil para vender el espacio.
export function SectionSponsorBanner({ section, subsection = "" }) {
  const items = useSponsors();
  const sub = _norm(subsection);
  const sectionName = SECTION_NAME[section] || "";
  const subSponsor = useMemo(
    () => (items && sub ? items.find((s) => _norm(s.feature_section) === _norm(section) && _norm(s.feature_category) === sub) : null),
    [items, section, sub]
  );
  const secSponsor = useMemo(
    () => (items ? items.find((s) => _norm(s.feature_section) === _norm(section) && !_norm(s.feature_category)) : null),
    [items, section]
  );
  if (items === null) return null; // cargando
  const s = subSponsor || secSponsor;

  if (!s) {
    return (
      <Link to="/aliados" data-testid="section-sponsor-empty"
        className="block border-b border-dashed border-border bg-secondary/30 hover:bg-secondary/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Handshake className="h-4 w-4 text-terracotta" />
          Patrocina la sección de <span className="font-medium text-foreground">{sectionName}</span>
          <span className="text-primary font-medium">— Sé nuestro aliado →</span>
        </div>
      </Link>
    );
  }

  const scope = subSponsor ? `${sectionName} · ${subsection}` : sectionName;
  return (
    <div className="bg-gradient-to-r from-primary/[0.07] via-secondary/40 to-transparent border-y border-primary/15" data-testid="section-sponsor-banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-5">
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="hidden sm:block self-stretch w-1 rounded-full bg-primary" />
            {s.logo
              ? <img src={mediaUrl(s.logo)} alt={s.title} className="h-16 w-16 object-contain rounded-xl border border-border bg-white shadow-sm shrink-0" />
              : <div className="h-16 w-16 rounded-xl bg-primary/10 grid place-items-center font-serif text-2xl font-bold text-primary shrink-0">{s.title?.[0]}</div>}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-terracotta">
                <Star className="h-3.5 w-3.5 fill-current" /> Esta sección es patrocinada por
              </p>
              <p className="font-serif text-xl sm:text-2xl font-bold leading-tight truncate">{s.title}</p>
              {s.summary && <p className="text-sm text-muted-foreground truncate max-w-md">{s.summary}</p>}
              <span className="mt-0.5 inline-block text-[10px] uppercase tracking-wider text-muted-foreground">Patrocinado · {scope}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <SponsorCtas s={s} />
          </div>
        </div>
      </div>
    </div>
  );
}

export { TIER_LABEL, SECTION_NAME };
