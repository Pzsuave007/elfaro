import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Pencil, Trash2, Vote } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function ElectionsAdmin() {
  const [election, setElection] = useState(null);
  const [races, setRaces] = useState([]);
  const [raceTypes, setRaceTypes] = useState([]);
  const [raceForm, setRaceForm] = useState({ title: "", race_type: "", district: "" });
  const [raceOpen, setRaceOpen] = useState(false);
  const ensuredRef = useRef(false);
  const navigate = useNavigate();

  const load = async () => {
    const [e, r] = await Promise.all([api.get("/admin/elections"), api.get("/admin/races")]);
    let els = e.data || [];
    if (els.length === 0 && !ensuredRef.current) {
      ensuredRef.current = true;
      await api.post("/admin/elections", { name: "Elecciones 2026", year: 2026, date: "2026-11-03", status: "active" });
      return load();
    }
    const def = els[0] || null;
    setElection(def);
    setRaces((r.data || []).filter((x) => !def || x.election_id === def.id));
  };

  useEffect(() => {
    load();
    api.get("/config/races").then((r) => setRaceTypes(r.data.race_types || []));
  }, []);

  const createRace = async () => {
    if (!raceForm.title.trim()) return toast.error("Escribe el cargo (ej. Gobernador)");
    if (!election) return toast.error("Cargando elección, intenta de nuevo");
    await api.post("/admin/races", { ...raceForm, election_id: election.id });
    toast.success("Cargo creado");
    setRaceOpen(false);
    setRaceForm({ title: "", race_type: "", district: "" });
    load();
  };
  const delRace = async (id) => {
    if (!window.confirm("¿Eliminar este cargo y sus candidatos?")) return;
    await api.delete(`/admin/races/${id}`);
    toast.success("Eliminado");
    load();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-2" data-testid="elections-admin-title">
            <Vote className="h-7 w-7 text-primary" /> {election?.name || "Elecciones"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Agrega los cargos en disputa y sus candidatos. La información se llena fácil con AI.</p>
        </div>
        <Dialog open={raceOpen} onOpenChange={setRaceOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-race-btn" className="shrink-0"><Plus className="mr-2 h-4 w-4" /> Agregar cargo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cargo en disputa</DialogTitle>
              <DialogDescription>Ejemplos: Gobernador de Oregon, Alcalde de Salem, Senado Distrito 3.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">Cargo *</Label>
                <Input value={raceForm.title} onChange={(e) => setRaceForm({ ...raceForm, title: e.target.value })}
                  placeholder="Ej. Gobernador de Oregon" data-testid="race-title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Tipo</Label>
                  <Select value={raceForm.race_type} onValueChange={(v) => setRaceForm({ ...raceForm, race_type: v })}>
                    <SelectTrigger data-testid="race-type"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>{raceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Distrito (opcional)</Label>
                  <Input value={raceForm.district} onChange={(e) => setRaceForm({ ...raceForm, district: e.target.value })} placeholder="Ej. Distrito 3" />
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={createRace} data-testid="save-race">Crear cargo</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {races.length === 0 && (
          <div className="sm:col-span-2 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground" data-testid="races-empty">
            Aún no hay cargos. Haz clic en <strong>“Agregar cargo”</strong> para empezar (ej. Gobernador).
          </div>
        )}
        {races.map((race) => (
          <div key={race.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4" data-testid={`admin-race-${race.id}`}>
            <button onClick={() => navigate(`/admin/races/${race.id}`)} className="text-left flex-1 min-w-0">
              <p className="font-medium truncate">{race.title}</p>
              <p className="text-xs text-muted-foreground">{[race.race_type, race.district].filter(Boolean).join(" · ")}{(race.race_type || race.district) ? " · " : ""}<Users className="inline h-3 w-3" /> {race.candidate_count} candidatos</p>
            </button>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/races/${race.id}`)} data-testid={`edit-race-${race.id}`}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => delRace(race.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
