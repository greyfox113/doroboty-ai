import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import {
  Menu,
  ArrowUpRight,
  LogOut,
  X,
  BriefcaseBusiness,
  UserRound,
  Bookmark,
  FileText,
  Users,
  Building2,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { BrandMark } from "@/features/public/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { illustrations } from "@/features/public/illustrations";
import { currentPerson } from "./model";
import { usePrototype } from "./store";
const navigation: { to: { pathname: string; hash?: string }; label: string }[] = [
  { to: { pathname: "/oferty" }, label: "Oferty" },
  { to: { pathname: "/", hash: "#jak-aplikowac" }, label: "Jak aplikować" },
  { to: { pathname: "/dla-firm" }, label: "Dla firm" },
];

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="prototype-notice">
      {children}
    </div>
  );
}
export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <h1>{children}</h1>
      {action}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="prototype-panel">{children}</div>;
}
export function NotFound() {
  return (
    <section className="prototype-section">
      <h1>Nie znaleziono strony</h1>
      <p className="my-5">Ten adres nie prowadzi do dostępnej oferty lub aplikacji.</p>
      <Link className={buttonVariants()} to="/oferty">
        Wróć do ofert
      </Link>
    </section>
  );
}
const candidateNav = [
  ["/app", "Przegląd", LayoutDashboard],
  ["/app/profil", "Profil", UserRound],
  ["/app/zapisane", "Zapisane oferty", Bookmark],
  ["/app/aplikacje", "Moje aplikacje", FileText],
] as const;
const employerNav = [
  ["/app", "Przegląd", LayoutDashboard],
  ["/app/oferty", "Moje oferty", BriefcaseBusiness],
  ["/app/kandydaci", "Kandydaci", Users],
  ["/app/organizacja", "Organizacja", Building2],
] as const;
export function Shell() {
  const { state, issue, error, clearError } = usePrototype();
  const person = currentPerson(state);
  const { pathname } = useLocation();
  const workspace = pathname.startsWith("/app") && person;
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      clearError();
      main.current?.focus();
      window.scrollTo(0, 0);
      lastPath.current = pathname;
    }
  }, [pathname, clearError]);
  const nav =
    person?.role === "employer"
      ? employerNav
      : person?.role === "operator"
        ? [["/app/case", "Materiały case study", FileText] as const]
        : candidateNav;
  const content = (
    <>
      <>
        {issue && (
          <Notice>
            {issue}{" "}
            <Link className="underline" to="/app/settings">
              Ustawienia danych
            </Link>
          </Notice>
        )}
      </>
      {error && (
        <p className="prototype-error" role="alert">
          {error}
        </p>
      )}
      <div key={`${state.activePersonId}:${pathname}`}>
        <Outlet />
      </div>
    </>
  );
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Przejdź do treści
      </a>
      {workspace ? (
        <div className="app-frame">
          <div className="mobile-header">
            <Link to="/" className="brand">
              <BrandMark />
              DoRoboty.ai
            </Link>
            <Button
              aria-label={menuAt === pathname ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={menuAt === pathname}
              aria-controls="workspace-nav"
              variant="ghost"
              size="icon"
              onClick={() => setMenuAt(menuAt === pathname ? null : pathname)}
            >
              {menuAt === pathname ? <X /> : <Menu />}
            </Button>
          </div>
          <aside
            className={`sidebar ${menuAt === pathname ? "sidebar-open" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMenuAt(null);
            }}
          >
            <Link className="brand" to="/">
              <BrandMark />
              DoRoboty.ai
            </Link>
            <div className="workspace-label">
              <span className="workspace-avatar">{person.name[0]}</span>
              <div>
                <strong>{person.name}</strong>
                <span>{person.headline}</span>
              </div>
            </div>
            <nav id="workspace-nav" aria-label="Panel użytkownika">
              {nav.map(([to, label, Icon]) => (
                <NavLink
                  end={to === "/app"}
                  key={to}
                  to={to}
                  onClick={() => setMenuAt(null)}
                  className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`}
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
              <NavLink
                to="/app/settings"
                onClick={() => setMenuAt(null)}
                className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`}
              >
                <Settings className="size-4" />
                Ustawienia
              </NavLink>
              <Link className="nav-link" to="/oferty">
                Wszystkie oferty
              </Link>
              <Link className="nav-link" to="/auth/sign-in">
                Zmień osobę
              </Link>
            </nav>
          </aside>
          <div className="workspace">
            <div className="topbar">
              <span>
                {person.role === "candidate"
                  ? "Strefa kandydata"
                  : person.role === "employer"
                    ? "Strefa pracodawcy"
                    : "Case study"}
              </span>
              <Link to="/auth/sign-in">{person.name}</Link>
            </div>
            <main id="main" ref={main} tabIndex={-1} className="main-content outline-none">
              {content}
            </main>
          </div>
        </div>
      ) : (
        <>
          <header className="dr-head">
            <div className="dr-wrap dr-head-row">
              <Link className="dr-wordmark" to="/" aria-label="DoRoboty.ai — strona główna">
                DoRoboty<span>.ai</span>
              </Link>
              <nav aria-label="Główna nawigacja" className="dr-head-nav">
                <div className="dr-head-links">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end
                      className={({ isActive }) => (isActive && !item.to.hash ? "dr-current" : "")}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  {person?.role === "candidate" && (
                    <>
                      <Link to="/app/aplikacje">Aplikacje</Link>
                      <Link to="/app/profil">Profil</Link>
                    </>
                  )}
                </div>
                {person ? (
                  <div className="dr-head-actions">
                    <Link to="/app" className="ds-btn ds-btn--secondary">
                      Moje konto
                    </Link>
                    <Link
                      className="dr-head-icon"
                      to="/auth/sign-in"
                      aria-label="Zmień osobę"
                      title="Zmień osobę"
                    >
                      <LogOut aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="dr-head-actions">
                    <Link className="dr-head-login" to="/auth/sign-in?audience=candidate">
                      Zaloguj się
                    </Link>
                    <Link className="ds-btn ds-btn--secondary dr-head-cta" to="/dla-firm">
                      Dodaj ogłoszenie
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </header>
          <main id="main" ref={main} tabIndex={-1} className="outline-none">
            {content}
          </main>
          <img className="dr-foot-wave" src={illustrations.ribbon} alt="" />
          <footer className="dr-foot">
            <div className="dr-wrap">
              <nav aria-label="Stopka" className="dr-foot-links">
                <Link to="/oferty">Oferty</Link>
                <Link to="/dla-firm">Dla firm</Link>
                <Link to="/metodologia">Metodologia</Link>
                <Link to="/regulamin">Regulamin</Link>
                <Link to="/polityka-prywatnosci">Prywatność</Link>
                <a
                  href="https://github.com/greyfox113/doroboty-ai/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  Zgłoś problem <ArrowUpRight className="inline size-4" aria-hidden="true" />
                </a>
                <Link to="/auth/sign-in">Strefa case</Link>
              </nav>
              <p>
                <b>DoRoboty.ai</b> · praca dla specjalistów i specjalistek AI
              </p>
              <p className="ds-meta">
                Prototyp kursowy. Firmy, oferty, osoby i adresy są fikcyjne. ©{" "}
                {new Date().getFullYear()} DoRoboty.ai — od Superhero.tech
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
