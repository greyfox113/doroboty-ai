import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { CheckCircle2, FileText } from "lucide-react";
import { ConfettiBurst, type ConfettiOrigin } from "@/components/confetti-burst";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCard } from "@/features/jobs/job-card";
import { ApplicationOfferPreview } from "@/features/jobs/application-offer-preview";
import { usePrototype } from "./store";
import {
  currentPerson,
  publishedJobs,
  stageLabels,
  MIN_APPLICATION_ANSWER_LENGTH,
  type Person,
} from "./model";
import { PageTitle, Empty, NotFound, Notice } from "./shell";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { RecruitingApplication } from "./recruiting-application";
import { CandidateApplication } from "./candidate-application";
import { OwnWorkStep } from "@/features/applications/own-work-step";
import { answeredExamples, ownWorkPrompts } from "@/features/applications/own-work";
import { illustrations } from "@/features/public/illustrations";
import { publicationStatusLabel } from "@/features/jobs/presentation";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
const roleGroups = [
  ["candidate", "Kandydaci i kandydatki"],
  ["employer", "Firmy"],
  ["operator", "Prowadzący case study"],
] as const;
export function PersonPicker() {
  const { state, run } = usePrototype();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const next = params.get("next");
  const audience = params.get("audience");
  const role = audience === "candidate" || audience === "employer" ? audience : null;
  const safeNext = next && /^\/(?!\/)/.test(next) && !next.startsWith("/auth") ? next : null;
  function enter(person: Person) {
    run({ type: "select_person", id: person.id });
    navigate(
      person.role === "candidate"
        ? (safeNext ?? "/app")
        : person.role === "employer"
          ? safeNext?.startsWith("/app/oferty") || safeNext === "/app/kandydaci"
            ? safeNext
            : "/app/oferty"
          : "/app/case",
    );
  }
  return (
    <section className="dr-login" data-role={role ?? "all"}>
      <div className="dr-wrap dr-login-grid">
        <div className="dr-login-col">
          <fieldset className="ds-segment">
            <legend className="sr-only">Logujesz się jako</legend>
            {(
              [
                ["candidate", "Kandydat/kandydatka"],
                ["employer", "Firma"],
              ] as const
            ).map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="login-role"
                  value={value}
                  checked={role === value}
                  onChange={() => {
                    const nextParams = new URLSearchParams(params);
                    nextParams.set("audience", value);
                    setParams(nextParams, { replace: true });
                  }}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="ds-card dr-login-card">
            <h1 className="ds-title dr-login-h">
              {role === "employer"
                ? "Wejdź do panelu firmy"
                : role === "candidate"
                  ? "Wejdź na konto kandydata"
                  : "Wybierz osobę"}
            </h1>
            <p className="ds-lead">
              To symulacja logowania: wybierz fikcyjną osobę, z której chcesz korzystać w
              prototypie. Hasło nie jest potrzebne.
            </p>
            {roleGroups
              .filter(([groupRole]) => !role || groupRole === role)
              .map(([groupRole, label]) => {
                const people = state.people.filter((person) => person.role === groupRole);
                if (!people.length) return null;
                return (
                  <div key={groupRole} className="dr-login-group">
                    {!role && <p className="ds-label">{label}</p>}
                    <ul className="dr-person-list">
                      {people.map((person) => (
                        <li key={person.id} className="ds-panel dr-person">
                          <div className="min-w-0">
                            <h2 className="dr-person-name">{person.name}</h2>
                            <p className="ds-meta">{person.headline}</p>
                          </div>
                          <button
                            type="button"
                            className="ds-btn ds-btn--primary"
                            onClick={() => enter(person)}
                          >
                            Wejdź jako {person.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
          <p className="ds-meta dr-note">
            Prawdziwe logowanie (e-mail i hasło) nie jest częścią tego prototypu.
          </p>
        </div>
        <div className="dr-login-ilu">
          <img
            src={role === "employer" ? illustrations.specialist : illustrations.blockTower}
            alt=""
            data-orientation={role === "employer" ? "portrait" : "panorama"}
          />
          <ul className="dr-checks dr-login-points">
            {role === "employer" ? (
              <>
                <li>Twoje ogłoszenia i zgłoszenia w jednym miejscu</li>
                <li>Filtr „Z przykładami” pokazuje, kto opisał własną pracę</li>
                <li>Notatka do zgłoszenia zostaje tylko w panelu firmy</li>
              </>
            ) : (
              <>
                <li>Zapisane oferty i szkice aplikacji</li>
                <li>Status każdej wysłanej aplikacji</li>
                <li>Opcjonalny krok „Twoja praca” przy aplikacji</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
export function RequireRole({
  role,
  children,
}: {
  role?: "candidate" | "employer" | "operator";
  children: ReactNode;
}) {
  const { state } = usePrototype();
  const person = currentPerson(state);
  if (!person) return <PersonPicker />;
  if (role && person.role !== role)
    return (
      <Empty>
        <p className="mb-4">
          Ten widok jest dostępny dla{" "}
          {role === "candidate" ? "kandydata" : role === "employer" ? "pracodawcy" : "prowadzącego"}
          .
        </p>
        <Link className={buttonVariants({ variant: "outline" })} to="/auth/sign-in">
          Zmień osobę
        </Link>
      </Empty>
    );
  return children;
}
export function WorkspaceHome() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  if (person.role === "operator") return <Navigate to="/app/case" replace />;
  const candidate = person.role === "candidate";
  const applications = state.applications.filter((a) =>
    candidate ? a.candidateId === person.id : a.companyId === person.companyId,
  );
  return (
    <>
      <PageTitle>Witaj, {person.name.split(" ")[0]}</PageTitle>
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          ["Aplikacje", applications.length],
          [
            candidate ? "Zapisane oferty" : "Twoje oferty",
            candidate
              ? state.saved.filter((x) => x.candidateId === person.id).length
              : state.jobs.filter((x) => x.companyId === person.companyId).length,
          ],
          [
            "W trakcie procesu",
            applications.filter((x) => !["rejected", "withdrawn", "hired"].includes(x.stage))
              .length,
          ],
        ].map(([label, value]) => (
          <div className="prototype-panel" key={label}>
            <p className="text-muted-foreground">{label}</p>
            <strong className="mt-3 block text-3xl">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className={buttonVariants()} to={candidate ? "/oferty" : "/app/kandydaci"}>
          {candidate ? "Przeglądaj oferty" : "Przejrzyj kandydatów"}
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to={candidate ? "/app/profil" : "/app/oferty"}
        >
          {candidate ? "Edytuj profil" : "Zarządzaj ofertami"}
        </Link>
      </div>
    </>
  );
}
export function ProfilePage({ preview = false }: { preview?: boolean }) {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const [message, setMessage] = useState("");
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (
      run({
        type: "profile",
        value: {
          name: String(data.get("name")),
          headline: String(data.get("headline")),
          bio: String(data.get("bio")),
          location: String(data.get("location")),
        },
      })
    )
      setMessage("Profil został zapisany.");
  }
  return (
    <>
      <PageTitle
        action={
          <Link
            to={preview ? "/app/profil" : "/app/profil/podglad"}
            className={buttonVariants({ variant: "outline" })}
          >
            {preview ? "Edytuj profil" : "Podgląd profilu"}
          </Link>
        }
      >
        {preview ? person.name : "Twój profil"}
      </PageTitle>
      {preview ? (
        <div className="prototype-panel space-y-4">
          <h2>{person.headline}</h2>
          <p>{person.location}</p>
          <p>{person.bio}</p>
        </div>
      ) : (
        <form onSubmit={save} className="prototype-panel prototype-form">
          <Field label="Imię i nazwisko">
            <Input name="name" required maxLength={200} defaultValue={person.name} />
          </Field>
          <Field label="Nagłówek zawodowy">
            <Input name="headline" required maxLength={200} defaultValue={person.headline} />
          </Field>
          <Field label="Lokalizacja">
            <Input name="location" required maxLength={200} defaultValue={person.location} />
          </Field>
          <Field label="O mnie">
            <Textarea name="bio" maxLength={12000} defaultValue={person.bio} />
          </Field>
          <Button type="submit">Zapisz profil</Button>
          {message && <p role="status">{message}</p>}
        </form>
      )}
      <section className="prototype-panel mt-6">
        <h2 className="mb-4 flex items-center gap-2">
          <FileText className="size-5" />
          CV
        </h2>
        <CvAttachment candidateId={person.id} fallbackText={person.cv} />
      </section>
    </>
  );
}
export function SavedPage() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const jobs = publishedJobs(state).filter((job) =>
    state.saved.some((x) => x.candidateId === person.id && x.jobId === job.id),
  );
  return (
    <>
      <PageTitle>Zapisane oferty</PageTitle>
      {jobs.length ? (
        jobs.map((job) => <JobCard key={job.id} job={job} saved />)
      ) : (
        <Empty>
          <p className="mb-4">Nie masz jeszcze zapisanych ofert.</p>
          <Link className={buttonVariants({ variant: "outline" })} to="/oferty">
            Przeglądaj oferty
          </Link>
        </Empty>
      )}
    </>
  );
}
export function ApplyPage() {
  const { slug } = useParams();
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const navigate = useNavigate();
  const job = publishedJobs(state).find((x) => x.slug === slug);
  const draft = state.drafts.find((x) => x.jobId === job?.id && x.candidateId === person.id);
  const notes = draft?.notes ?? "";
  const generated = draft?.generated ?? "";
  const [answer, setAnswer] = useState(draft?.answer ?? "");
  const [examples, setExamples] = useState<string[]>(draft?.examples ?? []);
  const [declared, setDeclared] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const submittedOnce = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<ConfettiOrigin | null>(null);
  useEffect(() => {
    if (!submitted) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    const timeout = window.setTimeout(() => navigate("/app/aplikacje?wyslano=1"), delay);
    return () => window.clearTimeout(timeout);
  }, [submitted, navigate]);
  const answerLength = answer.trim().length;
  const answerInvalid = attempted && answerLength < MIN_APPLICATION_ANSWER_LENGTH;
  const consentInvalid = attempted && !consent;
  const prompts = job ? ownWorkPrompts(job.category) : [];
  const filledExamples = answeredExamples(prompts, examples);
  const declarationInvalid = attempted && filledExamples.length > 0 && !declared;
  if (!job) return <NotFound />;
  const existing = state.applications.find(
    (x) => x.jobId === job.id && x.candidateId === person.id,
  );
  if (existing && !submitted)
    return (
      <section className="prototype-section">
        <Notice>Aplikacja na tę ofertę została już wysłana.</Notice>
        <Link to={`/app/aplikacje/${existing.id}`} className={buttonVariants()}>
          Zobacz aplikację
        </Link>
      </section>
    );
  function submit(e: FormEvent) {
    e.preventDefault();
    if (submittedOnce.current) return;
    setAttempted(true);
    if (answerLength < MIN_APPLICATION_ANSWER_LENGTH) {
      answerInput.current?.focus();
      return;
    }
    if (filledExamples.length > 0 && !declared) {
      document.getElementById("own-work-declaration")?.focus();
      return;
    }
    if (!consent) {
      document.getElementById("application-consent")?.focus();
      return;
    }
    if (
      run({
        type: "submit",
        jobId: job!.id,
        notes,
        generated,
        answer,
        consent,
        examples: filledExamples,
        declaredOwnWork: filledExamples.length > 0 && declared,
      })
    ) {
      submittedOnce.current = true;
      setSubmitted(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const rect = sendButton.current?.getBoundingClientRect();
        if (rect)
          setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    }
  }
  const answerOk = answerLength >= MIN_APPLICATION_ANSWER_LENGTH;
  const currentStep = !answerOk ? 1 : consent || (filledExamples.length > 0 && declared) ? 3 : 2;
  const steps = [
    ["krok-1", "Dane i CV", answerOk],
    ["krok-2", "Twoja praca", filledExamples.length > 0 && declared],
    ["krok-3", "Sprawdź i wyślij", false],
  ] as const;
  return (
    <section className="dr-wrap application-page">
      <BackLink to={`/oferty/${job.slug}`}>Wróć do oferty</BackLink>
      <header className="application-header">
        <h1>Aplikuj na ofertę</h1>
        <p>Sprawdź ofertę i opowiedz, dlaczego pasujesz do tej roli.</p>
      </header>
      <div className="application-layout">
        <ApplicationOfferPreview job={job} />
        <form
          noValidate
          onSubmit={submit}
          className="application-form"
          aria-labelledby="application-form-title"
        >
          <header className="application-form-intro">
            <h2 id="application-form-title">Twoja aplikacja</h2>
            <p>
              Aplikujesz jako <strong>{person.name}</strong>.
            </p>
          </header>
          <ol className="ds-stepper dr-stepper" aria-label="Kroki aplikacji">
            {steps.map(([id, label, done], index) => (
              <li
                key={id}
                aria-current={currentStep === index + 1 ? "step" : undefined}
                className={done && currentStep !== index + 1 ? "is-done" : undefined}
              >
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ block: "start" });
                  }}
                >
                  {label}
                  {index === 1 && <span className="dr-opt"> (opcjonalnie)</span>}
                </a>
              </li>
            ))}
          </ol>
          <div id="krok-1" className="ds-card dr-step">
            <section className="application-form-section" aria-labelledby="application-cv-title">
              <p className="own-work-step">Krok 1 z 3</p>
              <h3 id="application-cv-title">Twoje CV</h3>
              <p className="application-help">Do aplikacji dołączymy CV z Twojego profilu.</p>
              <CvAttachment
                candidateId={person.id}
                fallbackText={person.cv}
                layout="row"
                contextLabel="CV z Twojego profilu"
              />
            </section>
            <section
              className="application-form-section application-answer"
              aria-label="Odpowiedź do aplikacji"
            >
              <Field label="Dlaczego pasujesz do tej roli?">
                <Textarea
                  disabled={submitted}
                  ref={answerInput}
                  required
                  minLength={MIN_APPLICATION_ANSWER_LENGTH}
                  maxLength={12000}
                  aria-invalid={answerInvalid || undefined}
                  aria-describedby="application-answer-help"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setConsent(false);
                  }}
                />
              </Field>
              <p
                id="application-answer-help"
                role={answerInvalid ? "alert" : undefined}
                className={answerInvalid ? "error-message" : "text-sm text-muted-foreground"}
              >
                {answerInvalid
                  ? `Odpowiedź jest za krótka. Wpisz co najmniej ${MIN_APPLICATION_ANSWER_LENGTH} znaków (obecnie: ${answerLength}).`
                  : `Minimum ${MIN_APPLICATION_ANSWER_LENGTH} znaków. Obecnie: ${answerLength}.`}
              </p>
            </section>
          </div>
          <OwnWorkStep
            prompts={prompts}
            answers={examples}
            onAnswer={(index, value) => {
              setExamples((list) => {
                const next = prompts.map((_, i) => list[i] ?? "");
                next[index] = value;
                return next;
              });
              setDeclared(false);
              setConsent(false);
            }}
            declared={declared}
            onDeclared={setDeclared}
            declarationInvalid={declarationInvalid}
            disabled={submitted}
          />
          <div id="krok-3" className="ds-card dr-step application-form-section application-submit">
            <p className="own-work-step">Krok 3 z 3</p>
            <label className="application-consent">
              <Checkbox
                id="application-consent"
                disabled={submitted}
                checked={consent}
                onCheckedChange={(v) => setConsent(v)}
                aria-invalid={consentInvalid || undefined}
                aria-describedby={consentInvalid ? "application-consent-error" : undefined}
                aria-label="Zatwierdzam treść i przesłanie aplikacji"
              />
              <span>
                Zatwierdzam treść aplikacji i przesłanie profilu oraz przykładowego CV pracodawcy.
              </span>
            </label>
            {consentInvalid && (
              <p id="application-consent-error" className="error-message" role="alert">
                Zatwierdź treść aplikacji i jej przesłanie pracodawcy.
              </p>
            )}
            <div className="application-actions">
              <Button
                ref={sendButton}
                type="submit"
                disabled={submitted}
                className="application-send"
              >
                {submitted && <CheckCircle2 aria-hidden="true" />}
                {submitted ? "Wysłano!" : "Wyślij aplikację"}
              </Button>
              <Button
                type="button"
                disabled={submitted}
                variant="outline"
                onClick={() => {
                  if (run({ type: "draft", jobId: job.id, notes, generated, answer, examples }))
                    setMessage("Szkic został zapisany.");
                }}
              >
                Zapisz szkic
              </Button>
            </div>
            <p
              role="status"
              className={submitted || !message ? "sr-only" : "application-save-status"}
            >
              {submitted ? "Wysłano aplikację. Otwieramy listę Twoich aplikacji." : message}
            </p>
            <p className="application-help">
              Prototyp: aplikacja zostaje w tym przeglądarkowym scenariuszu.
            </p>
          </div>
        </form>
      </div>
      <ConfettiBurst origin={confettiOrigin} />
    </section>
  );
}
type EmployerFilter = "all" | "examples" | "new";
function EmployerApplications() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EmployerFilter>("all");
  const jobs = state.jobs.filter((x) => x.companyId === person.companyId);
  const companyApps = state.applications.filter((x) => x.companyId === person.companyId);
  const selectedId = jobs.some((x) => x.id === params.get("oferta")) ? params.get("oferta") : null;
  const selected = publishedJobs(state).find((x) => x.id === selectedId);
  const applications = companyApps.filter(
    (x) =>
      (!selectedId || x.jobId === selectedId) &&
      (filter !== "examples" || (x.examples?.length ?? 0) > 0) &&
      (filter !== "new" || x.stage === "submitted") &&
      `${x.candidateName} ${x.jobTitle}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  function choose(id: string) {
    const next = new URLSearchParams(params);
    if (id) next.set("oferta", id);
    else next.delete("oferta");
    setParams(next, { replace: true });
  }
  const stats = (jobId?: string) => {
    const list = companyApps.filter((x) => !jobId || x.jobId === jobId);
    return {
      total: list.length,
      fresh: list.filter((x) => x.stage === "submitted").length,
      examples: list.filter((x) => (x.examples?.length ?? 0) > 0).length,
    };
  };
  const adButton = (id: string, title: string, meta: ReactNode) => {
    const counts = stats(id || undefined);
    return (
      <li key={id || "all"}>
        <button
          type="button"
          className="dr-ad-item"
          aria-current={(selectedId ?? "") === id ? "true" : undefined}
          onClick={() => choose(id)}
        >
          <span className="dr-ad-top">{meta}</span>
          <span className="dr-ad-title">{title}</span>
          <span className="dr-ad-stats">
            <span>
              <b>{counts.total}</b> aplikacji
            </span>
            <span>
              <b>{counts.fresh}</b> nowych
            </span>
            <span>
              <b>{counts.examples}</b> z przykładami
            </span>
          </span>
        </button>
      </li>
    );
  };
  return (
    <>
      <div className="dr-panel-head">
        <div>
          <p className="ds-meta">Panel firmy · dane przykładowe</p>
          <h1 className="ds-title dr-big">Kandydaci</h1>
        </div>
        <Link className="ds-btn ds-btn--primary" to="/app/oferty/nowa">
          Dodaj ogłoszenie
        </Link>
      </div>
      <div className="dr-panel-grid">
        <section className="dr-panel-ads" aria-labelledby="panel-ads-h">
          <h2 id="panel-ads-h" className="sr-only">
            Ogłoszenia
          </h2>
          <ul className="dr-ad-list">
            {adButton(
              "",
              "Wszystkie ogłoszenia",
              <span className="ds-meta">{jobs.length} ogłoszeń</span>,
            )}
            {jobs.map((job) =>
              adButton(
                job.id,
                job.title,
                <span className="ds-tag ds-tag--signal">
                  {publicationStatusLabel(job.publicationStatus)}
                </span>,
              ),
            )}
          </ul>
        </section>
        <section className="dr-panel-apps" aria-labelledby="panel-apps-h">
          {selected && (
            <div className="ds-card dr-ad-summary">
              <p className="ds-meta">Wybrane ogłoszenie</p>
              <p className="dr-job-title">{selected.title}</p>
              {selected.keySkill && (
                <>
                  <p className="ds-label">Kluczowa kompetencja</p>
                  <div className="ds-tile-human dr-key">{selected.keySkill}</div>
                </>
              )}
              <div className="ds-btn-group">
                <Link className="ds-btn ds-btn--secondary" to={`/app/oferty/${selected.id}`}>
                  Edytuj ogłoszenie
                </Link>
                <Link className="ds-btn ds-btn--secondary" to={`/oferty/${selected.slug}`}>
                  Zobacz publiczną stronę
                </Link>
              </div>
            </div>
          )}
          <div className="dr-apps-bar">
            <h2 id="panel-apps-h" className="ds-title">
              Aplikacje
            </h2>
            <fieldset className="ds-segment own-work-filter">
              <legend className="sr-only">Pokaż aplikacje</legend>
              {(
                [
                  ["all", "Wszystkie"],
                  ["examples", "Z przykładami"],
                  ["new", "Nowe"],
                ] as const
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="own-work-filter"
                    checked={filter === value}
                    onChange={() => setFilter(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </div>
          <Field label="Szukaj kandydata lub oferty">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
          <p className="ds-meta" aria-live="polite">
            Pokazujemy {applications.length} z {companyApps.length}
          </p>
          <div className="dr-apps">
            {applications.length ? (
              applications.map((a) => (
                <article className="ds-card dr-app" key={a.id}>
                  <div className="dr-app-top">
                    <div className="min-w-0">
                      <p className="ds-meta">{a.jobTitle}</p>
                      <h3 className="dr-job-title">
                        <Link to={`/app/kandydaci/${a.id}`}>{a.candidateName}</Link>
                      </h3>
                    </div>
                    <MatchScore score={a.score} />
                  </div>
                  <span className="ds-tag ds-tag--signal">{stageLabels[a.stage]}</span>
                  {(a.examples?.length ?? 0) > 0 && (
                    <p className="own-work-signal">
                      Przykłady pracy: {a.examples!.length}
                      {a.declaredOwnWork ? " · deklaruje: bez AI" : ""}
                    </p>
                  )}
                  <p className="dr-body">{a.summary}</p>
                </article>
              ))
            ) : (
              <div className="ds-card dr-empty">
                <img src={illustrations.wave} alt="" />
                <p>Brak aplikacji spełniających kryteria.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
export function ApplicationsPage({ employer = false }: { employer?: boolean }) {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const [query, setQuery] = useState("");
  const [params] = useSearchParams();
  if (employer) return <EmployerApplications />;
  const applications = state.applications.filter(
    (x) =>
      x.candidateId === person.id &&
      `${x.candidateName} ${x.jobTitle}`
        .toLocaleLowerCase("pl")
        .includes(query.toLocaleLowerCase("pl")),
  );
  return (
    <>
      <PageTitle>Moje aplikacje</PageTitle>
      {params.has("wyslano") && (
        <Notice>
          <CheckCircle2 className="inline size-5" /> Aplikacja została wysłana.
        </Notice>
      )}
      <Field label="Szukaj oferty">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      </Field>
      <div className="mt-6 space-y-4">
        {applications.length ? (
          applications.map((a) => (
            <article className="prototype-panel" key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    className="text-xl font-semibold text-[var(--gui-link)]"
                    to={`/app/aplikacje/${a.id}`}
                  >
                    {a.jobTitle}
                  </Link>
                  <p className="my-3 text-muted-foreground">
                    {state.companies.find((x) => x.id === a.companyId)?.name}
                  </p>
                  <span className="ds-tag ds-tag--signal">{stageLabels[a.stage]}</span>
                </div>
                <MatchScore score={a.score} />
              </div>
            </article>
          ))
        ) : (
          <Empty>Brak aplikacji spełniających kryteria.</Empty>
        )}
      </div>
    </>
  );
}
export function ApplicationDetail({ employer = false }: { employer?: boolean }) {
  const { id } = useParams();
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const application = state.applications.find(
    (x) =>
      x.id === id && (employer ? x.companyId === person.companyId : x.candidateId === person.id),
  );
  if (!application) return <NotFound />;
  if (employer) return <RecruitingApplication key={application.id} application={application} />;
  return <CandidateApplication key={application.id} application={application} />;
}
