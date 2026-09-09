import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Globe, ExternalLink } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { DemoBadge, Sources } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function CandidateDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);

  useEffect(() => { api.get(`/public/candidates/${id}`).then((r) => setC(r.data)).catch(() => setC(false)); }, [id]);

  if (c === false) return <div className="max-w-2xl mx-auto px-6 py-24 text-center"><h1 className="font-serif text-3xl font-bold">No encontrado</h1><Link to="/elecciones" className="mt-4 inline-block text-primary underline">Volver</Link></div>;
  if (!c) return <div className="max-w-4xl mx-auto px-6 py-24"><div className="h-8 w-1/2 bg-secondary animate-pulse rounded" /></div>;

  const questions = c.race?.questions || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-16">
      {c.race && (
        <Link to={`/elecciones/carrera/${c.race.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6" data-testid="back-link">
          <ArrowLeft className="h-4 w-4" /> {c.race.title}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {c.photo && <img src={mediaUrl(c.photo)} alt={c.name} className="h-32 w-32 rounded-2xl object-cover shrink-0" />}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight" data-testid="candidate-name">{c.name.replace("[DEMO] ", "")}</h1>
            {c.is_demo && <DemoBadge />}
          </div>
          <p className="mt-1 text-lg text-terracotta font-medium">{c.party}</p>
          <p className="text-muted-foreground">{c.position}{c.district ? ` · Distrito: ${c.district}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Globe className="mr-1.5 h-4 w-4" /> Sitio web</Button></a>}
            {c.socials?.twitter && <a href="#" onClick={(e)=>e.preventDefault()}><Button variant="ghost" size="sm">{c.socials.twitter}</Button></a>}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {c.bio && <section><h2 className="font-serif text-xl font-bold mb-2">Biografía</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{c.bio}</p></section>}
        {c.experience && <section><h2 className="font-serif text-xl font-bold mb-2">Experiencia</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{c.experience}</p></section>}
        {c.campaign_info && <section><h2 className="font-serif text-xl font-bold mb-2">Información de campaña</h2><p className="text-foreground/80 leading-relaxed whitespace-pre-line">{c.campaign_info}</p></section>}
        {c.priorities?.length > 0 && (
          <section><h2 className="font-serif text-xl font-bold mb-2">Prioridades</h2>
            <ul className="space-y-1.5">{c.priorities.map((p, i) => <li key={i} className="flex gap-2 text-foreground/80"><span className="text-primary">•</span>{p}</li>)}</ul>
          </section>
        )}
        {questions.length > 0 && (
          <section data-testid="candidate-answers">
            <h2 className="font-serif text-2xl font-bold mb-4">El Foro Pregunta</h2>
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="rounded-xl border border-border bg-card p-5">
                  <p className="font-medium mb-1.5">{q.text}</p>
                  <p className="text-foreground/80">{c.answers?.[q.id] || <span className="italic text-muted-foreground">Sin respuesta registrada</span>}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        <Sources sources={c.sources} />
      </div>
    </div>
  );
}
