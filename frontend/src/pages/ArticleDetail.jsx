import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, User, ArrowLeft } from "lucide-react";
import { api, mediaUrl, formatDate } from "@/lib/api";
import { CategoryBadge, TypeTag, DemoBadge, Sources, Corrections, ArticleCard } from "@/components/shared";
import { SponsorAd } from "@/components/Sponsors";

function Body({ text }) {
  if (!text) return null;
  return (
    <div className="prose-foro max-w-none" data-testid="article-body">
      {String(text).split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItem(null); setError(false);
    api.get(`/public/articles/${slug}`).then((r) => setItem(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="max-w-2xl mx-auto px-6 py-24 text-center"><h1 className="font-serif text-3xl font-bold">Historia no encontrada</h1><Link to="/historias" className="mt-4 inline-block text-primary underline">Volver a Historias</Link></div>;
  if (!item) return <div className="max-w-3xl mx-auto px-6 py-24"><div className="h-8 w-2/3 bg-secondary animate-pulse rounded mb-4" /><div className="h-64 bg-secondary animate-pulse rounded" /></div>;

  const isOpinion = ["Opinión", "Contenido patrocinado"].includes(item.content_type);

  return (
    <article className="pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <Link to="/historias" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6" data-testid="back-link">
          <ArrowLeft className="h-4 w-4" /> Historias de la comunidad
        </Link>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {item.category && <CategoryBadge>{item.category}</CategoryBadge>}
          {item.content_type && <TypeTag type={item.content_type} />}
          {item.used_ai && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Con apoyo de AI</span>}
          {item.is_demo && <DemoBadge />}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.12] tracking-tight" data-testid="article-title">{item.title}</h1>
        {item.subtitle && <p className="mt-4 text-xl text-muted-foreground leading-relaxed">{item.subtitle}</p>}
        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground border-y border-border py-4">
          {item.author && <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {item.author}</span>}
          <span>{formatDate(item.published_at)}</span>
          {item.reading_time && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {item.reading_time} min de lectura</span>}
        </div>
      </div>

      {item.featured_image && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 my-8">
          <img src={mediaUrl(item.featured_image)} alt={item.title} className="w-full rounded-xl aspect-[16/9] object-cover" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 min-w-0">
          {isOpinion && (
            <div className="mb-6 rounded-lg border-l-4 border-terracotta bg-terracotta/5 p-4 text-sm">
              Este es contenido de <strong>{item.content_type}</strong> y refleja el punto de vista de su autor, no una noticia informativa.
            </div>
          )}
          <Body text={item.body} />

          {item.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2" data-testid="article-tags">
              {item.tags.map((t) => (
                <Link key={t} to={`/historias?q=${encodeURIComponent(t)}`} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground/70 hover:bg-accent">#{t}</Link>
              ))}
            </div>
          )}

          <Corrections corrections={item.corrections} />
          <Sources sources={item.sources} />
        </div>
        <aside><SponsorAd /></aside>
      </div>

      {item.related?.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16">
          <h2 className="font-serif text-2xl font-bold mb-6">Artículos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {item.related.map((r) => <ArticleCard key={r.id} item={r} to={`/historias/${r.slug}`} />)}
          </div>
        </div>
      )}
    </article>
  );
}
