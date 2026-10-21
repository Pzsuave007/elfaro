import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Home as HomeIcon, HeartPulse, Briefcase, GraduationCap, Users, Scale, Globe, Apple, Zap, Bus, Vote, ScrollText, Landmark, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { SponsorStrip } from "@/components/Sponsors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArticleCard, SectionHeading, CategoryBadge, DemoBadge } from "@/components/shared";
import { mediaUrl } from "@/lib/api";

const RESOURCE_CATS = [
  { label: "Vivienda", icon: HomeIcon }, { label: "Salud", icon: HeartPulse },
  { label: "Empleo", icon: Briefcase }, { label: "Educación", icon: GraduationCap },
  { label: "Familias", icon: Users }, { label: "Asistencia legal", icon: Scale },
  { label: "Inmigración", icon: Globe }, { label: "Alimentos", icon: Apple },
  { label: "Servicios públicos", icon: Zap }, { label: "Transporte", icon: Bus },
];

const SEARCH_EXAMPLES = ["Ayuda con renta", "Nueva ley de Oregon", "Elecciones", "Recursos de salud", "Parque estatal", "Noticias Portland"];

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [oregonInfo, setOregonInfo] = useState([]);
  const [places, setPlaces] = useState([]);
  const [settings, setSettings] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/public/articles?limit=7").then((r) => setArticles(r.data.items));
    api.get("/public/oregon-info?limit=3").then((r) => setOregonInfo(r.data.items));
    api.get("/public/places?limit=3").then((r) => setPlaces(r.data.items));
    api.get("/site-settings").then((r) => setSettings(r.data)).catch(() => {});
    api.get("/public/candidates").then((r) => setCandidates(r.data || [])).catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  const [lead, ...rest] = articles;

  return (
    <div>
      {/* HERO (original) */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground" data-testid="hero-section">
        <div className="absolute inset-0 opacity-20">
          <img src={mediaUrl(settings?.hero_image) || "https://images.unsplash.com/photo-1530563937443-1f02f662fa5c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600"} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl fade-up">
            <p className="text-xs font-sans font-semibold uppercase tracking-[0.15em] text-primary-foreground/75 mb-4">{settings?.hero_eyebrow || "Información pública en español · Oregon"}</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              {settings?.hero_title || "Información clara para vivir, participar y salir adelante en Oregon."}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-primary-foreground/80 leading-relaxed max-w-2xl">
              {settings?.hero_subtitle || "Noticias, recursos, leyes e información pública en español para nuestra comunidad."}
            </p>
          </div>
        </div>
      </section>

      {/* ELECCIONES 2026 — CANDIDATOS (flagship full-width) */}
      <section className="relative overflow-hidden border-y border-border bg-gradient-to-br from-secondary/70 via-background to-primary/5 text-foreground" data-testid="section-elecciones">
        <Vote className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 text-primary/[0.05] rotate-12" />
        <Landmark className="pointer-events-none absolute left-[-40px] bottom-[-30px] h-52 w-52 text-primary/[0.04]" />
        <Scale className="pointer-events-none absolute right-[18%] bottom-6 h-28 w-28 text-primary/[0.04]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
          {/* header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-terracotta/[0.12] px-3.5 py-1.5 mb-4">
                <Vote className="h-4 w-4 text-terracotta" />
                <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-terracotta">Elecciones 2026</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-foreground">Conoce a los candidatos</h2>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">Información neutral y equivalente para todos. Toca una candidata para ver su perfil y propuestas.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                Plataforma cívica e independiente · Todas cuentan con el mismo espacio.
              </div>
            </div>
            <Link to="/elecciones" className="shrink-0" aria-label="Comparar las propuestas de las candidatas">
              <Button size="lg" className="h-13 px-7 text-sm font-semibold tracking-wide shadow-lg shadow-primary/15" data-testid="conocer-candidatos-btn">
                <Landmark className="mr-2 h-5 w-5" /> Comparar propuestas
              </Button>
            </Link>
          </div>

          {candidates.length > 0 ? (
            <div className="space-y-4" data-testid="home-candidates">
              {candidates.slice(0, 2).map((c) => (
                <Link key={c.id} to={`/elecciones/candidato/${c.id}`} data-testid={`home-candidate-${c.id}`}
                  aria-label={`Ver perfil de ${(c.name || "").replace("[DEMO] ", "")}`}
                  className="group flex flex-col sm:flex-row items-center gap-5 sm:gap-7 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 text-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-terracotta/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl shadow-md ring-4 ring-secondary transition-all duration-300 group-hover:ring-terracotta/40">
                    {c.photo
                      ? <img src={mediaUrl(c.photo)} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <span className="grid h-full w-full place-items-center bg-secondary text-4xl font-serif font-bold text-muted-foreground">{(c.name || "?").replace("[DEMO] ", "").charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight transition-colors group-hover:text-primary">{(c.name || "").replace("[DEMO] ", "")}</h3>
                      {c.party && <span className="rounded-full bg-terracotta/[0.12] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-terracotta">{c.party}</span>}
                    </div>
                    {c.race_title && <p className="mt-1 text-sm font-medium text-muted-foreground">{c.race_title}</p>}
                    {c.priorities && c.priorities.length > 0 ? (
                      <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                        {c.priorities.slice(0, 3).map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs text-foreground/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" /> {p}
                          </span>
                        ))}
                      </div>
                    ) : c.bio ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.bio}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-terracotta">Ver perfil <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/25 bg-card/60 p-10 text-center text-muted-foreground">
              <Vote className="mx-auto mb-3 h-8 w-8 text-primary/40" />
              Pronto publicaremos a las candidatas. <Link to="/elecciones" className="font-semibold text-primary underline-offset-2 hover:underline">Más información</Link>
            </div>
          )}
        </div>
      </section>

      {/* LO QUE DEBES SABER HOY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20" data-testid="section-hoy">
        <SectionHeading eyebrow="Historias de la comunidad" title="Historias destacadas"
          action={<Link to="/historias"><Button variant="outline" data-testid="ver-mas-enterate">Ver todas las historias <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>} />
        {lead && (
          <Link to={`/historias/${lead.slug}`} data-testid={`card-${lead.slug}`}
            className="group grid md:grid-cols-2 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
            <div className="aspect-[16/10] md:aspect-auto overflow-hidden">
              <img src={mediaUrl(lead.featured_image)} alt={lead.title} loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {lead.category && <CategoryBadge>{lead.category}</CategoryBadge>}
                {lead.content_type && <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{lead.content_type}</span>}
                {lead.is_demo && <DemoBadge />}
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">{lead.title}</h3>
              {lead.summary && <p className="mt-3 text-muted-foreground line-clamp-3">{lead.summary}</p>}
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{lead.author}</span><span>·</span><span>Leer más →</span>
              </div>
            </div>
          </Link>
        )}
        {rest.length > 0 && (
          <div className={`mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 ${rest.length >= 3 ? "lg:grid-cols-3" : ""}`}>
            {rest.map((a) => <ArticleCard key={a.id} item={a} to={`/historias/${a.slug}`} />)}
          </div>
        )}
      </section>

      {/* RECURSOS — OCULTO temporalmente a pedido de la dueña
      <section className="bg-secondary/40 border-y border-border" data-testid="section-recursos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20">
          <SectionHeading eyebrow="Recursos para la comunidad" title={settings?.recursos_title || "Encuentra la ayuda que necesitas"}
            description={settings?.recursos_description || "Programas de vivienda, salud, empleo, educación y más, con información verificada."}
            action={<Link to="/recursos"><Button variant="outline" data-testid="ver-todos-recursos">Ver todos los recursos <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {RESOURCE_CATS.map(({ label, icon: Icon }) => (
              <Link key={label} to={`/recursos?group=${encodeURIComponent(label)}`}
                data-testid={`recurso-cat-${label}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* OREGON TE INFORMA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20" data-testid="section-oregon-te-informa">
        <SectionHeading eyebrow="Oregon Te Informa" title={settings?.oregon_title || "Leyes y gobierno, en lenguaje sencillo"}
          description={settings?.oregon_description || "Entiende qué cambió, a quién afecta y qué necesitas hacer."}
          action={<Link to="/oregon-te-informa"><Button variant="outline">Ver todo <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {oregonInfo.map((item) => (
            <Link key={item.id} to={`/oregon-te-informa/${item.slug}`} data-testid={`card-${item.slug}`}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-info/10 text-[hsl(var(--info))]"><ScrollText className="h-5 w-5" /></span>
                <CategoryBadge>{item.category}</CategoryBadge>
                {item.is_demo && <DemoBadge />}
              </div>
              <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
              {item.que_cambio && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.que_cambio}</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* CONOCE OREGON */}
      <section className="bg-secondary/40 border-y border-border" data-testid="section-conoce-oregon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20">
          <SectionHeading eyebrow="Conoce Oregon" title="Lugares, historia e instituciones"
            action={<Link to="/conoce-oregon"><Button variant="outline">Ver todo <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {places.map((p) => (
              <Link key={p.id} to={`/conoce-oregon/${p.slug}`} data-testid={`card-${p.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border">
                <div className="aspect-[4/3]">
                  <img src={mediaUrl(p.featured_image)} alt={p.title} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{p.category}</span>
                  <h3 className="font-serif text-xl font-bold leading-tight">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SponsorStrip />
    </div>
  );
}
