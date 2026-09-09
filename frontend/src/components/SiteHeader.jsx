import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  { label: "Inicio", path: "/" },
  { label: "Recursos", path: "/recursos" },
  { label: "Oregon Te Informa", path: "/oregon-te-informa" },
  { label: "Conoce Oregon", path: "/conoce-oregon" },
  { label: "Historias", path: "/historias" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("foro_theme") === "dark");
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("foro_theme", dark ? "dark" : "light");
  }, [dark]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/buscar?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md" data-testid="site-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                data-testid={`nav-${item.path === "/" ? "inicio" : item.path.slice(1)}`}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive ? "text-primary bg-accent" : "text-foreground/70 hover:text-primary hover:bg-accent/60"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Buscar" data-testid="header-search-toggle"
              onClick={() => setSearchOpen((s) => !s)}>
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cambiar tema" data-testid="theme-toggle"
              onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menú" data-testid="mobile-menu-toggle"
              onClick={() => setOpen((o) => !o)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="pb-4 fade-up" data-testid="header-search-form">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="¿Qué información estás buscando?"
                className="pl-10 h-11"
                data-testid="header-search-input"
              />
            </div>
          </form>
        )}
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background px-4 py-3 space-y-1" data-testid="mobile-nav">
          {NAV.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-3 rounded-md text-base font-medium ${isActive ? "text-primary bg-accent" : "text-foreground/80"}`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
