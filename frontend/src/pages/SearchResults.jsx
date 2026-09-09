import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { ArticleCard, ResourceCard, Empty } from "@/components/shared";

const GROUPS = [
  { key: "articles", label: "Noticias (Entérate)", route: "/enterate", card: "article" },
  { key: "resources", label: "Recursos", route: "/recursos", card: "resource" },
  { key: "oregon-info", label: "Oregon Te Informa", route: "/oregon-te-informa", card: "article" },
  { key: "places", label: "Conoce Oregon", route: "/conoce-oregon", card: "article" },
];

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!q) return;
    setResults(null);
    api.get(`/search?q=${encodeURIComponent(q)}`).then((r) => setResults(r.data));
  }, [q]);

  const total = results ? GROUPS.reduce((s, g) => s + (results[g.key]?.length || 0), 0) + (results.candidates?.length || 0) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
      <p className="eyebrow mb-2">Resultados de búsqueda</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold" data-testid="search-title">"{q}"</h1>
      {results && <p className="mt-2 text-muted-foreground">{total} resultado(s) encontrados</p>}

      {!results ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-secondary animate-pulse" />)}</div>
      ) : total === 0 ? (
        <div className="mt-10"><Empty text="No encontramos resultados. Intenta con otras palabras." /></div>
      ) : (
        <div className="mt-8 space-y-12">
          {GROUPS.map((g) => results[g.key]?.length > 0 && (
            <section key={g.key} data-testid={`search-group-${g.key}`}>
              <h2 className="font-serif text-2xl font-bold mb-5">{g.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results[g.key].map((item) =>
                  g.card === "resource"
                    ? <ResourceCard key={item.id} item={item} to={`${g.route}/${item.slug}`} />
                    : <ArticleCard key={item.id} item={item} to={`${g.route}/${item.slug}`} />
                )}
              </div>
            </section>
          ))}
          {results.candidates?.length > 0 && (
            <section data-testid="search-group-candidates">
              <h2 className="font-serif text-2xl font-bold mb-5">Candidatos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.candidates.map((c) => (
                  <Link key={c.id} to={`/elecciones/candidato/${c.id}`} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all">
                    <h3 className="font-serif text-lg font-bold">{c.name.replace("[DEMO] ", "")}</h3>
                    <p className="text-sm text-terracotta">{c.party} · {c.position}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
