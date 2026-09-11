import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Save, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RaceEditor() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [genBusy, setGenBusy] = useState(false);
  const [genTopic, setGenTopic] = useState("");

  const load = () => api.get(`/admin/races/${raceId}`).then((r) => { setRace(r.data); setQuestions((r.data.questions || []).map((q) => q.text)); });
  useEffect(() => { load(); }, [raceId]);

  const saveQuestions = async () => {
    await api.put(`/admin/races/${raceId}/questions`, { questions: questions.filter((q) => q.trim()) });
    toast.success("Preguntas aplicadas a todos los candidatos"); load();
  };
  const generate = async () => {
    setGenBusy(true);
    try {
      const { data } = await api.post("/ai/assist", { action: "generate_questions", content: genTopic || race.title, instructions: `Carrera: ${race.title}` });
      if (data.result?.questions) setQuestions((prev) => [...prev, ...data.result.questions]);
      toast.success("Preguntas generadas (revísalas antes de guardar)");
    } catch (e) { toast.error("Error al generar"); } finally { setGenBusy(false); }
  };
  const delCandidate = async (id) => { await api.delete(`/admin/candidates/${id}`); toast.success("Eliminado"); load(); };

  if (!race) return <div className="text-muted-foreground">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate("/admin/elections")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" /> Elecciones</button>
      <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">{race.race_type}</span>
      <h1 className="font-serif text-3xl font-bold" data-testid="race-editor-title">{race.title}</h1>
      <p className="text-muted-foreground">{race.district}</p>

      {/* El Faro Pregunta */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl font-bold">El Faro Pregunta</h2>
        <p className="text-sm text-muted-foreground mb-4">Las mismas preguntas se aplican a todos los candidatos de esta carrera.</p>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input value={q} onChange={(e) => { const n = [...questions]; n[i] = e.target.value; setQuestions(n); }} data-testid={`question-${i}`} />
              <Button variant="ghost" size="icon" onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setQuestions([...questions, ""])} data-testid="add-question"><Plus className="mr-1.5 h-4 w-4" /> Agregar</Button>
          <Button size="sm" onClick={saveQuestions} data-testid="save-questions"><Save className="mr-1.5 h-4 w-4" /> Guardar preguntas</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <div className="flex-1 min-w-[200px]"><Label className="text-xs">Generar preguntas neutrales con AI (tema)</Label><Input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="vivienda, educación..." /></div>
          <Button variant="secondary" size="sm" onClick={generate} disabled={genBusy} data-testid="ai-generate-questions">
            {genBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />} Generar
          </Button>
        </div>
      </div>

      {/* Candidates */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold">Candidatos</h2>
          <Button size="sm" onClick={() => navigate(`/admin/races/${raceId}/candidate/new`)} data-testid="new-candidate-btn"><Plus className="mr-1.5 h-4 w-4" /> Candidato</Button>
        </div>
        <div className="space-y-2">
          {(race.candidates || []).length === 0 && <p className="text-sm text-muted-foreground">Sin candidatos todavía.</p>}
          {(race.candidates || []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3" data-testid={`candidate-row-${c.id}`}>
              <div className="flex items-center gap-3">
                {c.photo && <img src={mediaUrl(c.photo)} alt="" className="h-10 w-10 rounded-full object-cover" />}
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.party}</p></div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/races/${raceId}/candidate/${c.id}`)} data-testid={`edit-candidate-${c.id}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => delCandidate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
