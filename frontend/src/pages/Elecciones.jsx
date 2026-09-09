import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Vote, Users, ArrowRight, Scale } from "lucide-react";
import { api } from "@/lib/api";

export default function Elecciones() {
  const [elections, setElections] = useState([]);
  const [races, setRaces] = useState([]);

  useEffect(() => {
    api.get("/public/elections").then((r) => setElections(r.data));
    api.get("/public/races").then((r) => setRaces(r.data));
  }, []);

  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 sm:py-20">
          <p className="eyebrow text-primary-foreground/70 mb-3">Elecciones</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">Conoce a los candidatos</h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl">Conoce sus propuestas. Decide por ti mismo. Presentamos a todos los candidatos con el mismo formato, las mismas preguntas y fuentes identificadas.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm">
            <Scale className="h-4 w-4" /> Información neutral y no partidista. Nunca declaramos quién es "mejor".
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
        {elections.map((el) => (
          <div key={el.id} className="mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Vote className="h-6 w-6 text-primary" /> {el.name}
            </h2>
            {el.date && <p className="text-muted-foreground mt-1">Fecha: {el.date}</p>}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {races.filter((r) => r.election_id === el.id).map((race) => (
                <Link key={race.id} to={`/elecciones/carrera/${race.id}`} data-testid={`race-${race.id}`}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">{race.race_type}</span>
                  <h3 className="font-serif text-xl font-bold mt-1 group-hover:text-primary transition-colors">{race.title}</h3>
                  {race.district && <p className="text-sm text-muted-foreground mt-1">Distrito: {race.district}</p>}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> {race.candidate_count} candidatos</span>
                    <span className="flex items-center gap-1 font-medium text-primary">Comparar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
