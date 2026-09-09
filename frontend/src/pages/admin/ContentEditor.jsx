import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Upload, Plus, X, Eye, Sparkles, Image as ImageIcon } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { SCHEMAS, KIND_META } from "@/pages/admin/schemas";
import { AIAssistant } from "@/components/admin/AIAssistant";
import { AIResearch } from "@/components/admin/AIResearch";

const WORKFLOW = [
  { v: "draft", l: "Borrador" }, { v: "needs_review", l: "En revisión" }, { v: "approved", l: "Aprobado" },
  { v: "scheduled", l: "Programado" }, { v: "published", l: "Publicado" }, { v: "archived", l: "Archivado" },
];

function AIImageButton({ aiContext, onChange }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState("comic");
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const gen = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/ai/illustrate", {
        kind: aiContext.kind,
        title: aiContext.title || "",
        summary: aiContext.summary || "",
        body: aiContext.body || "",
        style,
        custom_prompt: customPrompt,
      });
      onChange(data.url);
      toast.success("Imagen generada y aplicada");
      setOpen(false);
    } catch (e) { toast.error(e.response?.data?.detail || "Error al generar imagen"); }
    finally { setBusy(false); }
  };
  const tab = (v, l) => (
    <button type="button" onClick={() => setStyle(v)} data-testid={`illustrate-style-${v}`}
      className={`rounded-md px-3 py-1.5 text-sm ${style === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</button>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="border-primary/40 text-primary shrink-0" data-testid="ai-illustrate-btn">
          <Sparkles className="mr-1.5 h-4 w-4" /> Ilustrar con AI
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="ai-illustrate-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Ilustrar el contenido</DialogTitle>
          <DialogDescription>La AI crea una imagen que representa el artículo. Describe la escena o deja que la AI la proponga a partir del título y el resumen. Libre de copyright.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Estilo</Label>
            <div className="inline-flex rounded-lg border border-border p-0.5">{tab("comic", "Cómic")}{tab("illustration", "Ilustración")}{tab("photo", "Foto")}</div>
          </div>
          <div>
            <Label className="mb-1.5 block">Describe la imagen (opcional)</Label>
            <Textarea rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Si lo dejas vacío, la AI creará la escena a partir del contenido del artículo." data-testid="ai-illustrate-prompt" />
          </div>
          <Button type="button" onClick={gen} disabled={busy} data-testid="ai-illustrate-run">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />} Generar imagen
          </Button>
          <p className="text-xs text-muted-foreground">Puede tardar hasta 1 minuto.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImageUpload({ value, onChange, testid, aiContext }) {
  const [busy, setBusy] = useState(false);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
      toast.success("Imagen subida");
    } catch (err) { toast.error("Error al subir"); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL de imagen o sube un archivo" data-testid={testid} className="min-w-[180px] flex-1" />
        <label className="shrink-0">
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
          <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input px-3 text-sm cursor-pointer hover:bg-accent">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir
          </span>
        </label>
        {aiContext && <AIImageButton aiContext={aiContext} onChange={onChange} />}
      </div>
      {value && <img src={mediaUrl(value)} alt="" className="h-32 rounded-lg object-cover border border-border" />}
    </div>
  );
}

function GalleryEditor({ value = [], onChange }) {
  const add = () => onChange([...(value || []), ""]);
  const set = (i, v) => { const n = [...value]; n[i] = v; onChange(n); };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {(value || []).map((g, i) => (
        <div key={i} className="flex gap-2">
          <Input value={g} onChange={(e) => set(i, e.target.value)} placeholder="URL de imagen" />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Agregar imagen</Button>
    </div>
  );
}

function SourcesEditor({ value = [], onChange, sourceTypes }) {
  const add = () => onChange([...(value || []), { name: "", url: "", organization: "", type: "Gobierno", date: "" }]);
  const set = (i, k, v) => { const n = [...value]; n[i] = { ...n[i], [k]: v }; onChange(n); };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {(value || []).map((s, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2" data-testid={`source-${i}`}>
          <div className="flex gap-2">
            <Input value={s.name} onChange={(e) => set(i, "name", e.target.value)} placeholder="Nombre de la fuente" />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
          </div>
          <Input value={s.url} onChange={(e) => set(i, "url", e.target.value)} placeholder="URL" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={s.organization} onChange={(e) => set(i, "organization", e.target.value)} placeholder="Organización" />
            <Select value={s.type} onValueChange={(v) => set(i, "type", v)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>{(sourceTypes || []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} data-testid="add-source"><Plus className="mr-1.5 h-4 w-4" /> Agregar fuente</Button>
    </div>
  );
}

export default function ContentEditor() {
  const { kind, id } = useParams();
  const isNew = id === "new";
  const meta = KIND_META[kind];
  const schema = SCHEMAS[kind] || [];
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [values, setValues] = useState({ status: "draft", tags: [], sources: [], gallery: [] });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => { api.get("/config").then((r) => setConfig(r.data)); }, []);
  useEffect(() => {
    if (!isNew) api.get(`/admin/${kind}/${id}`).then((r) => { setValues(r.data); setLoaded(true); });
  }, [kind, id, isNew]);

  const upd = (field, v) => setValues((prev) => ({ ...prev, [field]: v }));

  const save = async (statusOverride) => {
    if (!values.title) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    const payload = { ...values };
    if (statusOverride) payload.status = statusOverride;
    try {
      let res;
      if (isNew) res = await api.post(`/admin/${kind}`, payload);
      else res = await api.put(`/admin/${kind}/${id}`, payload);
      toast.success("Guardado correctamente");
      if (isNew) navigate(`/admin/${kind}`);
      else setValues(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al guardar");
    } finally { setSaving(false); }
  };

  if (!meta) return <p>Tipo no válido</p>;
  if (!loaded || !config) return <div className="text-muted-foreground">Cargando...</div>;

  const renderField = (f) => {
    const common = { "data-testid": `field-${f.name}` };
    switch (f.type) {
      case "textarea":
        return <Textarea rows={f.big ? 12 : 3} value={values[f.name] || ""} onChange={(e) => upd(f.name, e.target.value)} {...common} />;
      case "number":
        return <Input type="number" value={values[f.name] ?? ""} onChange={(e) => upd(f.name, e.target.value ? Number(e.target.value) : "")} {...common} />;
      case "checkbox":
        return <div className="flex items-center gap-2 h-10"><Switch checked={!!values[f.name]} onCheckedChange={(v) => upd(f.name, v)} {...common} /><span className="text-sm text-muted-foreground">{values[f.name] ? "Sí" : "No"}</span></div>;
      case "selectConfig": {
        const opts = config[f.cfg] || [];
        return (
          <Select value={values[f.name] || ""} onValueChange={(v) => upd(f.name, v === "__none" ? "" : v)}>
            <SelectTrigger {...common}><SelectValue placeholder="Selecciona..." /></SelectTrigger>
            <SelectContent>
              {f.optional && <SelectItem value="__none">— Ninguno —</SelectItem>}
              {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      }
      case "image":
        return <ImageUpload value={values[f.name]} onChange={(v) => upd(f.name, v)} testid={`field-${f.name}`}
          aiContext={{ kind, title: values.title, summary: values.summary, body: values.body || values.description || values.what_offers || values.que_cambio || "" }} />;
      case "gallery":
        return <GalleryEditor value={values[f.name]} onChange={(v) => upd(f.name, v)} />;
      case "tags":
        return <Input value={Array.isArray(values[f.name]) ? values[f.name].join(", ") : (values[f.name] || "")}
          onChange={(e) => upd(f.name, e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} {...common} />;
      case "sources":
        return <SourcesEditor value={values[f.name]} onChange={(v) => upd(f.name, v)} sourceTypes={config.source_types} />;
      default:
        return <Input value={values[f.name] || ""} onChange={(e) => upd(f.name, e.target.value)} {...common} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button onClick={() => navigate(`/admin/${kind}`)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary" data-testid="editor-back">
          <ArrowLeft className="h-4 w-4" /> {meta.title}
        </button>
        <div className="flex items-center gap-2">
          <AIResearch kind={kind} setValues={setValues} />
          <AIAssistant kind={kind} values={values} setValues={setValues} />
          {values.status === "published" && values.slug && (
            <a href={`${meta.route}/${values.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button></a>
          )}
        </div>
      </div>

      <h1 className="font-serif text-3xl font-bold mb-1">{isNew ? `Nuevo ${meta.label}` : "Editar"}</h1>
      {values.used_ai && <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Contenido con apoyo de AI</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 mt-4">
        {schema.map((f) => (
          <div key={f.name} className={f.span === 2 ? "sm:col-span-2" : ""}>
            <Label className="mb-1.5 block">{f.label}{f.required && <span className="text-destructive"> *</span>}{f.seo && <span className="ml-1 text-xs text-muted-foreground">(SEO)</span>}</Label>
            {renderField(f)}
          </div>
        ))}
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block">Slug (URL)</Label>
          <Input value={values.slug || ""} onChange={(e) => upd("slug", e.target.value)} placeholder="se genera automáticamente" data-testid="field-slug" />
        </div>
        <div>
          <Label className="mb-1.5 block">Estado (workflow)</Label>
          <Select value={values.status || "draft"} onValueChange={(v) => upd("status", v)}>
            <SelectTrigger data-testid="field-status"><SelectValue /></SelectTrigger>
            <SelectContent>{WORKFLOW.map((w) => <SelectItem key={w.v} value={w.v}>{w.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Fecha de publicación</Label>
          <Input value={values.published_at || ""} onChange={(e) => upd("published_at", e.target.value)} placeholder="ISO o fecha" data-testid="field-published-at" />
        </div>
      </div>

      <div className="sticky bottom-0 mt-8 -mx-5 sm:-mx-8 border-t border-border bg-card/95 backdrop-blur px-5 sm:px-8 py-4 flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={() => save("draft")} disabled={saving} data-testid="save-draft">Guardar borrador</Button>
        <Button onClick={() => save("published")} disabled={saving} data-testid="save-publish">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar y publicar
        </Button>
      </div>
    </div>
  );
}
