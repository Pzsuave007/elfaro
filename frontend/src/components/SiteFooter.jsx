import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const SECTIONS = [
  { label: "Recursos", path: "/recursos" },
  { label: "Oregon Te Informa", path: "/oregon-te-informa" },
  { label: "Conoce Oregon", path: "/conoce-oregon" },
  { label: "Historias de la comunidad", path: "/historias" },
  { label: "Elecciones 2026", path: "/elecciones" },
];

const ABOUT = [
  { label: "Acerca de nosotros", path: "/acerca" },
  { label: "Política editorial", path: "/politica-editorial" },
  { label: "Correcciones", path: "/correcciones" },
  { label: "Contacto", path: "/contacto" },
  { label: "Privacidad", path: "/privacidad" },
  { label: "Términos", path: "/terminos" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-primary text-primary-foreground" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              Información para vivir, participar y entender Oregon. En español, para nuestra comunidad.
            </p>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-primary-foreground/60 mb-4">Secciones</h4>
            <ul className="space-y-2.5">
              {SECTIONS.map((s) => (
                <li key={s.path}>
                  <Link to={s.path} className="text-sm text-primary-foreground/85 hover:text-white transition-colors">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-primary-foreground/60 mb-4">Institucional</h4>
            <ul className="space-y-2.5">
              {ABOUT.map((s) => (
                <li key={s.path}>
                  <Link to={s.path} className="text-sm text-primary-foreground/85 hover:text-white transition-colors">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-sm uppercase tracking-wider text-primary-foreground/60 mb-4">Nuestra misión</h4>
            <p className="text-sm text-primary-foreground/75 leading-relaxed">
              Plataforma informativa no partidista dedicada a ayudar a la comunidad hispanohablante de Oregon.
            </p>
            <Link to="/admin" className="inline-block mt-5 text-xs font-medium text-primary-foreground/60 hover:text-white" data-testid="footer-admin-link">
              Portal editorial →
            </Link>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row justify-between gap-3 text-xs text-primary-foreground/60">
          <span>© {new Date().getFullYear()} El Foro In Oregon. Todos los derechos reservados.</span>
          <span>Información neutral y verificable · Fuentes oficiales</span>
        </div>
      </div>
    </footer>
  );
}
