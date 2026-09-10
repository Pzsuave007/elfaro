import { useState, useEffect } from "react";
import { Phone, MapPin, ExternalLink, Handshake, Loader2, CheckCircle2, Check, Star } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSponsors, trackSponsorClick, TIER_LABEL, SECTION_NAME } from "@/components/Sponsors";

const PACKAGES = [
  {
    id: "oro", name: "Oro — Patrocinador de Sección", shortName: "Oro (Patrocinador de Sección)",
    price: "$150–250", period: "/mes", highlight: true,
    tagline: "El lugar más exclusivo · solo 4 disponibles en todo el sitio",
    features: [
      "Banner destacado ARRIBA de una sección completa",
      "Etiqueta \"Patrocinador oficial\" de tu sección",
      "Tu logo en la portada y el pie de página",
      "Anuncio en la barra lateral de los artículos",
      "Botones de Llamar y Cómo llegar",
      "Reporte mensual de llamadas y clics",
    ],
  },
  {
    id: "plata", name: "Plata — Patrocinador de Sub-sección", shortName: "Plata (Sub-sección)",
    price: "$60–120", period: "/mes",
    tagline: "Llega a un público específico (ej. Vivienda, Salud)",
    features: [
      "Banner arriba de una categoría específica",
      "Tu logo en la portada y el pie de página",
      "Anuncio en la barra lateral",
      "Botones de Llamar y Cómo llegar",
      "Ficha completa en la página de Aliados",
    ],
  },
  {
    id: "bronce", name: "Bronce — Presencia", shortName: "Bronce (Presencia)",
    price: "$25–50", period: "/mes",
    tagline: "Apoya a la comunidad y date a conocer",
    features: [
      "Tu logo en la portada y el pie de página",
      "Aparición rotativa en el anuncio lateral",
      "Ficha con botones de contacto en Aliados",
    ],
  },
];

function Packages({ onSelect }) {
  return (
    <div className="mt-16" data-testid="sponsor-packages">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-terracotta mb-2">Paquetes de patrocinio</p>
          <h2 className="font-serif text-3xl font-bold">Elige cómo apoyar y hacer crecer tu negocio</h2>
        </div>
        <span className="rounded-full bg-terracotta/10 text-terracotta text-xs font-semibold px-3 py-1.5">Cupos limitados · Aliado Fundador</span>
      </div>
      <div className="mt-8 grid md:grid-cols-3 gap-6 items-stretch">
        {PACKAGES.map((p) => (
          <div key={p.id} data-testid={`package-${p.id}`}
            className={`relative rounded-2xl border p-6 flex flex-col ${p.highlight ? "border-primary shadow-lg ring-1 ring-primary/20 bg-card" : "border-border bg-card"}`}>
            {p.highlight && (
              <span className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider px-3 py-1">
                <Star className="h-3 w-3 fill-current" /> Más exclusivo · solo 4
              </span>
            )}
            <h3 className="font-serif text-xl font-bold">{p.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>
            <ul className="mt-5 space-y-2 flex-1">
              {p.features.map((feat, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80"><Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" /> {feat}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={p.highlight ? "default" : "outline"} onClick={() => onSelect(p.shortName)} data-testid={`package-select-${p.id}`}>
              Quiero este paquete
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Escríbenos y te enviamos los detalles de cada paquete. Descuento por pago anual disponible.</p>
    </div>
  );
}

function SponsorCard({ s }) {
  const dirUrl = s.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` : null;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col" data-testid={`sponsor-card-${s.id}`}>
      <div className="flex items-center gap-4 mb-4">
        {s.logo ? <img src={mediaUrl(s.logo)} alt={s.title} className="h-16 w-16 object-contain rounded-lg border border-border bg-white" />
          : <div className="h-16 w-16 rounded-lg bg-primary/10 grid place-items-center font-serif text-xl font-bold text-primary">{s.title?.[0]}</div>}
        <div>
          <h3 className="font-serif text-lg font-bold leading-tight">{s.title}</h3>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">Aliado {TIER_LABEL[s.tier] || ""}</span>
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

function AliadoForm({ presetMessage = "" }) {
  const [f, setF] = useState({ name: "", business: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { if (presetMessage) setF((x) => ({ ...x, message: presetMessage })); }, [presetMessage]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/public/sponsor-leads", f);
      setDone(true);
    } catch (err) { toast.error(err.response?.data?.detail || "No se pudo enviar. Revisa los datos."); }
    finally { setBusy(false); }
  };
  if (done) return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-8 text-center" data-testid="aliado-form-done">
      <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
      <h3 className="font-serif text-xl font-bold">¡Gracias! Te contactaremos pronto.</h3>
      <p className="text-muted-foreground mt-1">Recibimos tu interés en apoyar a El Foro In Oregon.</p>
    </div>
  );
  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-3" data-testid="aliado-form">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input required placeholder="Tu nombre *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="lead-name" />
        <Input placeholder="Nombre del negocio" value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} data-testid="lead-business" />
        <Input type="email" placeholder="Correo" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="lead-email" />
        <Input placeholder="Teléfono" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="lead-phone" />
      </div>
      <Textarea rows={3} placeholder="Cuéntanos sobre tu negocio o cómo quieres apoyar" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} data-testid="lead-message" />
      <p className="text-xs text-muted-foreground">* Nombre y (correo o teléfono) son obligatorios.</p>
      <Button type="submit" disabled={busy} data-testid="lead-submit">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake className="mr-2 h-4 w-4" />} Quiero ser aliado
      </Button>
    </form>
  );
}

export default function Aliados() {
  const items = useSponsors();
  const [preset, setPreset] = useState("");
  const selectPkg = (name) => {
    setPreset(`Me interesa el paquete ${name}. `);
    document.getElementById("aliado-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12" data-testid="aliados-page">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-terracotta mb-3">Nuestros Aliados</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight max-w-3xl">Negocios y organizaciones que apoyan a nuestra comunidad</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl">Gracias a nuestros aliados, El Foro In Oregon mantiene información gratuita y en español para la comunidad latina de Oregon.</p>

      {items && items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10" data-testid="sponsors-grid">
          {items.map((s) => <SponsorCard key={s.id} s={s} />)}
        </div>
      )}

      <Packages onSelect={selectPkg} />

      <div id="aliado-form-section" className="mt-16 grid lg:grid-cols-2 gap-8 items-start scroll-mt-24">
        <div>
          <h2 className="font-serif text-2xl font-bold">Sé nuestro aliado</h2>
          <p className="text-muted-foreground mt-2">Llega a miles de familias latinas en Oregon y apoya un medio comunitario confiable. Déjanos tus datos y te enviamos los detalles de los paquetes (Oro, Plata y Bronce).</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Tu logo en la portada, el pie de página y la página de Aliados.</li>
            <li>• Botones de "Llamar" y "Cómo llegar" directo a tu negocio.</li>
            <li>• Presencia en un medio no partidista y de confianza.</li>
          </ul>
        </div>
        <AliadoForm presetMessage={preset} />
      </div>
    </div>
  );
}
