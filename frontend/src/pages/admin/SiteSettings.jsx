import { useEffect, useState } from "react";
import { Save, Loader2, Upload, Sparkles, Image as ImageIcon, Check, Search, Monitor, Smartphone, Palette } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { PALETTES, applyPalette, DEFAULT_PALETTE } from "@/lib/palettes";

function HeroImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("Wide scenic landscape of Oregon, evergreen forests and mountains, soft natural light");

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
    } catch { toast.error("Error al subir"); }
    finally { setBusy(false); }
  };

  const genImage = async () => {
    setAiBusy(true);
    try {
      const { data } = await api.post("/ai/image", { prompt: aiPrompt });
      onChange(data.url);
      toast.success("Imagen generada y aplicada");
    } catch (e) { toast.error(e.response?.data?.detail || "Error al generar imagen"); }
    finally { setAiBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL de imagen o sube un archivo" data-testid="settings-hero-image" />
        <label className="shrink-0">
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
          <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input px-3 text-sm cursor-pointer hover:bg-accent" data-testid="settings-hero-upload">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir
          </span>
        </label>
      </div>
      <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Generar imagen de fondo con AI (libre de copyright)</p>
        <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe la imagen (en inglés funciona mejor)" data-testid="settings-hero-ai-prompt" />
        <Button type="button" variant="outline" onClick={genImage} disabled={aiBusy} data-testid="settings-hero-gen-image">
          {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
          Generar imagen con AI
        </Button>
        <p className="text-[11px] text-muted-foreground">Puede tardar hasta 1 minuto.</p>
      </div>
    </div>
  );
}

function HeroTextAI({ apply }) {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [options, setOptions] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setOptions(null);
    try {
      const { data } = await api.post("/ai/hero-text", { instructions });
      setOptions(data.options || []);
      if (!data.options?.length) toast.info("No se obtuvieron opciones, intenta de nuevo");
    } catch (e) { toast.error(e.response?.data?.detail || "Error al generar textos"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="border-primary/40 text-primary" data-testid="settings-hero-text-ai-btn">
          <Sparkles className="mr-2 h-4 w-4" /> Generar textos con AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="settings-hero-text-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif"><Sparkles className="h-5 w-5 text-primary" /> Textos de portada con AI</DialogTitle>
          <DialogDescription>La AI propone versiones del texto pequeño, título y subtítulo. Elige una y se aplica a los campos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instrucciones opcionales (tono, enfoque, temporada...)" data-testid="settings-hero-text-instructions" />
          <Button type="button" onClick={run} disabled={busy} data-testid="settings-hero-text-run">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Proponer opciones
          </Button>
          {options && (
            <div className="space-y-3 pt-1" data-testid="settings-hero-text-options">
              {options.map((opt, i) => (
                <div key={i} className="rounded-lg border border-border p-4" data-testid={`hero-text-option-${i}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">{opt.eyebrow}</p>
                  <h4 className="font-serif text-lg font-bold leading-snug mt-1">{opt.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{opt.subtitle}</p>
                  <Button type="button" size="sm" className="mt-3" onClick={() => { apply(opt); setOpen(false); toast.success("Textos aplicados"); }} data-testid={`hero-text-use-${i}`}>
                    <Check className="mr-1.5 h-4 w-4" /> Usar estos textos
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SiteSettings() {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState("desktop");

  useEffect(() => { api.get("/site-settings").then((r) => setValues(r.data)); }, []);

  const upd = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  const pickPalette = (key) => {
    upd("palette", key);
    applyPalette(key); // vista previa en vivo
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/admin/site-settings", values);
      setValues(data);
      applyPalette(data.palette || DEFAULT_PALETTE);
      toast.success("Configuración guardada. El sitio ya está actualizado.");
    } catch (e) { toast.error(e.response?.data?.detail || "Error al guardar"); }
    finally { setSaving(false); }
  };

  if (!values) return <div className="text-muted-foreground">Cargando...</div>;

  const isMobile = device === "mobile";

  return (
    <div className="max-w-4xl mx-auto" data-testid="site-settings-page">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <h1 className="font-serif text-3xl font-bold">Configuración del sitio</h1>
        <HeroTextAI apply={(opt) => setValues((v) => ({ ...v, hero_eyebrow: opt.eyebrow ?? v.hero_eyebrow, hero_title: opt.title ?? v.hero_title, hero_subtitle: opt.subtitle ?? v.hero_subtitle }))} />
      </div>
      <p className="text-muted-foreground mb-6">Edita la portada, los colores del sitio y los textos de las secciones. Los cambios se reflejan de inmediato al guardar.</p>

      {/* PALETA DE COLORES */}
      <div className="mb-8" data-testid="palette-section">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl font-bold">Paleta de colores</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Elige un esquema. La vista previa se aplica al instante; guarda para hacerlo permanente.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(PALETTES).map(([key, p]) => {
            const active = (values.palette || DEFAULT_PALETTE) === key;
            return (
              <button key={key} type="button" onClick={() => pickPalette(key)} data-testid={`palette-${key}`}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${active ? "border-primary ring-2 ring-primary/30 bg-accent/50" : "border-border hover:border-primary/50"}`}>
                <span className="flex -space-x-1.5 shrink-0">
                  <span className="h-7 w-7 rounded-full border-2 border-card" style={{ background: p.swatch[0] }} />
                  <span className="h-7 w-7 rounded-full border-2 border-card" style={{ background: p.swatch[1] }} />
                </span>
                <span className="text-sm font-medium">{p.label}</span>
                {active && <Check className="ml-auto h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h2 className="font-serif text-xl font-bold">Portada (hero)</h2>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <button type="button" onClick={() => setDevice("desktop")} data-testid="preview-desktop"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${!isMobile ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Monitor className="h-4 w-4" /> Escritorio
          </button>
          <button type="button" onClick={() => setDevice("mobile")} data-testid="preview-mobile"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${isMobile ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Smartphone className="h-4 w-4" /> Móvil
          </button>
        </div>
      </div>
      <div className={isMobile ? "flex justify-center mb-8" : "mb-8"}>
        <div className={`relative overflow-hidden rounded-xl bg-primary text-primary-foreground ${isMobile ? "w-[360px] border-4 border-foreground/10" : "w-full"}`} data-testid="hero-preview">
          <div className="absolute inset-0 opacity-20">
            {values.hero_image && <img src={mediaUrl(values.hero_image)} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className={`relative ${isMobile ? "p-5" : "p-8 sm:p-10"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70 mb-3">{values.hero_eyebrow}</p>
            <h2 className={`font-serif font-bold leading-tight max-w-2xl ${isMobile ? "text-xl" : "text-2xl sm:text-3xl"}`}>{values.hero_title}</h2>
            <p className="mt-3 text-primary-foreground/80 max-w-xl text-sm">{values.hero_subtitle}</p>
            <div className={`mt-5 gap-2 max-w-md ${isMobile ? "flex flex-col" : "flex items-center"}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <div className="h-11 rounded-lg bg-white pl-10 flex items-center text-sm text-muted-foreground">{values.hero_search_label}</div>
              </div>
              <span className="h-11 px-5 rounded-lg bg-terracotta text-white text-sm font-medium grid place-items-center">Buscar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="mb-1.5 block">Texto pequeño superior (eyebrow)</Label>
          <Input value={values.hero_eyebrow || ""} onChange={(e) => upd("hero_eyebrow", e.target.value)} data-testid="field-hero-eyebrow" />
        </div>
        <div>
          <Label className="mb-1.5 block">Título principal</Label>
          <Textarea rows={2} value={values.hero_title || ""} onChange={(e) => upd("hero_title", e.target.value)} data-testid="field-hero-title" />
        </div>
        <div>
          <Label className="mb-1.5 block">Subtítulo</Label>
          <Textarea rows={2} value={values.hero_subtitle || ""} onChange={(e) => upd("hero_subtitle", e.target.value)} data-testid="field-hero-subtitle" />
        </div>
        <div>
          <Label className="mb-1.5 block">Etiqueta del buscador</Label>
          <Input value={values.hero_search_label || ""} onChange={(e) => upd("hero_search_label", e.target.value)} data-testid="field-hero-search-label" />
        </div>
        <div>
          <Label className="mb-1.5 block">Imagen de fondo del hero</Label>
          <HeroImageField value={values.hero_image} onChange={(v) => upd("hero_image", v)} />
        </div>
      </div>

      {/* TEXTOS DE SECCIONES */}
      <div className="mt-10 pt-8 border-t border-border" data-testid="sections-texts">
        <h2 className="font-serif text-xl font-bold mb-1">Textos de las secciones</h2>
        <p className="text-sm text-muted-foreground mb-5">Personaliza los títulos de las secciones de la página de inicio.</p>
        <div className="space-y-5">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Recursos para la comunidad</p>
            <div>
              <Label className="mb-1.5 block">Título</Label>
              <Input value={values.recursos_title || ""} onChange={(e) => upd("recursos_title", e.target.value)} data-testid="field-recursos-title" />
            </div>
            <div>
              <Label className="mb-1.5 block">Descripción</Label>
              <Textarea rows={2} value={values.recursos_description || ""} onChange={(e) => upd("recursos_description", e.target.value)} data-testid="field-recursos-description" />
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Oregon Te Informa</p>
            <div>
              <Label className="mb-1.5 block">Título</Label>
              <Input value={values.oregon_title || ""} onChange={(e) => upd("oregon_title", e.target.value)} data-testid="field-oregon-title" />
            </div>
            <div>
              <Label className="mb-1.5 block">Descripción</Label>
              <Textarea rows={2} value={values.oregon_description || ""} onChange={(e) => upd("oregon_description", e.target.value)} data-testid="field-oregon-description" />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-8 -mx-5 sm:-mx-8 border-t border-border bg-card/95 backdrop-blur px-5 sm:px-8 py-4 flex justify-end">
        <Button onClick={save} disabled={saving} data-testid="settings-save">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar cambios
        </Button>
      </div>
    </div>
  );
}
