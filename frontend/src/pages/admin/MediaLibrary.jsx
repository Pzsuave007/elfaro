import { useEffect, useState } from "react";
import { Upload, Trash2, Copy, Loader2, FileText, Film } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/media/list").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    for (const file of files) {
      const fd = new FormData(); fd.append("file", file);
      try { await api.post("/media", fd, { headers: { "Content-Type": "multipart/form-data" } }); }
      catch { toast.error(`Error subiendo ${file.name}`); }
    }
    setBusy(false); toast.success("Subida completa"); load();
  };
  const del = async (id) => { await api.delete(`/media/${id}`); toast.success("Eliminado"); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-serif text-3xl font-bold" data-testid="media-title">Media Library</h1><p className="text-muted-foreground text-sm mt-1">Imágenes, videos, PDFs y documentos.</p></div>
        <label><input type="file" multiple className="hidden" onChange={upload} accept="image/*,video/*,application/pdf" />
          <span className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground cursor-pointer hover:bg-primary/90" data-testid="upload-media-btn">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir archivos
          </span>
        </label>
      </div>

      {items.length === 0 ? <p className="text-muted-foreground">No hay archivos todavía.</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="media-grid">
          {items.map((m) => (
            <div key={m.id} className="group rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-square bg-secondary grid place-items-center overflow-hidden">
                {m.kind === "image" ? <img src={mediaUrl(m.url)} alt={m.original_filename} className="h-full w-full object-cover" />
                  : m.kind === "video" ? <Film className="h-10 w-10 text-muted-foreground" /> : <FileText className="h-10 w-10 text-muted-foreground" />}
              </div>
              <div className="p-3">
                <p className="text-xs truncate" title={m.original_filename}>{m.original_filename}</p>
                <div className="mt-2 flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => { navigator.clipboard.writeText(m.url); toast.success("URL copiada"); }}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => del(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
