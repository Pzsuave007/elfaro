import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {items.map((s) => {
          const big = s.tier === "oro";
          const logo = (
            <img src={mediaUrl(s.logo)} alt={s.title}
              className={`object-contain grayscale hover:grayscale-0 transition-all ${big ? "h-14 sm:h-16" : s.tier === "plata" ? "h-11 sm:h-12" : "h-9 sm:h-10"} ${isFooter ? "brightness-0 invert opacity-70 hover:opacity-100" : "opacity-80 hover:opacity-100"}`} />
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

export { TIER_LABEL };
