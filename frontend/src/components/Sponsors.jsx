import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, ExternalLink, Handshake } from "lucide-react";
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

export { TIER_LABEL };
