import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Scale, ExternalLink } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { DemoBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function RaceCompare() {
  const { raceId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/public/races/${raceId}`).then((r) => setData(r.data)).catch(() => setData(false));
  }, [raceId]);

  if (data === false) return <div className="max-w-2xl mx-auto px-6 py-24 text-center"><h1 className="font-serif text-3xl font-bold">Carrera no encontrada</h1><Link to="/elecciones" className="mt-4 inline-block text-primary underline">Volver</Link></div>;
  if (!data) return <div className="max-w-5xl mx-auto px-6 py-24"><div className="h-8 w-2/3 bg-secondary animate-pulse rounded" /></div>;

  const { race, candidates } = data;
  const questions = race.questions || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-16">
      <Link to="/elecciones" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6" data-testid="back-link">
        <ArrowLeft className="h-4 w-4" /> Elecciones
      </Link>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">{race.race_type}</span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight" data-testid="race-title">{race.title}</h1>
      {race.description && <p className="mt-3 text-lg text-muted-foreground">{race.description}</p>}

      <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm">
        <Scale className="h-4 w-4 text-primary" /> Comparación neutral. Cada candidato responde exactamente las mismas preguntas.
      </div>

      {/* Candidate headers */}
      <div className="mt-8 overflow-x-auto" data-testid="compare-table">
        <div className="min-w-[640px]">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${candidates.length}, minmax(220px, 1fr))` }}>
            <div />
            {candidates.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 text-center">
                {c.photo && <img src={mediaUrl(c.photo)} alt={c.name} className="mx-auto h-24 w-24 rounded-full object-cover" />}
                <h3 className="mt-3 font-serif text-lg font-bold leading-tight">{c.name.replace("[DEMO] ", "")} {c.is_demo && <DemoBadge />}</h3>
                <p className="text-sm text-terracotta font-medium">{c.party}</p>
                <Link to={`/elecciones/candidato/${c.id}`}><Button variant="outline" size="sm" className="mt-3" data-testid={`view-candidate-${c.id}`}>Ver perfil</Button></Link>
              </div>
            ))}
          </div>

          {/* El Faro Pregunta */}
          {questions.length > 0 && (
            <div className="mt-6">
              <h2 className="font-serif text-2xl font-bold mb-4">El Faro Pregunta</h2>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${candidates.length}, minmax(220px, 1fr))` }}>
                    <div className="rounded-xl bg-secondary p-4 font-medium text-sm sticky left-0">{q.text}</div>
                    {candidates.map((c) => (
                      <div key={c.id} className="rounded-xl border border-border bg-card p-4 text-sm text-foreground/80">
                        {c.answers?.[q.id] || <span className="italic text-muted-foreground">Sin respuesta registrada</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priorities row */}
          <div className="mt-6 grid gap-4 items-start" style={{ gridTemplateColumns: `200px repeat(${candidates.length}, minmax(220px, 1fr))` }}>
            <div className="rounded-xl bg-secondary p-4 font-medium text-sm">Prioridades</div>
            {candidates.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                <ul className="space-y-1 text-sm text-foreground/80">
                  {(c.priorities || []).map((p, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
