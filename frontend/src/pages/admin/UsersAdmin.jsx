import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const ROLES = [
  { v: "contributor", l: "Contributor" }, { v: "writer", l: "Writer" }, { v: "editor", l: "Editor" },
  { v: "admin", l: "Admin" }, { v: "super_admin", l: "Super Admin" },
];

export default function UsersAdmin() {
  const { user, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "writer" });

  const load = () => api.get("/auth/users").then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("Completa todos los campos");
    try { await api.post("/auth/users", form); toast.success("Usuario creado"); setOpen(false); setForm({ name: "", email: "", password: "", role: "writer" }); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };
  const del = async (id) => { try { await api.delete(`/auth/users/${id}`); toast.success("Eliminado"); load(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-serif text-3xl font-bold" data-testid="users-title">Usuarios y roles</h1><p className="text-muted-foreground text-sm mt-1">Gestiona el equipo editorial.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="new-user-btn"><Plus className="mr-2 h-4 w-4" /> Nuevo usuario</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-email" /></div>
              <div><Label>Contraseña</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password" /></div>
              <div><Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="user-role"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={create} data-testid="save-user">Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm" data-testid="users-table">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Nombre</th><th className="p-4">Email</th><th className="p-4">Rol</th><th className="p-4 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} data-testid={`user-row-${u.id}`}>
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-muted-foreground">{u.email}</td>
                <td className="p-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">{u.role?.replace("_", " ")}</span></td>
                <td className="p-4 text-right">
                  {can("super_admin") && u.id !== user.id && <Button variant="ghost" size="icon" onClick={() => del(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  {u.id === user.id && <span className="text-xs text-muted-foreground">Tú</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!can("super_admin") && <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldAlert className="h-4 w-4" /> Solo Super Admin puede eliminar usuarios.</p>}
    </div>
  );
}
