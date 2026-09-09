import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ArticleCard, ResourceCard, Empty } from "@/components/shared";

export default function ContentListPage({ kind, route, title, subtitle, categoriesKey, cardType, groups = null }) {
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [facets, setFacets] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const group = params.get("group") || "";
  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const [search, setSearch] = useState(q);

  useEffect(() => { api.get("/config").then((r) => setConfig(r.data)); }, []);
  useEffect(() => { api.get(`/public/${kind}/facets`).then((r) => setFacets(r.data || {})).catch(() => setFacets({})); }, [kind]);

  const hasContent = (cats) => (cats || []).some((c) => (facets[c] || 0) > 0);
  const visibleGroups = groups ? groups.filter((g) => hasContent(g.categories)) : null;
  const visibleFlat = (config?.[categoriesKey] || []).filter((c) => (facets[c] || 0) > 0);

  const activeGroup = groups ? groups.find((g) => g.label === group) : null;

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "50" });
    if (category) p.set("category", category);
    else if (activeGroup?.categories) p.set("categories", activeGroup.categories.join(","));
    if (q) p.set("q", q);
    api.get(`/public/${kind}?${p.toString()}`).then((r) => {
      setItems(r.data.items); setTotal(r.data.total);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, category, group, q]);

  useEffect(() => { load(); }, [load]);

  const selectGroup = (g) => {
    const next = new URLSearchParams(params);
    next.delete("category");
    if (g) next.set("group", g); else next.delete("group");
    setParams(next);
  };
  const selectCategory = (c) => {
    const next = new URLSearchParams(params);
    if (c) next.set("category", c); else next.delete("category");
    setParams(next);
  };
  const submitSearch = (e) => { e.preventDefault(); const next = new URLSearchParams(params); if (search) next.set("q", search); else next.delete("q"); setParams(next); };

  const activeSubs = (activeGroup?.subs || []).filter((s) => (facets[s] || 0) > 0);

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
        {/* Top level: groups or flat categories */}
        <div className="flex flex-wrap gap-2 mb-4" data-testid="category-filters">
          <button onClick={() => groups ? selectGroup("") : selectCategory("")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${(!group && !category) ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-accent"}`}
            data-testid="filter-todas">Todas</button>
          {groups
            ? visibleGroups.map((g) => (
                <button key={g.label} onClick={() => selectGroup(g.label)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${group === g.label ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-accent"}`}
                  data-testid={`filter-${g.label}`}>{g.label}</button>
              ))
            : visibleFlat.map((c) => (
                <button key={c} onClick={() => selectCategory(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70 hover:bg-accent"}`}
                  data-testid={`filter-${c}`}>{c}</button>
              ))}
        </div>

        {/* Sub-tabs for a group with children */}
        {activeSubs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pl-1 border-l-2 border-primary/30 ml-1" data-testid="subcategory-filters">
            <span className="self-center text-xs uppercase tracking-wider text-muted-foreground mr-1 pl-3">{activeGroup.label}:</span>
            <button onClick={() => selectCategory("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!category ? "bg-primary/15 text-primary" : "bg-secondary text-foreground/60 hover:bg-accent"}`}
              data-testid="subfilter-todo">Todo</button>
            {activeSubs.map((s) => (
              <button key={s} onClick={() => selectCategory(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${category === s ? "bg-primary/15 text-primary" : "bg-secondary text-foreground/60 hover:bg-accent"}`}
                data-testid={`subfilter-${s}`}>{s}</button>
            ))}
          </div>
        )}

        {(group || category || q) && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total} resultado(s){category ? ` en "${category}"` : (group ? ` en "${group}"` : "")}{q ? ` para "${q}"` : ""}
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
