import { Link } from "react-router-dom";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { mediaUrl, formatDate } from "@/lib/api";

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-terracotta" data-testid="demo-badge">
      Demo
    </span>
  );
}

export function CategoryBadge({ children }) {
  return (
    <span className="inline-block rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
      {children}
    </span>
  );
}

export function TypeTag({ type }) {
  if (!type) return null;
  const isOpinion = ["Opinión", "Contenido patrocinado"].includes(type);
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      isOpinion ? "bg-terracotta/15 text-terracotta" : "bg-primary/10 text-primary"
    }`} data-testid="content-type-tag">
      {type}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ArticleCard({ item, to, large = false }) {
  return (
    <Link to={to} data-testid={`card-${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      {item.featured_image && (
        <div className={`overflow-hidden ${large ? "aspect-[16/9]" : "aspect-[3/2]"}`}>
          <img src={mediaUrl(item.featured_image)} alt={item.title} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {item.category && <CategoryBadge>{item.category}</CategoryBadge>}
          {item.content_type && <TypeTag type={item.content_type} />}
          {item.is_demo && <DemoBadge />}
        </div>
        <h3 className={`font-serif font-bold leading-snug tracking-tight group-hover:text-primary transition-colors ${large ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
          {item.title}
        </h3>
        {item.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">{item.summary}</p>}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-3">
            <span>{formatDate(item.published_at)}</span>
            {item.reading_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.reading_time} min</span>}
          </span>
          <span className="flex items-center gap-1 font-medium text-primary">Leer más <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}

export function ResourceCard({ item, to }) {
  return (
    <Link to={to} data-testid={`card-${item.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <CategoryBadge>{item.category}</CategoryBadge>
        {item.is_demo && <DemoBadge />}
      </div>
      <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
      {item.organization && <p className="mt-1 text-sm font-medium text-terracotta">{item.organization}</p>}
      {item.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">{item.summary}</p>}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{[item.city, item.county].filter(Boolean).join(", ")}</span>
        {item.official_source && <span className="flex items-center gap-1 text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Verificado</span>}
      </div>
    </Link>
  );
}

export function Empty({ text = "No hay contenido disponible todavía." }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground" data-testid="empty-state">
      {text}
    </div>
  );
}

export function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-10 rounded-xl border border-border bg-secondary/50 p-6" data-testid="sources-block">
      <h3 className="flex items-center gap-2 font-serif text-lg font-bold mb-4">
        <ShieldCheck className="h-5 w-5 text-primary" /> Fuentes consultadas
      </h3>
      <ul className="space-y-3">
        {sources.map((s, i) => (
          <li key={i} className="text-sm">
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              {s.name || s.url}
            </a>
            <span className="text-muted-foreground">
              {s.organization ? ` · ${s.organization}` : ""}{s.type ? ` · ${s.type}` : ""}{s.date ? ` · ${s.date}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Corrections({ corrections }) {
  if (!corrections || corrections.length === 0) return null;
  return (
    <div className="mt-6 rounded-xl border-l-4 border-terracotta bg-terracotta/5 p-5" data-testid="corrections-block">
      <h3 className="font-serif text-base font-bold mb-2">Corrección editorial</h3>
      {corrections.map((c, i) => (
        <div key={i} className="text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">{formatDate(c.date)}:</span> {c.what_corrected} — {c.explanation}
        </div>
      ))}
    </div>
  );
}
