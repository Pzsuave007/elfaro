import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, LifeBuoy, ScrollText, MapPin, Users, Eye, Sparkles, FileEdit, Clock } from "lucide-react";
import { api } from "@/lib/api";

function StatCard({ icon: Icon, label, value, sub, to, testid }) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md" data-testid={testid}>
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
        <span className="font-serif text-3xl font-bold">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get("/stats/dashboard").then((r) => setStats(r.data)); }, []);

  if (!stats) return <div className="text-muted-foreground">Cargando estadísticas...</div>;

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold" data-testid="dashboard-title">Panel principal</h1>
      <p className="text-muted-foreground mt-1">Resumen de contenido y actividad de la plataforma.</p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Newspaper} label="Historias" value={stats.articles.total} sub={`${stats.articles.published} publicadas · ${stats.articles.draft} borradores`} to="/admin/articles" testid="stat-articles" />
        <StatCard icon={LifeBuoy} label="Recursos" value={stats.resources.total} sub={`${stats.resources.published} publicados`} to="/admin/resources" testid="stat-resources" />
        <StatCard icon={ScrollText} label="Leyes publicadas" value={stats.oregon_info.published} sub={`${stats.oregon_info.total} en total`} to="/admin/oregon-info" testid="stat-oregon-info" />
        <StatCard icon={MapPin} label="Lugares" value={stats.places.published} sub={`${stats.places.total} en total`} to="/admin/places" testid="stat-places" />
        <StatCard icon={Users} label="Candidatos" value={stats.candidates} sub={`${stats.races} carreras`} to="/admin/elections" testid="stat-candidates" />
        <StatCard icon={Eye} label="Vistas totales" value={stats.total_views} testid="stat-views" />
        <StatCard icon={Sparkles} label="Con apoyo de AI" value={stats.ai_articles} sub="artículos" testid="stat-ai" />
        <StatCard icon={FileEdit} label="Pendientes" value={stats.articles.pending + stats.resources.pending} sub="por revisar/aprobar" testid="stat-pending" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-serif text-lg font-bold mb-4">Artículos más vistos</h2>
          {stats.top_articles.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay datos.</p> : (
            <ul className="divide-y divide-border">
              {stats.top_articles.map((a) => (
                <li key={a.slug} className="flex items-center justify-between py-2.5">
                  <Link to={`/historias/${a.slug}`} target="_blank" className="text-sm hover:text-primary truncate pr-4">{a.title}</Link>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0"><Eye className="h-3.5 w-3.5" /> {a.views || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-bold mb-4">Búsquedas populares</h2>
          {stats.popular_searches.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay búsquedas.</p> : (
            <div className="flex flex-wrap gap-2">
              {stats.popular_searches.map((s) => (
                <span key={s.term} className="rounded-full bg-secondary px-3 py-1 text-xs">{s.term} <span className="text-muted-foreground">({s.count})</span></span>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.upcoming.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Próximas publicaciones</h2>
          <ul className="divide-y divide-border">
            {stats.upcoming.map((a) => (
              <li key={a.slug} className="flex items-center justify-between py-2.5 text-sm">
                <span>{a.title}</span><span className="text-muted-foreground">{a.published_at}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
