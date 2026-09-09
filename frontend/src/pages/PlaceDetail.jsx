import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, DollarSign, Accessibility, Car, ExternalLink } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { CategoryBadge, DemoBadge, Sources } from "@/components/shared";
import { Button } from "@/components/ui/button";

function Info({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <Icon className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
      <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-sm">{value}</p></div>
    </div>
  );
}

export default function PlaceDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setItem(null); setError(false); setActive(0);
    api.get(`/public/places/${slug}`).then((r) => setItem(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="max-w-2xl mx-auto px-6 py-24 text-center"><h1 className="font-serif text-3xl font-bold">No encontrado</h1><Link to="/conoce-oregon" className="mt-4 inline-block text-primary underline">Volver</Link></div>;
  if (!item) return <div className="max-w-4xl mx-auto px-6 py-24"><div className="h-8 w-2/3 bg-secondary animate-pulse rounded" /></div>;

  const gallery = item.gallery?.length ? item.gallery : (item.featured_image ? [item.featured_image] : []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-16">
      <Link to="/conoce-oregon" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6" data-testid="back-link">
        <ArrowLeft className="h-4 w-4" /> Conoce Oregon
      </Link>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <CategoryBadge>{item.category}</CategoryBadge>
        {item.is_demo && <DemoBadge />}
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight" data-testid="place-title">{item.title}</h1>
      {item.summary && <p className="mt-3 text-lg text-muted-foreground">{item.summary}</p>}

      {gallery.length > 0 && (
        <div className="mt-6" data-testid="place-gallery">
          <img src={mediaUrl(gallery[active])} alt={item.title} className="w-full rounded-xl aspect-[16/9] object-cover" />
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-primary" : "border-transparent"}`}>
                  <img src={mediaUrl(g)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {item.description && <section><h2 className="font-serif text-xl font-bold mb-2">Descripción</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{item.description}</p></section>}
          {item.history && <section><h2 className="font-serif text-xl font-bold mb-2">Historia</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{item.history}</p></section>}
          {item.rules && <section><h2 className="font-serif text-xl font-bold mb-2">Reglas</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{item.rules}</p></section>}
          {item.services && <section><h2 className="font-serif text-xl font-bold mb-2">Servicios disponibles</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{item.services}</p></section>}
          <Sources sources={item.sources} />
        </div>
        <aside>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 sticky top-20">
            <Info icon={MapPin} label="Ubicación" value={item.location || [item.city, item.county].filter(Boolean).join(", ")} />
            <Info icon={Clock} label="Horarios" value={item.hours} />
            <Info icon={DollarSign} label="Costo" value={item.cost} />
            <Info icon={Accessibility} label="Accesibilidad" value={item.accessibility} />
            <Info icon={Car} label="Estacionamiento" value={item.parking} />
            {item.official_source && (
              <a href={item.official_source} target="_blank" rel="noopener noreferrer" className="block pt-2">
                <Button variant="outline" className="w-full" data-testid="official-source-btn"><ExternalLink className="mr-2 h-4 w-4" /> Sitio oficial</Button>
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
