import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Telescope, Loader2, Wand2, Image as ImageIcon, Check, ArrowRight, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function AIResearch({ kind, setValues }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [options, setOptions] = useState(null);
  const [busy, setBusy] = useState(null); // research | generate | image | batch
  const [batch, setBatch] = useState(null); // {done,total}
  const [imagePrompt, setImagePrompt] = useState("");
  const [generated, setGenerated] = useState(false);

  const reset = () => { setOptions(null); setGenerated(false); setImagePrompt(""); setBatch(null); };

  const doResearch = async () => {
    if (!topic.trim()) return toast.error("Escribe un tema para investigar");
    setBusy("research"); reset();
    try {
      const { data } = await api.post("/ai/research", { kind, topic, instructions });
      setOptions(data.options || []);
      if (!data.options?.length) toast.info("No se obtuvieron opciones, intenta reformular el tema");
    } catch (e) { toast.error(e.response?.data?.detail || "Error al investigar"); }
    finally { setBusy(null); }
  };

  const applyOption = async (opt) => {
    setBusy("generate");
    try {
      const { data } = await api.post("/ai/generate-post", { kind, topic, selection: opt, instructions });
      const f = { ...data.fields };
      const ip = f.image_prompt; delete f.image_prompt;
      setImagePrompt(ip || opt.title || topic);
      setValues((v) => ({ ...v, ...f, used_ai: true }));
      setGenerated(true);
      toast.success("Borrador generado. Revísalo antes de publicar.");
    } catch (e) { toast.error(e.response?.data?.detail || "Error al generar"); }
    finally { setBusy(null); }
  };

  const genImage = async () => {
    setBusy("image");
    try {
      const { data } = await api.post("/ai/image", { prompt: imagePrompt || topic });
      setValues((v) => ({ ...v, featured_image: data.url }));
      toast.success("Imagen generada y aplicada");
    } catch (e) { toast.error(e.response?.data?.detail || "Error al generar imagen"); }
    finally { setBusy(null); }
  };

  const createAll = async () => {
    if (!options?.length) return;
    setBusy("batch");
    let created = 0;
    for (let i = 0; i < options.length; i++) {
      setBatch({ done: i, total: options.length });
      try {
        const { data } = await api.post("/ai/generate-post", { kind, topic, selection: options[i], instructions });
        const f = { ...data.fields };
        delete f.image_prompt;
        await api.post(`/admin/${kind}`, f);
        created++;
      } catch (e) { /* continúa con las demás */ }
    }
    setBusy(null); setBatch(null);
    if (created) {
      const failed = options.length - created;
      toast.success(`${created} borrador(es) creado(s)${failed ? `, ${failed} falló(aron)` : ""}. Revísalos y agrega imágenes antes de publicar.`);
      setOpen(false);
      navigate(`/admin/${kind}`);
    } else {
      toast.error("No se pudo crear ningún borrador");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { reset(); } }}>
      <DialogTrigger asChild>
        <Button type="button" className="bg-terracotta hover:bg-terracotta/90 text-white" data-testid="ai-research-btn">
          <Telescope className="mr-2 h-4 w-4" /> Investigar con AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="ai-research-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif"><Telescope className="h-5 w-5 text-terracotta" /> Investigar y crear con AI</DialogTitle>
          <DialogDescription>La AI propone opciones sobre tu tema; eliges una y se arma el borrador. No inventa datos: verifica y agrega fuentes oficiales antes de publicar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Tema a investigar</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1"
              placeholder="Ej: ayuda para pagar la calefacción, Silver Falls, licencia de conducir..." data-testid="research-topic" />
          </div>
          <Input value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instrucciones opcionales (enfoque, ciudad, tono...)" data-testid="research-instructions" />
          <Button type="button" onClick={doResearch} disabled={busy === "research"} data-testid="research-run">
            {busy === "research" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Telescope className="mr-2 h-4 w-4" />}
            Investigar opciones
          </Button>

          {options && (
            <div className="space-y-3 pt-2" data-testid="research-options">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">Elige una opción o crea borradores de todas:</p>
                <Button type="button" size="sm" variant="secondary" disabled={!!busy || !options.length} onClick={createAll} data-testid="research-create-all">
                  {busy === "batch"
                    ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creando {batch ? `${batch.done + 1}/${batch.total}` : ""}...</>
                    : <><Layers className="mr-1.5 h-4 w-4" /> Crear borradores de todas ({options.length})</>}
                </Button>
              </div>
              {options.map((opt, i) => (
                <div key={i} className="rounded-lg border border-border p-4" data-testid={`research-option-${i}`}>
                  <h4 className="font-serif font-bold">{opt.title}</h4>
                  {opt.angle && <p className="text-xs font-semibold uppercase tracking-wider text-terracotta mt-1">{opt.angle}</p>}
                  {opt.summary && <p className="text-sm text-muted-foreground mt-1.5">{opt.summary}</p>}
                  <Button type="button" size="sm" className="mt-3" disabled={!!busy} onClick={() => applyOption(opt)} data-testid={`research-use-${i}`}>
                    {busy === "generate" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-1.5 h-4 w-4" />}
                    Usar esta opción
                  </Button>
                </div>
              ))}
            </div>
          )}

          {generated && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4" data-testid="research-generated">
              <p className="flex items-center gap-2 text-sm font-medium text-primary"><Check className="h-4 w-4" /> Borrador aplicado a los campos del editor.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={genImage} disabled={busy === "image"} data-testid="research-gen-image">
                  {busy === "image" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Generar imagen con AI (libre de copyright)
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cerrar y editar</Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">La imagen puede tardar hasta 1 minuto.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
