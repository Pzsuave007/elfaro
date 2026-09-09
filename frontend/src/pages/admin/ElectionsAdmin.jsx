import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Vote, Users, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function ElectionsAdmin() {
  const [elections, setElections] = useState([]);
  const [races, setRaces] = useState([]);
  const [raceTypes, setRaceTypes] = useState([]);
  const [elForm, setElForm] = useState({ name: "", year: 2026, date: "", description: "", status: "active" });
  const [raceForm, setRaceForm] = useState({ election_id: "", title: "", race_type: "", district: "", description: "" });
  const [elOpen, setElOpen] = useState(false);
  const [raceOpen, setRaceOpen] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    api.get("/admin/elections").then((r) => setElections(r.data));
    api.get("/admin/races").then((r) => setRaces(r.data));
  };
  useEffect(() => { load(); api.get("/config/races").then((r) => setRaceTypes(r.data.race_types)); }, []);

  const createElection = async () => {
    if (!elForm.name) return toast.error("Nombre requerido");
    await api.post("/admin/elections", elForm); toast.success("Elección creada"); setElOpen(false);
    setElForm({ name: "", year: 2026, date: "", description: "", status: "active" }); load();
  };
  const createRace = async () => {
    if (!raceForm.title || !raceForm.election_id) return toast.error("Título y elección requeridos");
    await api.post("/admin/races", raceForm); toast.success("Carrera creada"); setRaceOpen(false);
    setRaceForm({ election_id: "", title: "", race_type: "", district: "", description: "" }); load();
  };
  const delRace = async (id) => { await api.delete(`/admin/races/${id}`); toast.success("Eliminada"); load(); };
  const delElection = async (id) => { await api.delete(`/admin/elections/${id}`); toast.success("Eliminada"); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold" data-testid="elections-admin-title">Elecciones</h1>
        <div className="flex gap-2">
          <Dialog open={elOpen} onOpenChange={setElOpen}>
            <DialogTrigger asChild><Button variant="outline" data-testid="new-election-btn"><Plus className="mr-2 h-4 w-4" /> Elección</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva elección</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre</Label><Input value={elForm.name} onChange={(e) => setElForm({ ...elForm, name: e.target.value })} data-testid="election-name" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Año</Label><Input type="number" value={elForm.year} onChange={(e) => setElForm({ ...elForm, year: Number(e.target.value) })} /></div>
                  <div><Label>Fecha</Label><Input value={elForm.date} onChange={(e) => setElForm({ ...elForm, date: e.target.value })} placeholder="2026-11-03" /></div>
                </div>
                <div><Label>Descripción</Label><Textarea value={elForm.description} onChange={(e) => setElForm({ ...elForm, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={createElection} data-testid="save-election">Crear</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={raceOpen} onOpenChange={setRaceOpen}>
            <DialogTrigger asChild><Button data-testid="new-race-btn"><Plus className="mr-2 h-4 w-4" /> Carrera</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva carrera electoral</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Elección</Label>
                  <Select value={raceForm.election_id} onValueChange={(v) => setRaceForm({ ...raceForm, election_id: v })}>
                    <SelectTrigger data-testid="race-election"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>{elections.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Título</Label><Input value={raceForm.title} onChange={(e) => setRaceForm({ ...raceForm, title: e.target.value })} data-testid="race-title" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label>
                    <Select value={raceForm.race_type} onValueChange={(v) => setRaceForm({ ...raceForm, race_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>{raceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Distrito</Label><Input value={raceForm.district} onChange={(e) => setRaceForm({ ...raceForm, district: e.target.value })} /></div>
                </div>
                <div><Label>Descripción</Label><Textarea value={raceForm.description} onChange={(e) => setRaceForm({ ...raceForm, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={createRace} data-testid="save-race">Crear</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {elections.length === 0 && <p className="text-muted-foreground">No hay elecciones. Crea la primera.</p>}
      {elections.map((el) => (
        <div key={el.id} className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2"><Vote className="h-5 w-5 text-primary" /> {el.name} <span className="text-sm font-normal text-muted-foreground">({el.date})</span></h2>
            <Button variant="ghost" size="icon" onClick={() => delElection(el.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {races.filter((r) => r.election_id === el.id).map((race) => (
              <div key={race.id} className="flex items-center justify-between rounded-lg border border-border p-4" data-testid={`admin-race-${race.id}`}>
                <div>
                  <p className="font-medium">{race.title}</p>
                  <p className="text-xs text-muted-foreground">{race.race_type} · <Users className="inline h-3 w-3" /> {race.candidate_count} candidatos · {(race.questions || []).length} preguntas</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/races/${race.id}`)} data-testid={`edit-race-${race.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => delRace(race.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {races.filter((r) => r.election_id === el.id).length === 0 && <p className="text-sm text-muted-foreground">Sin carreras todavía.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
