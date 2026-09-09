import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Globe, MapPin, ExternalLink, ListChecks, FileText, ShieldCheck } from "lucide-react";
import { api, mediaUrl, formatDate, track } from "@/lib/api";
import { CategoryBadge, DemoBadge, Sources } from "@/components/shared";
import { Button } from "@/components/ui/button";

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-border last:border-0">
      <Icon className="h-4 w-4 mt-1 shrink-0 text-primary" />
      <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-sm text-foreground">{value}</p></div>
    </div>
  );
}

export default function ResourceDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItem(null); setError(false);
    api.get(`/public/resources/${slug}`).then((r) => setItem(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="max-w-2xl mx-auto px-6 py-24 text-center"><h1 className="font-serif text-3xl font-bold">No encontrado</h1><Link to="/recursos" className="mt-4 inline-block text-primary underline">Volver</Link></div>;
  if (!item) return <div className="max-w-4xl mx-auto px-6 py-24"><div className="h-8 w-2/3 bg-secondary animate-pulse rounded" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-16">
      <Link to="/recursos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6" data-testid="back-link">
        <ArrowLeft className="h-4 w-4" /> Recursos
      </Link>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <CategoryBadge>{item.category}</CategoryBadge>
        {item.is_demo && <DemoBadge />}
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight" data-testid="resource-title">{item.title}</h1>
      {item.organization && <p className="mt-2 text-lg font-medium text-terracotta">{item.organization}</p>}
      {item.summary && <p className="mt-3 text-lg text-muted-foreground">{item.summary}</p>}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {item.what_offers && <div className="rounded-xl border border-border bg-card p-6"><h2 className="font-serif text-lg font-bold mb-2">Qué ofrece</h2><p className="text-foreground/80">{item.what_offers}</p></div>}
          {item.who_helps && <div className="rounded-xl border border-border bg-card p-6"><h2 className="font-serif text-lg font-bold mb-2">A quién ayuda</h2><p className="text-foreground/80">{item.who_helps}</p></div>}
          {item.requirements && <div className="rounded-xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 font-serif text-lg font-bold mb-2"><ListChecks className="h-5 w-5 text-primary" /> Requisitos</h2><p className="text-foreground/80 whitespace-pre-line">{item.requirements}</p></div>}
          {item.documents && <div className="rounded-xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 font-serif text-lg font-bold mb-2"><FileText className="h-5 w-5 text-primary" /> Documentos necesarios</h2><p className="text-foreground/80 whitespace-pre-line">{item.documents}</p></div>}
          {item.how_to_apply && <div className="rounded-xl border border-primary/20 bg-primary/5 p-6"><h2 className="font-serif text-lg font-bold mb-2">Cómo solicitar</h2><p className="text-foreground/80 whitespace-pre-line">{item.how_to_apply}</p></div>}
          <Sources sources={item.sources} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 sticky top-20">
            <h3 className="font-serif font-bold mb-3">Información de contacto</h3>
            <Row icon={Phone} label="Teléfono" value={item.phone} />
            <Row icon={Mail} label="Email" value={item.email} />
            <Row icon={Globe} label="Website" value={item.website} />
            <Row icon={MapPin} label="Dirección" value={[item.address, item.city, item.county, item.state].filter(Boolean).join(", ")} />
            <Row icon={Globe} label="Idiomas" value={item.languages} />
            {item.last_verified && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verificado el {formatDate(item.last_verified)}</p>}
            <div className="mt-4 space-y-2">
              {item.official_source && (
                <a href={item.official_source} target="_blank" rel="noopener noreferrer" onClick={() => track("resource_apply", { label: item.title })} className="block">
                  <Button className="w-full" data-testid="apply-btn">Solicitar ayuda</Button>
                </a>
              )}
              {item.official_source && (
                <a href={item.official_source} target="_blank" rel="noopener noreferrer" onClick={() => track("official_link", { label: item.title })} className="block">
                  <Button variant="outline" className="w-full" data-testid="official-source-btn"><ExternalLink className="mr-2 h-4 w-4" /> Visitar fuente oficial</Button>
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
