import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  CalendarIcon,
  ReaderIcon,
  PersonIcon,
  BellIcon,
  ExitIcon,
  ArrowTopRightIcon,
  CardStackIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/stores/authStore";
import "@/components/member/member.css";

const navigation = [
  { path: "", label: "Mi inicio", short: "Inicio", icon: HomeIcon },
  {
    path: "/book",
    label: "Reservar clase",
    short: "Reservar",
    icon: CalendarIcon,
  },
  {
    path: "/classes",
    label: "Mis sesiones",
    short: "Sesiones",
    icon: ReaderIcon,
  },
  {
    path: "/profile/membership",
    label: "Mi membresía",
    short: "Membresía",
    icon: CardStackIcon,
  },
  { path: "/events", label: "Comunidad", short: "Comunidad", icon: RocketIcon },
  { path: "/profile", label: "Mi perfil", short: "Perfil", icon: PersonIcon },
];
export function ClientLayout({
  children,
  displayName,
}: {
  children: ReactNode;
  displayName?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const preview = pathname.startsWith("/app/preview");
  const base = preview ? "/app/preview" : "/app";
  const relative = pathname.slice(base.length);
  const name =
    displayName ||
    (preview ? "Atleta Altitud" : user?.display_name) ||
    "Atleta";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  const active = (path: string) =>
    path === ""
      ? !relative
      : path === "/profile"
        ? relative === path ||
          relative === "/profile/edit" ||
          relative === "/profile/preferences"
        : relative.startsWith(path);
  const current =
    navigation.find((n) => active(n.path))?.label ||
    (relative.includes("orders")
      ? "Mis compras"
      : relative.includes("notifications")
        ? "Notificaciones"
        : "Mi espacio");
  return (
    <div className="member-shell">
      <a href="#member-content" className="member-skip">
        Ir al contenido
      </a>
      <aside className="member-sidebar">
        <Link
          to={base}
          className="member-sidebar-logo"
          aria-label="2707 Altitud — Mi inicio"
        >
          <img src="/brand/logo-light.svg" alt="2707 Altitud" />
        </Link>
        <div className="member-sidebar-label">TU ESPACIO DE EVOLUCIÓN</div>
        <nav aria-label="Menú de usuario">
          {navigation.map((n) => (
            <Link
              to={base + n.path}
              key={n.path}
              aria-current={active(n.path) ? "page" : undefined}
            >
              <n.icon />
              <span>{n.label}</span>
              {active(n.path) && <span className="member-nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="member-side-bottom">
          <div className="member-altitude">
            <span>2707</span>
            <div>
              METROS DE ALTITUD.
              <br />
              INFINITAS POSIBILIDADES.
            </div>
          </div>
          <Link to="/">
            Conoce el studio <ArrowTopRightIcon />
          </Link>
          <button
            onClick={() => {
              if (!preview) logout();
              navigate(preview ? "/" : "/login");
            }}
          >
            <ExitIcon />
            {preview ? "Salir de la vista previa" : "Cerrar sesión"}
          </button>
        </div>
      </aside>
      <div className="member-workspace">
        <header className="member-topbar">
          <Link to={base} className="member-mobile-brand">
            <img src="/brand/logo-horizontal.svg" alt="2707 Altitud" />
          </Link>
          <div className="member-breadcrumb">
            MI ALTITUD <span>/</span> <strong>{current}</strong>
          </div>
          <div className="member-top-actions">
            <span className="member-today">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <Link
              to={base + "/notifications"}
              aria-label="Notificaciones"
              className="member-icon-button"
            >
              <BellIcon />
            </Link>
            <Link
              to={base + "/profile"}
              className="member-account"
              aria-label="Mi perfil"
            >
              <span className="member-avatar">
                {!preview && user?.photo_url ? (
                  <img src={user.photo_url} alt="" />
                ) : (
                  initials
                )}
              </span>
              <span>{name.split(" ")[0]}</span>
            </Link>
          </div>
        </header>
        {preview && (
          <div className="member-preview">
            <span>VISTA PREVIA</span> Datos de ejemplo. Tus cambios se guardan
            solo en este navegador.
            <Link to="/">
              Ver sitio <ArrowTopRightIcon />
            </Link>
          </div>
        )}
        <main id="member-content" className="member-content">
          {children}
        </main>
        <footer className="member-page-footer">
          <span>2707 ALTITUD · PERFORMANCE LIFESTYLE</span>
          <Link to="/privacy">Privacidad</Link>
        </footer>
      </div>
      <nav
        className="member-bottom-nav"
        aria-label="Navegación móvil de usuario"
      >
        {navigation
          .filter((n) => n.path !== "/events")
          .map((n) => (
            <Link
              key={n.path}
              to={base + n.path}
              aria-current={active(n.path) ? "page" : undefined}
            >
              <n.icon />
              <span>{n.short}</span>
            </Link>
          ))}
      </nav>
    </div>
  );
}
