import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Users, CalendarClock, ListChecks, ExternalLink } from "lucide-react";
import { api, mediaUrl, formatDate } from "@/lib/api";
import { CategoryBadge, DemoBadge, Sources } from "@/components/shared";
import { Button } from "@/components/ui/button";

const BLOCKS = [
  { key: "que_cambio", label: "¿Qué cambió?", icon: RefreshCw },
  { key: "a_quien_afecta", label: "¿A quién afecta?", icon: Users },
  { key: "cuando_entra_en_vigor", label: "¿Cuándo entra en vigor?", icon: CalendarClock },
  { key: "que_necesitas_hacer", label: "¿Qué necesitas hacer?", icon: ListChecks },
];

export default function OregonInfoDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItem(null); setError(false);
    api.get(`/public/oregon-info/${slug}`).then((r) => setItem(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="max-w-2xl mx-auto px-6 py-24 text-center"><h1 className="font-serif text-3xl font-bold">No encontrado</h1><Link to="/oregon-te-informa" className="mt-4 inline-block text-primary underline">Volver</Link></div>;
  if (!item) return <div className="max-w-3xl mx-auto px-6 py-24"><div className="h-8 w-2/3 bg-secondary animate-pulse rounded" /></div>;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-16">
      <Link to="/oregon-te-informa" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6" data-testid="back-link">
        <ArrowLeft className="h-4 w-4" /> Oregon Te Informa
      </Link>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <CategoryBadge>{item.category}</CategoryBadge>
        {item.used_ai && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Con apoyo de AI</span>}
        {item.is_demo && <DemoBadge />}
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight tracking-tight" data-testid="article-title">{item.title}</h1>
      {item.summary && <p className="mt-4 text-lg text-muted-foreground">{item.summary}</p>}
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {formatDate(item.published_at)}</p>

      {item.featured_image && <img src={mediaUrl(item.featured_image)} alt={item.title} className="mt-6 w-full rounded-xl aspect-[16/9] object-cover" />}

      <div className="mt-8 space-y-4" data-testid="oregon-info-blocks">
        {BLOCKS.map(({ key, label, icon: Icon }) => item[key] && (
          <div key={key} className="rounded-xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-2"><Icon className="h-5 w-5" /> {label}</h2>
            <p className="text-foreground/80 leading-relaxed">{item[key]}</p>
          </div>
        ))}
      </div>

      {item.official_source && (
        <div className="mt-6 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold">Fuente oficial</h3>
            <p className="text-sm text-muted-foreground">Consulta la información oficial directamente en el sitio del estado.</p>
          </div>
          <a href={item.official_source} target="_blank" rel="noopener noreferrer">
            <Button data-testid="official-source-btn"><ExternalLink className="mr-2 h-4 w-4" /> Visitar fuente oficial</Button>
          </a>
        </div>
      )}

      <Sources sources={item.sources} />
    </article>
  );
}
