import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Home as HomeIcon, HeartPulse, Briefcase, GraduationCap, Users, Scale, Globe, Apple, Zap, Bus, Vote, ScrollText, Landmark } from "lucide-react";
import { api } from "@/lib/api";
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
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/public/articles?limit=5").then((r) => setArticles(r.data.items));
    api.get("/public/oregon-info?limit=3").then((r) => setOregonInfo(r.data.items));
    api.get("/public/places?limit=3").then((r) => setPlaces(r.data.items));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  const [lead, ...rest] = articles;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground" data-testid="hero-section">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1530563937443-1f02f662fa5c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl fade-up">
            <p className="eyebrow text-primary-foreground/70 mb-4">Información pública en español · Oregon</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Información para vivir, participar y entender Oregon.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-primary-foreground/80 leading-relaxed max-w-2xl">
              Noticias, recursos, leyes e información pública en español para nuestra comunidad.
            </p>

            <form onSubmit={submit} className="mt-9 max-w-2xl" data-testid="hero-search-form">
              <label className="block text-sm font-medium text-primary-foreground/80 mb-2">¿Qué información estás buscando?</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Ayuda con renta, nueva ley, elecciones..."
                    className="h-14 pl-12 text-base bg-white text-foreground border-0 rounded-lg"
                    data-testid="hero-search-input" />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 bg-terracotta hover:bg-terracotta/90 text-white rounded-lg" data-testid="hero-search-button">
                  Buscar
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {SEARCH_EXAMPLES.map((ex) => (
                  <button key={ex} type="button" onClick={() => navigate(`/buscar?q=${encodeURIComponent(ex)}`)}
                    className="rounded-full border border-white/25 px-3 py-1.5 text-xs text-primary-foreground/85 hover:bg-white/10 transition-colors"
                    data-testid={`hero-example-${ex}`}>
                    {ex}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* LO QUE DEBES SABER HOY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20" data-testid="section-hoy">
        <SectionHeading eyebrow="Lo que debes saber hoy" title="Historias destacadas"
          action={<Link to="/enterate"><Button variant="outline" data-testid="ver-mas-enterate">Ver todo Entérate <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>} />
        {lead && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8"><ArticleCard item={lead} to={`/enterate/${lead.slug}`} large /></div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              {rest.slice(0, 2).map((a) => <ArticleCard key={a.id} item={a} to={`/enterate/${a.slug}`} />)}
            </div>
          </div>
        )}
        {rest.length > 2 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rest.slice(2).map((a) => <ArticleCard key={a.id} item={a} to={`/enterate/${a.slug}`} />)}
          </div>
        )}
      </section>

      {/* RECURSOS */}
      <section className="bg-secondary/40 border-y border-border" data-testid="section-recursos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20">
          <SectionHeading eyebrow="Recursos para la comunidad" title="Encuentra la ayuda que necesitas"
            description="Programas de vivienda, salud, empleo, educación y más, con información verificada."
            action={<Link to="/recursos"><Button variant="outline" data-testid="ver-todos-recursos">Ver todos los recursos <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {RESOURCE_CATS.map(({ label, icon: Icon }) => (
              <Link key={label} to={`/recursos?category=${encodeURIComponent(label)}`}
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

      {/* OREGON TE INFORMA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20" data-testid="section-oregon-te-informa">
        <SectionHeading eyebrow="Oregon Te Informa" title="Leyes y gobierno, en lenguaje sencillo"
          description="Entiende qué cambió, a quién afecta y qué necesitas hacer."
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

      {/* ELECCIONES 2026 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-16" data-testid="section-elecciones">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Vote className="h-6 w-6" /></span>
            <div>
              <p className="eyebrow mb-1">Elecciones 2026</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">Conoce a los candidatos. Conoce sus propuestas.</h2>
              <p className="mt-2 text-muted-foreground">Decide por ti mismo. Información neutral y equivalente para todos los candidatos.</p>
            </div>
          </div>
          <Link to="/elecciones"><Button size="lg" data-testid="conocer-candidatos-btn"><Landmark className="mr-2 h-4 w-4" /> Conocer a los candidatos</Button></Link>
        </div>
      </section>
    </div>
  );
}
