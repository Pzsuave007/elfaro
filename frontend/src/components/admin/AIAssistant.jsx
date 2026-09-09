import { useState, useRef } from "react";
import { Sparkles, Loader2, Check, Copy, Wand2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { KIND_META } from "@/pages/admin/schemas";

const TEXT_ACTIONS = [
  { id: "draft", label: "Crear borrador" },
  { id: "expand", label: "Expandir" },
  { id: "summarize", label: "Resumir" },
  { id: "rewrite", label: "Reescribir" },
  { id: "simplify", label: "Lenguaje sencillo" },
  { id: "grammar", label: "Corregir gramática" },
  { id: "headline", label: "Titular" },
  { id: "subheadline", label: "Subtítulo" },
  { id: "excerpt", label: "Extracto" },
  { id: "meta_description", label: "Meta description" },
  { id: "seo_title", label: "SEO title" },
  { id: "social_caption", label: "Texto para redes" },
  { id: "short_version", label: "Versión corta" },
  { id: "translate", label: "Traducir (inglés)" },
];

export function AIAssistant({ kind, values, setValues }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [instructions, setInstructions] = useState("");
  const [result, setResult] = useState("");
  const [structured, setStructured] = useState(null);
  const [busy, setBusy] = useState(null);
  const lastAction = useRef(null);
  const meta = KIND_META[kind];

  const run = async (action) => {
    const content = input || values[meta.aiTarget] || values.body || values.summary || "";
    setBusy(action); setResult(""); setStructured(null);
    try {
      const { data } = await api.post("/ai/assist", { action, content, instructions });
      if (data.structured) setStructured({ action, data: data.result });
      else setResult(data.result);
      // AI content must remain a draft
      setValues((v) => ({ ...v, used_ai: true, status: v.status === "published" ? "needs_review" : v.status }));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error del asistente AI");
    } finally {
      setBusy(null);
    }
  };

  const applyText = () => {
    const map = { headline: "title", subheadline: "subtitle", meta_description: "seo_description", seo_title: "seo_title", excerpt: "summary", summarize: "summary" };
    const field = map[lastAction.current] || meta.aiTarget;
    setValues((v) => ({ ...v, [field]: result, used_ai: true }));
    toast.success(`Aplicado a "${field}"`);
  };

  const applyStructured = () => {
    const { action, data } = structured;
    if (action === "explain_law") {
      setValues((v) => ({ ...v, que_cambio: data.que_cambio || v.que_cambio, a_quien_afecta: data.a_quien_afecta || v.a_quien_afecta, cuando_entra_en_vigor: data.cuando_entra_en_vigor || v.cuando_entra_en_vigor, que_necesitas_hacer: data.que_necesitas_hacer || v.que_necesitas_hacer, summary: data.resumen || v.summary, used_ai: true }));
    } else if (action === "extract_resource") {
      setValues((v) => ({ ...v, ...Object.fromEntries(Object.entries(data).filter(([, val]) => val)), used_ai: true }));
    } else if (action === "tags") {
      setValues((v) => ({ ...v, tags: data.tags || v.tags, used_ai: true }));
    } else if (action === "generate_questions") {
      toast.info("Preguntas generadas. Cópialas a la carrera electoral.");
    }
    toast.success("Contenido aplicado a los campos.");
  };

  const doRun = (a) => { lastAction.current = a; run(a); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="border-primary/40 text-primary" data-testid="ai-assistant-btn">
          <Sparkles className="mr-2 h-4 w-4" /> Asistente AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="ai-assistant-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif"><Wand2 className="h-5 w-5 text-primary" /> Asistente AI editorial</DialogTitle>
          <DialogDescription>Plataforma no partidista. La AI nunca inventa datos ni recomienda candidatos. Todo contenido AI queda como borrador para revisión humana.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4}
            placeholder={`Pega notas o texto base aquí (o se usará el campo "${meta.aiTarget}")...`} data-testid="ai-input" />
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={instructions}
            onChange={(e) => setInstructions(e.target.value)} placeholder="Instrucciones adicionales (opcional)" data-testid="ai-instructions" />

          <div className="flex flex-wrap gap-2">
            {TEXT_ACTIONS.map((a) => (
              <Button key={a.id} type="button" size="sm" variant="secondary" disabled={!!busy}
                onClick={() => doRun(a.id)} data-testid={`ai-action-${a.id}`}>
                {busy === a.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}{a.label}
              </Button>
            ))}
            <Button type="button" size="sm" variant="secondary" disabled={!!busy} onClick={() => doRun("tags")} data-testid="ai-action-tags">Sugerir tags</Button>
            {kind === "oregon-info" && <Button type="button" size="sm" className="bg-info text-white" disabled={!!busy} onClick={() => doRun("explain_law")} data-testid="ai-action-explain-law">Explicar ley en lenguaje sencillo</Button>}
            {kind === "resources" && <Button type="button" size="sm" className="bg-info text-white" disabled={!!busy} onClick={() => doRun("extract_resource")} data-testid="ai-action-extract">Extraer info del recurso</Button>}
          </div>

          {result && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4" data-testid="ai-result">
              <p className="whitespace-pre-line text-sm">{result}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" onClick={applyText} data-testid="ai-apply"><Check className="mr-1.5 h-4 w-4" /> Aplicar</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copiado"); }}><Copy className="mr-1.5 h-4 w-4" /> Copiar</Button>
              </div>
            </div>
          )}

          {structured && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4" data-testid="ai-result-structured">
              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(structured.data, null, 2)}</pre>
              <Button type="button" size="sm" className="mt-3" onClick={applyStructured} data-testid="ai-apply-structured"><Check className="mr-1.5 h-4 w-4" /> Aplicar a los campos</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
