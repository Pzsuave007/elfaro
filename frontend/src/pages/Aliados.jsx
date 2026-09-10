import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, ExternalLink, Handshake, Star } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useSponsors, trackSponsorClick, TIER_LABEL, SECTION_NAME } from "@/components/Sponsors";

const TIER_ORDER = ["oro", "plata", "bronce"];
const TIER_TITLE = { oro: "Aliados Oro", plata: "Aliados Plata", bronce: "Aliados Bronce" };

function SponsorCard({ s, variant = "plata" }) {
  const dirUrl = s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : null;
  const highlight = variant === "oro";
  const logoSize = variant === "oro" ? "h-20 w-20" : variant === "bronce" ? "h-14 w-14" : "h-16 w-16";
  return (
    <div className={`rounded-2xl border p-6 flex flex-col ${highlight ? "border-primary ring-1 ring-primary/20 shadow-md bg-card" : "border-border bg-card"}`} data-testid={`sponsor-card-${s.id}`}>
      <div className="flex items-center gap-4 mb-4">
        {s.logo
          ? <img src={mediaUrl(s.logo)} alt={s.title} className={`${logoSize} object-contain rounded-lg border border-border bg-white shrink-0`} />
          : <div className={`${logoSize} rounded-lg bg-primary/10 grid place-items-center font-serif text-xl font-bold text-primary shrink-0`}>{s.title?.[0]}</div>}
        <div className="min-w-0">
          <h3 className={`font-serif font-bold leading-tight ${highlight ? "text-xl" : "text-lg"}`}>{s.title}</h3>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">Aliado {TIER_LABEL[s.tier] || TIER_LABEL[variant]}</span>
          {s.feature_section && s.feature_section !== "none" && SECTION_NAME[s.feature_section] && (
            <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary" data-testid={`official-badge-${s.id}`}>
              <Star className="h-3 w-3 fill-current" /> Patrocinador oficial de {SECTION_NAME[s.feature_section]}
            </span>
          )}
        </div>
      </div>
      {s.summary && <p className="text-sm text-muted-foreground mb-4 flex-1">{s.summary}</p>}
      <div className="flex flex-wrap gap-2 mt-auto">
        {s.phone && (
          <a href={`tel:${s.phone}`} onClick={() => trackSponsorClick(s.id, "call")} data-testid={`sponsor-call-${s.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90">
            <Phone className="h-4 w-4" /> Llamar
          </a>
        )}
        {dirUrl && (
          <a href={dirUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackSponsorClick(s.id, "directions")} data-testid={`sponsor-directions-${s.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
            <MapPin className="h-4 w-4" /> Cómo llegar
          </a>
        )}
        {s.website && (
          <a href={s.website} target="_blank" rel="noopener noreferrer" onClick={() => trackSponsorClick(s.id, "website")} data-testid={`sponsor-web-${s.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
            <ExternalLink className="h-4 w-4" /> Sitio web
          </a>
        )}
      </div>
    </div>
  );
}

export default function Aliados() {
  const items = useSponsors();
  const grouped = useMemo(() => {
    const g = { oro: [], plata: [], bronce: [] };
    (items || []).forEach((s) => {
      const t = (s.tier || "bronce").toLowerCase();
      (g[t] ? g[t] : g.bronce).push(s);
    });
    return g;
  }, [items]);

  const gridCols = { oro: "sm:grid-cols-2", plata: "sm:grid-cols-2 lg:grid-cols-3", bronce: "sm:grid-cols-2 lg:grid-cols-4" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12" data-testid="aliados-page">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-terracotta mb-3">Nuestros Aliados</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight max-w-3xl">Negocios y organizaciones que apoyan a nuestra comunidad</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl">Gracias a nuestros aliados, El Foro In Oregon mantiene información gratuita y en español para la comunidad latina de Oregon.</p>

      {items && items.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-secondary/30 p-10 text-center text-muted-foreground" data-testid="aliados-empty">
          Aún no tenemos aliados publicados. <Link to="/patrocina" className="text-primary underline">¡Sé el primero!</Link>
        </div>
      )}

      {TIER_ORDER.map((tier) => grouped[tier].length > 0 && (
        <section key={tier} className="mt-12" data-testid={`aliados-tier-${tier}`}>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold mb-5">
            {tier === "oro" && <Star className="h-5 w-5 text-primary fill-current" />}
            {TIER_TITLE[tier]}
          </h2>
          <div className={`grid grid-cols-1 gap-5 ${gridCols[tier]}`}>
            {grouped[tier].map((s) => <SponsorCard key={s.id} s={s} variant={tier} />)}
          </div>
        </section>
      ))}

      <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-10 text-center" data-testid="aliados-cta">
        <Handshake className="h-9 w-9 text-terracotta mx-auto mb-3" />
        <h2 className="font-serif text-2xl sm:text-3xl font-bold">¿Quieres apoyar a nuestra comunidad?</h2>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Conoce los paquetes de patrocinio y cómo tu negocio puede llegar a miles de familias latinas en Oregon.</p>
        <Link to="/patrocina" data-testid="go-patrocina">
          <Button size="lg" className="mt-5">Ver paquetes de patrocinio →</Button>
        </Link>
      </div>
    </div>
  );
}
