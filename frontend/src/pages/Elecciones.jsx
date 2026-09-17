import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Vote, Scale, ArrowRight } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { DemoBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function Elecciones() {
  const [elections, setElections] = useState([]);
  const [races, setRaces] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    api.get("/public/elections").then((r) => setElections(r.data));
    api.get("/public/races").then((r) => setRaces(r.data));
    api.get("/public/candidates").then((r) => setCandidates(r.data || [])).catch(() => {});
  }, []);

  const candsForRace = (rid) => candidates.filter((c) => c.race_id === rid);

  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20">
          <p className="text-xs font-sans font-semibold uppercase tracking-[0.15em] text-primary-foreground/75 mb-3">Elecciones</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">Conoce a los candidatos</h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl">Conoce sus propuestas. Decide por ti mismo. Presentamos a todos los candidatos con el mismo formato, las mismas preguntas y fuentes identificadas.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm">
            <Scale className="h-4 w-4" /> Información neutral y no partidista. Nunca declaramos quién es "mejor".
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
        {elections.slice(0, 1).map((el) => (
          <div key={el.id} className="mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Vote className="h-6 w-6 text-primary" /> {el.name}
            </h2>
            {el.date && <p className="text-muted-foreground mt-1">Fecha: {el.date}</p>}

            {races.filter((r) => r.election_id === el.id).map((race) => {
              const cands = candsForRace(race.id);
              return (
                <div key={race.id} className="mt-8" data-testid={`race-block-${race.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">{race.race_type}</span>
                      <h3 className="font-serif text-xl font-bold">{race.title}{race.district ? ` · ${race.district}` : ""}</h3>
                    </div>
                    {cands.length > 1 && (
                      <Link to={`/elecciones/carrera/${race.id}`} data-testid={`compare-${race.id}`}>
                        <Button variant="outline" size="sm"><Scale className="mr-1.5 h-4 w-4" /> Comparar propuestas</Button>
                      </Link>
                    )}
                  </div>

                  {cands.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">Candidatos próximamente.</p>
                  ) : (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {cands.map((c) => (
                        <Link key={c.id} to={`/elecciones/candidato/${c.id}`} data-testid={`candidate-card-${c.id}`}
                          className="group rounded-xl border border-border bg-card p-5 text-center transition-all hover:shadow-md hover:-translate-y-0.5">
                          {c.photo
                            ? <img src={mediaUrl(c.photo)} alt={c.name} className="mx-auto h-24 w-24 rounded-full object-cover" />
                            : <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-secondary text-2xl font-serif font-bold text-muted-foreground">{(c.name || "?").replace("[DEMO] ", "").charAt(0)}</span>}
                          <h4 className="mt-3 font-serif text-base font-bold leading-tight group-hover:text-primary transition-colors">{(c.name || "").replace("[DEMO] ", "")} {c.is_demo && <DemoBadge />}</h4>
                          {c.party && <p className="text-xs text-terracotta font-medium mt-0.5">{c.party}</p>}
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">Ver perfil <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
