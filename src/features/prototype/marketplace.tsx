import { Link, useParams, useSearchParams } from "react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ResponsivePanel } from "@/components/responsive-panel";
import { CompanyLogo } from "@/features/jobs/company-logo";
import { JobCard, Requirements } from "@/features/jobs/job-card";
import { JobFiltersForm } from "@/features/jobs/job-filters";
import { JobPagination } from "@/features/jobs/job-pagination";
import { JobDescription } from "@/features/jobs/job-description";
import { filterJobs, parseJobFilters } from "@/features/jobs/filters";
import { distanceKm } from "@/features/jobs/geo";
import { paginateJobs, jobListingHref } from "@/features/jobs/pagination";
import {
  categoryLabels,
  contractLabels,
  functionLabels,
  remoteLabels,
  seniorityLabels,
} from "@/features/jobs/presentation";
import {
  hiringProcess,
  mapHref,
  modeText,
  payAmount,
  payBasis,
  payText,
  publishedAgo,
  relocationText,
  responseDays,
  validUntil,
} from "@/features/jobs/offer";
import type { JobFilters, JobWithCompany } from "@/features/jobs/types";
import { illustrationAlt, illustrations } from "@/features/public/illustrations";
import { useSectionHash } from "./home";
import { usePrototype } from "./store";
import { currentPerson, publishedJobs } from "./model";
import { NotFound } from "./shell";

function LocalMap({ jobs }: { jobs: JobWithCompany[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const job = jobs.find((x) => x.id === selected);
  const located = jobs.filter((x) => x.coordinates);
  const locationKey = (x: JobWithCompany) => x.locations[0].trim().toLocaleLowerCase("pl");
  const markers = located.filter(
    (x, index) => located.findIndex((other) => locationKey(other) === locationKey(x)) === index,
  );
  const locationCount = (x: JobWithCompany) =>
    located.filter((other) => locationKey(other) === locationKey(x)).length;
  return (
    <div className="prototype-map-layout">
      <div className="prototype-map" role="region" aria-label="Mapa ofert w Polsce">
        <svg viewBox="0 0 600 520" aria-hidden="true">
          <path
            d="M140 45 220 65 320 40 375 60 440 50 505 150 480 240 520 335 440 420 355 435 310 480 230 435 150 445 90 350 70 260 95 160Z"
            fill="var(--gui-surface-muted)"
            stroke="var(--gui-edge)"
            strokeWidth="2"
          />
        </svg>
        {markers.map((x) => (
          <Button
            key={x.id}
            className="prototype-map-pin"
            size="icon-sm"
            variant={selected === x.id ? "default" : "outline"}
            style={{
              left: `${((x.coordinates!.longitude - 14) / 11) * 80 + 10}%`,
              top: `${((55 - x.coordinates!.latitude) / 6) * 80 + 10}%`,
            }}
            aria-label={`${x.locations.join(" / ")}: ${locationCount(x)} ofert`}
            aria-pressed={selected === x.id}
            onClick={() => setSelected(x.id)}
          >
            {locationCount(x) > 1 ? locationCount(x) : <MapPin />}
          </Button>
        ))}
      </div>
      <div className="prototype-panel">
        {job ? (
          <>
            <h2>{job.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Oferty w tej lokalizacji: {locationCount(job)}
            </p>
            <p className="my-3">
              {job.company.name} · {job.locations.join(" / ")}
            </p>
            <Link to={`/oferty/${job.slug}`} className={buttonVariants({ variant: "outline" })}>
              Zobacz rolę
            </Link>
          </>
        ) : (
          <p>Wybierz znacznik, aby zobaczyć ofertę.</p>
        )}
        <ul className="mt-5 space-y-3">
          {jobs.map((x) => (
            <li key={x.id}>
              <Link className="text-[var(--gui-link)] underline" to={`/oferty/${x.slug}`}>
                {x.title} · {x.company.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
function chipLabel(key: string, value: unknown) {
  if (key === "category") return categoryLabels[value as keyof typeof categoryLabels];
  if (key === "remote") return remoteLabels[value as keyof typeof remoteLabels];
  if (key === "seniority") return seniorityLabels[value as keyof typeof seniorityLabels];
  if (key === "contract") return contractLabels[value as keyof typeof contractLabels];
  if (key === "function") return functionLabels[value as keyof typeof functionLabels];
  if (key === "home") return `Dom: ${value}`;
  if (key === "distance") return `do ${value} km`;
  if (key === "remoteToo") return "bez pracy zdalnej";
  if (key === "relocation") return "z dodatkiem relokacyjnym";
  return String(value);
}

function activeFilters(filters: JobFilters) {
  return Object.entries(filters).filter(
    ([key, value]) => key !== "page" && value !== undefined && value !== "",
  );
}

export function JobsPage() {
  const { state } = usePrototype();
  const person = currentPerson(state);
  const [params, setParams] = useSearchParams();
  const filters = parseJobFilters(Object.fromEntries(params));
  const chipButtons = useRef(new Map<string, HTMLButtonElement>());
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const pendingChipFocus = useRef<string | null>(null);
  useEffect(() => {
    const target = pendingChipFocus.current;
    if (!target) return;
    (chipButtons.current.get(target) ?? resultsHeading.current)?.focus();
    pendingChipFocus.current = null;
  }, [params]);
  const all = publishedJobs(state);
  const jobs = filterJobs(all, filters);
  const pagination = paginateJobs(jobs, filters.page);
  const view = params.get("view") === "map" ? "map" : "list";
  const savedIds =
    person?.role === "candidate"
      ? new Set(state.saved.filter((x) => x.candidateId === person.id).map((x) => x.jobId))
      : undefined;
  const active = activeFilters(filters);
  function change(key: string, value: string) {
    // Functional update: quick successive filter changes must not overwrite each other.
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("page");
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }
  function removeFilter(key: string) {
    const keys = active.map(([name]) => name);
    const index = keys.indexOf(key);
    pendingChipFocus.current = keys[index + 1] ?? keys[index - 1] ?? "results";
    change(key, "");
  }
  function reset() {
    setParams(view === "map" ? { view: "map" } : {});
  }
  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    change("query", String(data.get("query") ?? "").trim());
  }
  return (
    <div className="dr-wrap dr-list-page">
      <nav className="ds-meta dr-crumbs" aria-label="Okruszki">
        <Link to="/">Strona główna</Link> / <span aria-current="page">Oferty</span>
      </nav>
      <div className="dr-list-head">
        <div>
          <h1 className="ds-title dr-big">Oferty pracy z AI</h1>
          <p className="ds-meta">Każda oferta ma widełki i wymagania z priorytetami.</p>
        </div>
        <form key={filters.query ?? ""} className="dr-list-search" role="search" onSubmit={search}>
          <label className="sr-only" htmlFor="list-query">
            Szukaj ofert
          </label>
          <input
            id="list-query"
            name="query"
            type="search"
            className="dr-input"
            aria-label="Szukaj ofert"
            maxLength={100}
            defaultValue={filters.query ?? ""}
            placeholder="Stanowisko, firma lub kompetencja"
          />
          <button type="submit" className="ds-btn ds-btn--primary">
            Szukaj
          </button>
        </form>
      </div>
      <div className="dr-list-grid">
        <div className="dr-filters-col">
          <ResponsivePanel
            title="Filtry"
            description="Wyniki zmieniają się od razu. W każdej grupie wybierz jeden warunek."
            resultCount={jobs.length}
          >
            <div className="ds-card dr-filters-card">
              <JobFiltersForm
                key={filters.home ?? ""}
                filters={filters}
                onChange={change}
                onReset={reset}
              />
            </div>
          </ResponsivePanel>
        </div>
        <section className="dr-results" aria-labelledby="results-h">
          <div className="dr-results-head">
            <h2 id="results-h" ref={resultsHeading} tabIndex={-1} className="ds-title">
              Wyniki
            </h2>
            <p className="ds-meta" role="status">
              {jobs.length}{" "}
              {jobs.length === 1
                ? "oferta"
                : jobs.length % 10 >= 2 &&
                    jobs.length % 10 <= 4 &&
                    (jobs.length % 100 < 10 || jobs.length % 100 >= 20)
                  ? "oferty"
                  : "ofert"}
            </p>
            <nav className="dr-view-switch" aria-label="Widok wyników">
              <Link
                aria-current={view === "list" ? "page" : undefined}
                to={jobListingHref(filters)}
              >
                Lista
              </Link>
              <Link
                aria-current={view === "map" ? "page" : undefined}
                to={jobListingHref(filters, 1, "map")}
              >
                Mapa
              </Link>
            </nav>
          </div>
          {active.length > 0 && (
            <div className="dr-chips">
              {active.map(([key, value]) => (
                <button
                  type="button"
                  className="dr-chip"
                  key={key}
                  aria-label={`Usuń filtr: ${chipLabel(key, value)}`}
                  ref={(element) => {
                    if (element) chipButtons.current.set(key, element);
                    else chipButtons.current.delete(key);
                  }}
                  onClick={() => removeFilter(key)}
                >
                  {chipLabel(key, value)} <X className="size-4" aria-hidden="true" />
                </button>
              ))}
              <button type="button" className="dr-text-button" onClick={reset}>
                Wyczyść wszystko
              </button>
            </div>
          )}
          {jobs.length ? (
            view === "map" ? (
              <LocalMap jobs={jobs} />
            ) : (
              <>
                <div className="dr-jobs dr-jobs-2">
                  {pagination.items.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      saved={savedIds?.has(job.id)}
                      distance={
                        filters.home && job.remoteStatus !== "remote"
                          ? distanceKm(filters.home, job.coordinates)
                          : null
                      }
                    />
                  ))}
                </div>
                <JobPagination pagination={pagination} filters={filters} />
              </>
            )
          ) : (
            <div className="dr-empty">
              <img src={illustrations.wave} alt="" />
              <p>
                <b>Brak ofert dla tych filtrów.</b> Zmień albo wyczyść filtry.
              </p>
              <button type="button" className="ds-btn ds-btn--secondary" onClick={reset}>
                Pokaż wszystkie oferty
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function applyHref(job: JobWithCompany, state: ReturnType<typeof usePrototype>["state"]) {
  const person = currentPerson(state);
  if (!person)
    return `/auth/sign-in?audience=candidate&next=${encodeURIComponent(`/aplikuj/${job.slug}`)}`;
  return `/aplikuj/${job.slug}`;
}

function OfferActions({ job }: { job: JobWithCompany }) {
  const { state, run } = usePrototype();
  const person = currentPerson(state);
  const saved = state.saved.some((x) => x.candidateId === person?.id && x.jobId === job.id);
  const submitted = state.applications.find(
    (x) => x.candidateId === person?.id && x.jobId === job.id,
  );
  if (person?.role === "candidate")
    return (
      <div className="ds-btn-group">
        <Link
          className="ds-btn ds-btn--primary"
          to={submitted ? `/app/aplikacje/${submitted.id}` : `/aplikuj/${job.slug}`}
        >
          {submitted ? "Zobacz swoją aplikację" : "Aplikuj"}
        </Link>
        <button
          type="button"
          className="ds-btn ds-btn--secondary dr-save"
          aria-label="Zapisz ofertę"
          aria-pressed={saved}
          onClick={() => run({ type: "toggle_saved", jobId: job.id })}
        >
          {saved ? "Zapisano" : "Zapisz"}
        </button>
      </div>
    );
  if (!person)
    return (
      <div className="ds-btn-group">
        <Link
          className="ds-btn ds-btn--primary"
          to={`/auth/sign-in?audience=candidate&next=${encodeURIComponent(`/aplikuj/${job.slug}`)}`}
        >
          Wybierz osobę i aplikuj
        </Link>
      </div>
    );
  return <p className="ds-meta">Aplikacje są dostępne z profilu kandydata.</p>;
}

export function JobPage() {
  const { slug } = useParams();
  useSectionHash();
  const { state } = usePrototype();
  const job = publishedJobs(state).find((x) => x.slug === slug);
  if (!job) return <NotFound />;
  const company = job.company;
  const relocation = relocationText(job);
  const process = hiringProcess(job);
  const related = publishedJobs(state)
    .filter((x) => x.id !== job.id)
    .sort((a, b) => Number(b.category === job.category) - Number(a.category === job.category))
    .slice(0, 3);
  const structured = Boolean(job.challenge || job.duties?.length);
  const sections = [
    ["o-roli", "O roli"],
    ...(job.mustHave?.length ? [["wymagania", "Wymagania"]] : []),
    ["proces", "Proces rekrutacji"],
    ...(company.benefits?.length ? [["benefity", "Benefity"]] : []),
    ["firma", "O firmie"],
    ["aplikuj", "Jak aplikujesz"],
  ];
  return (
    <div className="dr-wrap dr-detail-page">
      <nav className="ds-meta dr-crumbs" aria-label="Okruszki">
        <Link to="/">Strona główna</Link> / <Link to="/oferty">Oferty</Link> /{" "}
        <span aria-current="page">{job.title}</span>
      </nav>
      <div className="dr-detail-grid">
        <article className="dr-detail-main" aria-labelledby="offer-h">
          <header className="dr-offer-head">
            <CompanyLogo company={company} />
            <div className="min-w-0">
              <p className="ds-meta">
                <Link to={`/firmy/${company.slug}`}>{company.name}</Link> · dodano{" "}
                {publishedAgo(job)} · ważna do {validUntil(job)}
              </p>
              <h1 id="offer-h" className="ds-title dr-big">
                {job.title}
              </h1>
              <span className="ds-tag ds-tag--signal">{categoryLabels[job.category]}</span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="ds-tag ds-tag--signal">widełki w ogłoszeniu</span>
              )}
              <span className="ds-tag ds-tag--signal">
                odpowiedź do {responseDays(job)} dni roboczych
              </span>
            </div>
          </header>
          <dl className="ds-facts ds-panel dr-detail-facts">
            <div>
              <dt>Kategoria</dt>
              <dd>{categoryLabels[job.category]}</dd>
            </div>
            <div>
              <dt>Poziom</dt>
              <dd>{seniorityLabels[job.seniority]}</dd>
            </div>
            <div>
              <dt>Widełki</dt>
              <dd>{payText(job)}</dd>
            </div>
            <div>
              <dt>Tryb</dt>
              <dd>{modeText(job)}</dd>
            </div>
            <div>
              <dt>Umowa</dt>
              <dd>{contractLabels[job.contract]}</dd>
            </div>
            {relocation && (
              <div>
                <dt>Relokacja</dt>
                <dd>{relocation}</dd>
              </div>
            )}
          </dl>
          {job.keySkill && (
            <>
              <p className="ds-label">Kluczowa kompetencja</p>
              <div className="ds-tile-human dr-key dr-key-big">{job.keySkill}</div>
            </>
          )}
          <nav className="dr-toc" aria-label="Sekcje oferty">
            <span className="ds-meta">Na tej stronie:</span>
            {sections.map(([id, label]) => (
              <Link key={id} to={{ pathname: `/oferty/${job.slug}`, hash: `#${id}` }}>
                {label}
              </Link>
            ))}
          </nav>
          <section id="o-roli" tabIndex={-1} className="ds-card dr-sec" aria-labelledby="o-roli-h">
            <h2 id="o-roli-h" className="ds-title">
              O roli
            </h2>
            {structured ? (
              <>
                {job.challenge && (
                  <>
                    <p className="ds-label">Wyzwanie</p>
                    <p className="dr-body">{job.challenge}</p>
                  </>
                )}
                {job.duties?.length ? (
                  <>
                    <p className="ds-label">Zakres obowiązków</p>
                    <ul className="dr-tasks">
                      {job.duties.map((duty) => (
                        <li key={duty}>{duty}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {job.experience && (
                  <>
                    <p className="ds-label">Doświadczenie na podobnym stanowisku</p>
                    <p className="dr-body">
                      <b>Poziom: {seniorityLabels[job.seniority]}.</b> {job.experience}
                    </p>
                  </>
                )}
                {(job.team || job.tools) && (
                  <dl className="ds-facts ds-panel">
                    {job.team && (
                      <div>
                        <dt>Zespół</dt>
                        <dd>{job.team}</dd>
                      </div>
                    )}
                    {job.tools && (
                      <div>
                        <dt>Narzędzia</dt>
                        <dd>{job.tools}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {job.workStyle && (
                  <>
                    <p className="ds-label">Co odróżnia pracę tutaj</p>
                    <p className="dr-body">{job.workStyle}</p>
                  </>
                )}
                <details className="dr-more-text">
                  <summary>Pełny opis od firmy</summary>
                  <JobDescription description={job.description} />
                </details>
              </>
            ) : (
              <>
                <p className="dr-body">{job.summary}</p>
                <JobDescription description={job.description} />
              </>
            )}
          </section>
          {job.mustHave?.length ? (
            <section
              id="wymagania"
              tabIndex={-1}
              className="ds-card dr-sec"
              aria-labelledby="wymagania-h"
            >
              <h2 id="wymagania-h" className="ds-title">
                Wymagania
              </h2>
              <p className="ds-lead">
                Kolejność ustaliła firma. „Konieczne” decydują o zaproszeniu na rozmowę, „mile
                widziane” są dodatkiem.
              </p>
              <Requirements job={job} />
              <p className="ds-meta dr-note">
                Do kompetencji z ogłoszenia możesz w aplikacji opisać przykład ze swojej pracy.
                Firma czyta je przed decyzją o rozmowie.
              </p>
            </section>
          ) : null}
          <section id="proces" tabIndex={-1} className="ds-card dr-sec" aria-labelledby="proces-h">
            <p className="ds-meta">
              Deklaracja firmy · {process.stages.length} etapów · zwykle {process.total}
            </p>
            <h2 id="proces-h" className="ds-title">
              Proces rekrutacji
            </h2>
            <p className="ds-lead">
              Zanim wyślesz zgłoszenie, wiesz, z kim porozmawiasz, ile to potrwa i kiedy dostaniesz
              odpowiedź.
            </p>
            <ol className="dr-proc">
              {process.stages.map((stage) => (
                <li key={stage.title}>
                  <span className="dr-proc-head">
                    <b>{stage.title}</b>
                    <span className="ds-meta">{stage.when}</span>
                  </span>
                  {stage.who && (
                    <span>
                      <span className="ds-meta">Kto:</span> {stage.who}
                    </span>
                  )}
                  <span>{stage.how}</span>
                </li>
              ))}
            </ol>
            <ul className="dr-checks">
              <li>
                Zadanie rekrutacyjne ma określony zakres i czas. Twoje rozwiązanie zostaje Twoje.
              </li>
              <li>Na każdym etapie rozmawiasz z człowiekiem.</li>
              <li>Jeśli firma nie zaprosi Cię dalej, dostaniesz informację, a nie ciszę.</li>
            </ul>
            <p className="ds-meta dr-note">Prototyp: etapy i terminy są przykładowe.</p>
          </section>
          {company.benefits?.length ? (
            <section
              id="benefity"
              tabIndex={-1}
              className="ds-card dr-sec"
              aria-labelledby="benefity-h"
            >
              <h2 id="benefity-h" className="ds-title">
                Benefity
              </h2>
              <ul className="dr-checks dr-cols">
                {company.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              {relocation && relocation !== "nie" && (
                <p className="ds-meta dr-note">
                  Dodatek relokacyjny: <b>{relocation}</b>
                </p>
              )}
            </section>
          ) : null}
          <section id="firma" tabIndex={-1} className="ds-card dr-sec" aria-labelledby="firma-h">
            <h2 id="firma-h" className="ds-title">
              O firmie {company.name}
            </h2>
            <p className="dr-body">{company.description}</p>
            {company.values?.length ? (
              <>
                <p className="ds-label">Kultura i wartości</p>
                <ul className="dr-checks">
                  {company.values.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <dl className="ds-facts ds-panel">
              {company.industry && (
                <div>
                  <dt>Branża</dt>
                  <dd>{company.industry}</dd>
                </div>
              )}
              <div>
                <dt>Wielkość</dt>
                <dd>{company.sizeLabel}</dd>
              </div>
              <div>
                <dt>{company.remoteTeam ? "Siedziba" : "Biuro"}</dt>
                <dd>
                  {company.address ?? company.location}
                  {company.address && (
                    <>
                      <br />
                      <a href={mapHref(company.address)} target="_blank" rel="noreferrer">
                        Zobacz na mapie
                      </a>
                    </>
                  )}
                </dd>
              </div>
            </dl>
            <ul className="dr-links" aria-label="Strona i media społecznościowe">
              <li>
                <Link to={`/firmy/${company.slug}`}>Profil firmy</Link>
              </li>
              {/^https?:\/\//i.test(company.websiteUrl) && (
                <li>
                  <a href={company.websiteUrl} target="_blank" rel="noreferrer">
                    Strona firmy <ArrowUpRight className="inline size-4" aria-hidden="true" />
                  </a>
                </li>
              )}
              {company.social?.map((name) => (
                <li key={name}>
                  <a
                    href={`https://example.com/${company.slug}/${name.toLocaleLowerCase("pl")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {name} <ArrowUpRight className="inline size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="ds-meta">
              Firma, adres i linki są fikcyjne (adresy example.com, ulice bez numeru).
            </p>
          </section>
          <section
            id="aplikuj"
            tabIndex={-1}
            className="ds-card dr-sec dr-apply-card"
            aria-labelledby="aplikuj-h"
          >
            <img
              className="dr-card-cover"
              src={illustrations.handsHorizontal}
              alt={illustrationAlt.handsHorizontal}
            />
            <p className="ds-meta">Aplikacja · 3 kroki</p>
            <h2 id="aplikuj-h" className="ds-title">
              Jak aplikujesz na tę ofertę
            </h2>
            <ol className="dr-steps">
              <li>
                <b>Dane i CV.</b> CV z Twojego profilu i odpowiedź na pytanie firmy.
              </li>
              <li>
                <b>Twoja praca</b> <span className="ds-tag ds-tag--optional">Opcjonalne</span>
                <br />
                Dwa krótkie przykłady własnej pracy. Piszesz własnymi słowami, asystent poprawi
                tylko literówki. Pominięcie tego kroku nie obniża Twojego wyniku dopasowania.
              </li>
              <li>
                <b>Sprawdź i wyślij.</b> Odpowiedź dostaniesz do {responseDays(job)} dni roboczych.
              </li>
            </ol>
            <div className="ds-btn-group">
              <Link className="ds-btn ds-btn--primary" to={applyHref(job, state)}>
                Rozpocznij aplikację
              </Link>
              <Link className="ds-btn ds-btn--secondary" to="/oferty">
                Wróć do ofert
              </Link>
            </div>
          </section>
        </article>
        <aside className="dr-detail-side" aria-label="Podsumowanie oferty">
          <div className="ds-card dr-side-card">
            <p className="ds-meta">Widełki</p>
            <p className="dr-side-pay">{payAmount(job)}</p>
            <dl className="ds-facts">
              <div>
                <dt>Umowa</dt>
                <dd>{payBasis(job)}</dd>
              </div>
              <div>
                <dt>Tryb</dt>
                <dd>{modeText(job)}</dd>
              </div>
              <div>
                <dt>Odpowiedź firmy</dt>
                <dd>do {responseDays(job)} dni roboczych</dd>
              </div>
              <div>
                <dt>Ważna do</dt>
                <dd>{validUntil(job)}</dd>
              </div>
            </dl>
            <OfferActions job={job} />
            <p className="ds-meta dr-note">
              Krok „Twoja praca” jest opcjonalny. Prototyp: aplikacja zostaje w tej przeglądarce.
            </p>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="dr-similar" aria-labelledby="similar-h">
          <h2 id="similar-h" className="ds-title">
            Podobne oferty
          </h2>
          <div className="dr-jobs">
            {related.map((x) => (
              <JobCard key={x.id} job={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function CompanyPage() {
  const { slug } = useParams();
  const { state } = usePrototype();
  const company = state.companies.find((x) => x.slug === slug);
  if (!company) return <NotFound />;
  const jobs = publishedJobs(state).filter((x) => x.companyId === company.id);
  const details = jobs[0]?.company ?? company;
  return (
    <div className="dr-wrap dr-detail-page">
      <nav className="ds-meta dr-crumbs" aria-label="Okruszki">
        <Link to="/">Strona główna</Link> / <Link to="/oferty">Oferty</Link> /{" "}
        <span aria-current="page">{company.name}</span>
      </nav>
      <div className="dr-detail-grid">
        <div className="dr-detail-main">
          <header className="dr-offer-head">
            <CompanyLogo company={company} size="large" />
            <div className="min-w-0">
              <p className="ds-meta">Profil firmy · dane fikcyjne</p>
              <h1 className="ds-title dr-big">{company.name}</h1>
              <p className="ds-lead">{company.summary}</p>
            </div>
          </header>
          <section className="ds-card dr-sec" aria-labelledby="company-about-h">
            <h2 id="company-about-h" className="ds-title">
              O firmie
            </h2>
            <p className="dr-body">{company.description}</p>
            {details.values?.length ? (
              <>
                <p className="ds-label">Kultura i wartości</p>
                <ul className="dr-checks">
                  {details.values.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </div>
        <aside className="dr-detail-side" aria-label="Fakty o firmie">
          <dl className="ds-card ds-facts dr-side-card">
            <div>
              <dt>Lokalizacja</dt>
              <dd>{details.address ?? company.location}</dd>
            </div>
            <div>
              <dt>Wielkość</dt>
              <dd>{company.sizeLabel}</dd>
            </div>
            {/^https?:\/\//i.test(company.websiteUrl) && (
              <div>
                <dt>Strona</dt>
                <dd>
                  <a href={company.websiteUrl} target="_blank" rel="noreferrer">
                    Strona firmy <ArrowUpRight className="inline size-4" aria-hidden="true" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
      <section className="dr-similar" aria-labelledby="company-jobs-h">
        <h2 id="company-jobs-h" className="ds-title">
          Otwarte role
        </h2>
        {jobs.length > 0 ? (
          <div className="dr-jobs">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="dr-body">Ta firma nie ma teraz aktywnych ofert.</p>
        )}
      </section>
    </div>
  );
}
