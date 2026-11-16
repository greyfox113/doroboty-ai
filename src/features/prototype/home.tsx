import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { JobCard } from "@/features/jobs/job-card";
import { filterJobs } from "@/features/jobs/filters";
import type { JobCategory, RemoteStatus } from "@/features/jobs/types";
import { illustrationAlt, illustrations } from "@/features/public/illustrations";
import { usePrototype } from "./store";
import { currentPerson, publishedJobs } from "./model";

const categories: [JobCategory | "", string][] = [
  ["", "Wszystkie"],
  ["build", "Build"],
  ["apply", "Apply"],
  ["lead", "Lead"],
];

/** Scrolls to a `#section` carried in the hash route, after the shell's focus handling. */
export function useSectionHash() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const frame = requestAnimationFrame(() => {
      const section = document.getElementById(location.hash.slice(1));
      section?.focus({ preventScroll: true });
      section?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, location.key]);
}

export default function HomePage() {
  const { state } = usePrototype();
  const person = currentPerson(state);
  const navigate = useNavigate();
  const [category, setCategory] = useState<JobCategory | "">("");
  useSectionHash();
  const all = publishedJobs(state);
  const latest = filterJobs(all, { page: 1, category: category || undefined }).slice(0, 6);
  const savedIds =
    person?.role === "candidate"
      ? new Set(state.saved.filter((x) => x.candidateId === person.id).map((x) => x.jobId))
      : undefined;
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const query = String(data.get("query") ?? "").trim();
    const remote = String(data.get("remote") ?? "") as RemoteStatus | "";
    if (query) next.set("query", query);
    if (remote) next.set("remote", remote);
    if (category) next.set("category", category);
    navigate(next.size ? `/oferty?${next}` : "/oferty");
  }
  return (
    <>
      <section className="dr-hero" aria-labelledby="hero-h">
        <div className="dr-wrap dr-hero-grid">
          <div className="dr-hero-in">
            <p className="dr-eyebrow">Praca dla specjalistów i specjalistek AI</p>
            <h1 id="hero-h">
              <span className="dr-h1-line">Wiesz, czego szukają.</span>{" "}
              <span className="dr-h1-line">Pokazujesz, co umiesz.</span>
            </h1>
            <p className="dr-hero-lead">
              Znajdź pracę jako specjalista lub specjalistka AI. Każda oferta ma widełki i wymagania
              podzielone na konieczne i mile widziane. Przy aplikacji na każde z nich odpowiesz
              przykładem ze swojej pracy.
            </p>
            <form
              className="ds-card dr-search"
              role="search"
              aria-label="Szukaj ofert"
              onSubmit={search}
            >
              <label className="sr-only" htmlFor="home-query">
                Stanowisko, firma albo kompetencja
              </label>
              <input
                id="home-query"
                name="query"
                className="dr-input"
                type="search"
                maxLength={100}
                placeholder="Stanowisko lub kompetencja"
                autoComplete="off"
              />
              <label className="sr-only" htmlFor="home-remote">
                Tryb pracy
              </label>
              <select id="home-remote" name="remote" className="dr-input">
                <option value="">Każdy tryb</option>
                <option value="remote">Zdalnie</option>
                <option value="hybrid">Hybrydowo</option>
                <option value="onsite">Stacjonarnie</option>
              </select>
              <button className="ds-btn ds-btn--primary" type="submit">
                Szukaj ofert
              </button>
            </form>
            <div className="dr-cats" role="group" aria-label="Kategoria">
              {categories.map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  className="dr-cat"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <img
            className="dr-hero-ilu"
            src={illustrations.blockTower}
            alt={illustrationAlt.blockTower}
          />
        </div>
      </section>

      <section className="dr-wrap dr-block" aria-labelledby="latest-h">
        <div className="dr-block-head">
          <h2 id="latest-h" className="ds-title">
            Najnowsze oferty
          </h2>
          <p className="ds-meta" aria-live="polite">
            {latest.length
              ? `Pokazujemy ${latest.length} z ${filterJobs(all, { page: 1, category: category || undefined }).length}`
              : ""}
          </p>
        </div>
        <p className="ds-lead dr-cat-help">
          <b>Build</b>: budujesz rozwiązania AI · <b>Apply</b>: stosujesz AI w swojej pracy ·{" "}
          <b>Lead</b>: prowadzisz inicjatywy i zespoły AI
        </p>
        {latest.length ? (
          <div className="dr-jobs">
            {latest.map((job) => (
              <JobCard key={job.id} job={job} saved={savedIds?.has(job.id)} />
            ))}
          </div>
        ) : (
          <div className="dr-empty">
            <img src={illustrations.wave} alt="" />
            <p>
              <b>Brak ofert w tej kategorii.</b> Wybierz inną kategorię.
            </p>
            <button
              type="button"
              className="ds-btn ds-btn--secondary"
              onClick={() => setCategory("")}
            >
              Pokaż wszystkie
            </button>
          </div>
        )}
        <div className="ds-btn-group">
          <Link className="ds-btn ds-btn--secondary" to="/oferty">
            Więcej ofert
          </Link>
        </div>
      </section>

      <section id="jak-aplikowac" tabIndex={-1} className="dr-how" aria-labelledby="how-h">
        <div className="dr-wrap dr-how-grid">
          <div>
            <p className="ds-label">Jak aplikować</p>
            <h2 id="how-h" className="ds-title dr-big">
              Trzy kroki. Jeden z nich mówi o Tobie więcej niż CV.
            </h2>
            <ol className="dr-steps">
              <li>
                <b>Dane i CV.</b> Profil, CV i odpowiedź na pytanie z ogłoszenia.
              </li>
              <li>
                <b>Twoja praca, opcjonalnie.</b> Do kompetencji z ogłoszenia opisujesz konkretny
                przykład: co zrobiłeś/zrobiłaś sam/sama i z jakim skutkiem. Piszesz własnymi
                słowami, asystent poprawi tylko literówki. Możesz ten krok pominąć.
              </li>
              <li>
                <b>Wyślij.</b> Rekruter widzi Twoją odpowiedź obok zgłoszenia, zanim zdecyduje o
                rozmowie.
              </li>
            </ol>
          </div>
          <div className="ds-card dr-how-card" aria-label="Podgląd kroku Twoja praca">
            <img
              className="dr-card-cover"
              src={illustrations.handsHorizontal}
              alt={illustrationAlt.handsHorizontal}
            />
            <p className="ds-meta">Aplikacja · krok 2 z 3 · Twoja praca</p>
            <span className="ds-tag ds-tag--optional">Opcjonalne</span>
            <p className="ds-title">Pokaż, co zrobiłeś/zrobiłaś sam/sama</p>
            <p className="ds-lead">
              Do kompetencji z ogłoszenia możesz opisać jeden konkretny przykład z Twojej pracy.
              Asystent poprawi tylko literówki.
            </p>
            <div className="ds-panel">
              <p className="ds-meta">
                <span className="ds-tag ds-tag--must">Konieczne</span> Budowanie ewaluacji modeli
                językowych w produkcji
              </p>
              <p className="dr-q">
                Opowiedz o ostatnim razie, kiedy ta kompetencja była Ci potrzebna w pracy. Co
                zrobiłeś/zrobiłaś sam/sama i z jakim skutkiem?
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="dr-firms" aria-labelledby="firms-h">
        <div className="dr-wrap dr-firms-grid">
          <div>
            <p className="ds-label">Dla firm</p>
            <h2 id="firms-h" className="ds-title dr-big">
              Szukasz osób, które naprawdę pracują z AI?
            </h2>
            <p className="ds-lead">
              Opisz rolę, a asystent przygotuje propozycję ogłoszenia z priorytetami wymagań i
              konkretami o zespole. Przed publikacją możesz wszystko poprawić. W zgłoszeniach
              zobaczysz, co kandydat zrobił sam i z jakim skutkiem.
            </p>
            <ul className="dr-offer-list">
              <li>
                <b>Ogłoszenie na 30 dni</b> jedna rola, jedna publikacja
              </li>
              <li>
                <b>Pakiet publikacji</b> kilka ogłoszeń do wykorzystania
              </li>
              <li>
                <b>No Limit</b> dowolna liczba ogłoszeń przez ustalony okres
              </li>
            </ul>
            <div className="ds-btn-group">
              <Link className="ds-btn ds-btn--primary" to="/dla-firm">
                Dodaj ogłoszenie
              </Link>
              <Link
                className="ds-btn ds-btn--secondary"
                to={{ pathname: "/dla-firm", hash: "#jak-to-dziala" }}
              >
                Jak to działa
              </Link>
            </div>
            <div className="ds-card dr-chat-card" aria-label="Podgląd rozmowy z asystentem">
              <p className="ds-meta">Nowe ogłoszenie · rozmowa z asystentem · pytanie 3 z 7</p>
              <div className="ds-chat dr-demo-chat">
                <div className="ds-msg-ai">
                  <span className="ds-who">Asystent</span>Na jakich narzędziach pracujecie? Co
                  odróżnia pracę u Was od podobnych firm?
                </div>
                <div className="ds-msg-human ds-tile-human">
                  <span className="ds-who">Ty</span>Linear, Figma, Metabase. Mamy więcej pomysłów na
                  automatyzację niż czasu. Potrzebujemy kogoś, kto wybierze pierwszy.
                </div>
              </div>
              <div className="ds-panel">
                <p className="ds-meta">Zapisane do ogłoszenia, Twoimi słowami</p>
                <dl className="ds-facts">
                  <div>
                    <dt>Narzędzia</dt>
                    <dd>Linear, Figma, Metabase</dd>
                  </div>
                  <div>
                    <dt>Kluczowa kompetencja</dt>
                    <dd>Prowadzenie wdrożeń AI</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          <img
            className="dr-firms-ilu"
            src={illustrations.chartShield}
            alt={illustrationAlt.chartShield}
          />
        </div>
      </section>
    </>
  );
}
