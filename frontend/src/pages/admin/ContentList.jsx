import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ExternalLink, Search } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KIND_META } from "@/pages/admin/schemas";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const STATUS_STYLE = {
  draft: "bg-muted text-muted-foreground",
  needs_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  published: "bg-primary/15 text-primary",
  archived: "bg-secondary text-muted-foreground",
};
const STATUS_LABEL = { draft: "Borrador", needs_review: "En revisión", approved: "Aprobado", scheduled: "Programado", published: "Publicado", archived: "Archivado" };

export default function ContentList() {
  const { kind } = useParams();
  const meta = KIND_META[kind];
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (statusFilter) p.set("status", statusFilter);
    if (q) p.set("q", q);
    api.get(`/admin/${kind}?${p.toString()}`).then((r) => setItems(r.data));
  }, [kind, statusFilter, q]);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    try { await api.delete(`/admin/${kind}/${id}`); toast.success("Eliminado"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "No se pudo eliminar"); }
  };

  if (!meta) return <p>Tipo no válido</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold" data-testid="content-list-title">{meta.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} elemento(s)</p>
        </div>
        <Button onClick={() => navigate(`/admin/${kind}/new`)} data-testid="new-content-btn"><Plus className="mr-2 h-4 w-4" /> Nuevo {meta.label}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título..." className="pl-10" data-testid="admin-search" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["", "draft", "needs_review", "published", "scheduled", "archived"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70"}`}>
              {s === "" ? "Todos" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm" data-testid="content-table">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Título</th><th className="p-4 hidden sm:table-cell">Categoría</th><th className="p-4">Estado</th><th className="p-4 hidden md:table-cell">Vistas</th><th className="p-4 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay contenido. Crea el primero.</td></tr>}
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-secondary/30" data-testid={`row-${it.id}`}>
                <td className="p-4">
                  <span className="font-medium">{it.title}</span>
                  {it.is_demo && <span className="ml-2 text-[10px] font-semibold uppercase text-terracotta">Demo</span>}
                  {it.used_ai && <span className="ml-2 text-[10px] font-semibold uppercase text-primary">AI</span>}
                </td>
                <td className="p-4 hidden sm:table-cell text-muted-foreground">{it.category}</td>
                <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[it.status] || ""}`}>{STATUS_LABEL[it.status] || it.status}</span></td>
                <td className="p-4 hidden md:table-cell text-muted-foreground">{it.views || 0}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    {it.status === "published" && <a href={`${meta.route}/${it.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" title="Ver"><ExternalLink className="h-4 w-4" /></Button></a>}
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/${kind}/${it.id}`)} data-testid={`edit-${it.id}`}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" data-testid={`delete-${it.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar "{it.title}"?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => del(it.id)} data-testid={`confirm-delete-${it.id}`}>Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
