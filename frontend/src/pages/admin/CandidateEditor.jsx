import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Upload, Plus, X } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

function PhotoUpload({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    try { const { data } = await api.post("/media", fd, { headers: { "Content-Type": "multipart/form-data" } }); onChange(data.url); toast.success("Foto subida"); }
    catch { toast.error("Error al subir"); } finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-3">
      {value && <img src={mediaUrl(value)} alt="" className="h-16 w-16 rounded-full object-cover" />}
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL de foto" data-testid="candidate-photo" />
      <label><input type="file" accept="image/*" className="hidden" onChange={upload} />
        <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input px-3 text-sm cursor-pointer hover:bg-accent">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
      </label>
    </div>
  );
}

export default function CandidateEditor() {
  const { raceId, cid } = useParams();
  const isNew = cid === "new";
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [c, setC] = useState({ race_id: raceId, name: "", party: "", photo: "", position: "", district: "", bio: "", experience: "", website: "", campaign_info: "", priorities: [], socials: {}, answers: {}, sources: [], is_demo: false });

  useEffect(() => {
    api.get(`/admin/races/${raceId}`).then((r) => { setRace(r.data); setC((prev) => ({ ...prev, position: prev.position || r.data.title, district: prev.district || r.data.district })); });
    if (!isNew) api.get(`/admin/candidates/${cid}`).then((r) => setC(r.data));
  }, [raceId, cid, isNew]);

  const upd = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const setAnswer = (qid, v) => setC((p) => ({ ...p, answers: { ...p.answers, [qid]: v } }));

  const save = async () => {
    if (!c.name) return toast.error("Nombre requerido");
    try {
      if (isNew) { await api.post("/admin/candidates", c); }
      else { await api.put(`/admin/candidates/${cid}`, c); }
      toast.success("Guardado"); navigate(`/admin/races/${raceId}`);
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };

  if (!race) return <div className="text-muted-foreground">Cargando...</div>;
  const questions = race.questions || [];

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <button onClick={() => navigate(`/admin/races/${raceId}`)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" /> {race.title}</button>
      <h1 className="font-serif text-3xl font-bold">{isNew ? "Nuevo candidato" : "Editar candidato"}</h1>
      <p className="text-sm text-muted-foreground">Todos los candidatos usan exactamente el mismo formato. Información neutral.</p>

      <div className="mt-6 space-y-4">
        <div><Label className="mb-1.5 block">Foto</Label><PhotoUpload value={c.photo} onChange={(v) => upd("photo", v)} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="mb-1.5 block">Nombre *</Label><Input value={c.name} onChange={(e) => upd("name", e.target.value)} data-testid="candidate-name" /></div>
          <div><Label className="mb-1.5 block">Partido</Label><Input value={c.party} onChange={(e) => upd("party", e.target.value)} data-testid="candidate-party" /></div>
          <div><Label className="mb-1.5 block">Cargo</Label><Input value={c.position} onChange={(e) => upd("position", e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Distrito</Label><Input value={c.district} onChange={(e) => upd("district", e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Website</Label><Input value={c.website} onChange={(e) => upd("website", e.target.value)} /></div>
          <div><Label className="mb-1.5 block">Twitter/Redes</Label><Input value={c.socials?.twitter || ""} onChange={(e) => upd("socials", { ...c.socials, twitter: e.target.value })} /></div>
        </div>
        <div><Label className="mb-1.5 block">Biografía</Label><Textarea rows={4} value={c.bio} onChange={(e) => upd("bio", e.target.value)} /></div>
        <div><Label className="mb-1.5 block">Experiencia</Label><Textarea rows={3} value={c.experience} onChange={(e) => upd("experience", e.target.value)} /></div>
        <div><Label className="mb-1.5 block">Información de campaña</Label><Textarea rows={3} value={c.campaign_info} onChange={(e) => upd("campaign_info", e.target.value)} /></div>

        <div>
          <Label className="mb-1.5 block">Prioridades</Label>
          {(c.priorities || []).map((p, i) => (
            <div key={i} className="flex gap-2 mb-2"><Input value={p} onChange={(e) => { const n = [...c.priorities]; n[i] = e.target.value; upd("priorities", n); }} /><Button variant="ghost" size="icon" onClick={() => upd("priorities", c.priorities.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button></div>
          ))}
          <Button variant="outline" size="sm" onClick={() => upd("priorities", [...(c.priorities || []), ""])}><Plus className="mr-1.5 h-4 w-4" /> Agregar prioridad</Button>
        </div>

        {questions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5" data-testid="candidate-answers-editor">
            <h2 className="font-serif text-lg font-bold mb-3">Respuestas — El Faro Pregunta</h2>
            {questions.map((q) => (
              <div key={q.id} className="mb-4">
                <Label className="mb-1.5 block text-sm">{q.text}</Label>
                <Textarea rows={2} value={c.answers?.[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} data-testid={`answer-${q.id}`} />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2"><Switch checked={!!c.is_demo} onCheckedChange={(v) => upd("is_demo", v)} data-testid="candidate-demo" /><span className="text-sm">Marcar como contenido DEMO</span></div>
      </div>

      <div className="mt-8 flex justify-end"><Button onClick={save} data-testid="save-candidate"><Save className="mr-2 h-4 w-4" /> Guardar candidato</Button></div>
    </div>
  );
}
