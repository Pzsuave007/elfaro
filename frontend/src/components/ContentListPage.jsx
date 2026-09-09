import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArticleCard, ResourceCard, Empty } from "@/components/shared";

export default function ContentListPage({ kind, route, title, subtitle, categoriesKey, cardType, filters = {} }) {
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const q = params.get("q") || "";
  const [search, setSearch] = useState(q);

  useEffect(() => { api.get("/config").then((r) => setConfig(r.data)); }, []);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "50" });
    if (category) p.set("category", category);
    if (city) p.set("city", city);
    if (q) p.set("q", q);
    api.get(`/public/${kind}?${p.toString()}`).then((r) => {
      setItems(r.data.items); setTotal(r.data.total);
    }).finally(() => setLoading(false));
  }, [kind, category, city, q]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const submitSearch = (e) => { e.preventDefault(); setFilter("q", search); };

  const cats = config?.[categoriesKey] || [];

  return (
    <div>
      <section className="border-b border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight" data-testid="list-page-title">{title}</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          <form onSubmit={submitSearch} className="mt-6 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar en ${title}...`}
              className="pl-10 h-12 bg-card" data-testid="list-search-input" />
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="flex flex-wrap gap-2 mb-8" data-testid="category-filters">
          <button onClick={() => setFilter("category", "")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!category ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-accent"}`}
            data-testid="filter-todas">Todas</button>
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter("category", c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-accent"}`}
              data-testid={`filter-${c}`}>{c}</button>
          ))}
        </div>

        {(category || city || q) && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total} resultado(s){category ? ` en "${category}"` : ""}{q ? ` para "${q}"` : ""}
            {" "}<button onClick={() => setParams({})} className="text-primary underline" data-testid="clear-filters">Limpiar filtros</button>
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-xl bg-secondary animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="content-grid">
            {items.map((item) =>
              cardType === "resource"
                ? <ResourceCard key={item.id} item={item} to={`${route}/${item.slug}`} />
                : <ArticleCard key={item.id} item={cardType === "oregon-info" && !item.summary ? { ...item, summary: item.que_cambio } : item} to={`${route}/${item.slug}`} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
