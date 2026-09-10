import { useState } from "react";
import { Phone, MapPin, ExternalLink, Handshake, Loader2, CheckCircle2 } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSponsors, trackSponsorClick, TIER_LABEL } from "@/components/Sponsors";

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

function AliadoForm() {
  const [f, setF] = useState({ name: "", business: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
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

      <div className="mt-16 grid lg:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="font-serif text-2xl font-bold">Sé nuestro aliado</h2>
          <p className="text-muted-foreground mt-2">Llega a miles de familias latinas en Oregon y apoya un medio comunitario confiable. Déjanos tus datos y te enviamos los paquetes de patrocinio (Oro, Plata y Bronce).</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Tu logo en la portada, el pie de página y la página de Aliados.</li>
            <li>• Botones de "Llamar" y "Cómo llegar" directo a tu negocio.</li>
            <li>• Presencia en un medio no partidista y de confianza.</li>
          </ul>
        </div>
        <AliadoForm />
      </div>
    </div>
  );
}
