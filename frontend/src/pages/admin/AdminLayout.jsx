import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { LayoutDashboard, Newspaper, LifeBuoy, ScrollText, MapPin, Vote, Image, Users, Settings, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Historias", path: "/admin/articles", icon: Newspaper },
  { label: "Recursos", path: "/admin/resources", icon: LifeBuoy },
  { label: "Oregon Te Informa", path: "/admin/oregon-info", icon: ScrollText },
  { label: "Conoce Oregon", path: "/admin/places", icon: MapPin },
  { label: "Elecciones", path: "/admin/elections", icon: Vote },
  { label: "Media Library", path: "/admin/media", icon: Image },
  { label: "Configuración del sitio", path: "/admin/settings", icon: Settings, minRole: "editor" },
  { label: "Usuarios", path: "/admin/users", icon: Users, minRole: "admin" },
];

export default function AdminLayout() {
  const { user, loading, logout, can } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Cargando...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card" data-testid="admin-sidebar">
        <div className="p-5 border-b border-border"><Logo compact /></div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.filter((n) => !n.minRole || can(n.minRole)).map((n) => (
            <NavLink key={n.path} to={n.path} end={n.end} data-testid={`admin-nav-${n.path.split("/").pop()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent"
                }`
              }>
              <n.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-accent">
            <ExternalLink className="h-4 w-4" /> Ver sitio
          </a>
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role?.replace("_", " ")}</p>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={() => { logout(); navigate("/admin/login"); }} data-testid="admin-logout">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center justify-between border-b border-border bg-card p-3">
          <Logo compact />
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/admin/login"); }}><LogOut className="h-4 w-4" /></Button>
        </div>
        <main className="flex-1 overflow-y-auto p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
