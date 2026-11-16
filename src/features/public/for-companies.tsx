import { Link } from "react-router";
import { illustrationAlt, illustrations } from "./illustrations";
import { useSectionHash } from "@/features/prototype/home";

const start = `/auth/sign-in?audience=employer&next=${encodeURIComponent("/app/oferty/nowa")}`;

/** Public page for employers, ported from the owner's dla-firm.html pattern. */
export function ForCompaniesPage() {
  useSectionHash();
  return (
    <>
      <section className="dr-firm-hero" aria-labelledby="firm-hero-h">
        <div className="dr-wrap dr-firm-hero-grid">
          <div className="dr-hero-in dr-firm-hero-in">
            <p className="dr-eyebrow">Dla firm i rekruterów</p>
            <h1 id="firm-hero-h">Nie pisz ogłoszenia od zera. Opowiedz o roli.</h1>
            <p className="dr-hero-lead">
              Opisz zespół, narzędzia i problem, który ma rozwiązać nowa osoba. Asystent przygotuje
              z tego propozycję ogłoszenia z priorytetami wymagań. Przed publikacją poprawisz w
              niej, co zechcesz.
            </p>
            <div className="ds-btn-group">
              <Link className="ds-btn ds-btn--primary" to={start}>
                Dodaj ogłoszenie
              </Link>
              <Link
                className="ds-btn ds-btn--secondary"
                to={{ pathname: "/dla-firm", hash: "#pakiety" }}
              >
                Zobacz pakiety
              </Link>
            </div>
            <p className="ds-meta dr-note">Wolisz napisać ogłoszenie sam/sama? Ta opcja zostaje.</p>
          </div>
          <div className="dr-firm-hero-ilu">
            <img src={illustrations.specialist} alt={illustrationAlt.specialist} />
          </div>
        </div>
      </section>

      <section id="jak-to-dziala" tabIndex={-1} className="dr-how" aria-labelledby="firm-how-h">
        <div className="dr-wrap">
          <p className="ds-label">Jak to działa</p>
          <h2 id="firm-how-h" className="ds-title dr-big">
            Od opisu roli do zgłoszeń, które da się ocenić
          </h2>
          <ol className="dr-firm-steps">
            {[
              [
                "Opis roli",
                "Rekruter albo hiring manager podaje kilka faktów: kto jest w zespole, na czym pracujecie, jaki problem ma rozwiązać nowa osoba i co jest naprawdę konieczne.",
              ],
              [
                "Ogłoszenie z Twoich słów",
                "Asystent układa propozycję ogłoszenia z konkretów: liczb, nazw narzędzi, Twoich sformułowań. Wymagania dostają priorytet „konieczne” albo „mile widziane”.",
              ],
              [
                "Poprawiasz i publikujesz",
                "Edytujesz każde zdanie przed publikacją. Kandydaci mogą przy aplikacji opisać własnymi słowami przykład swojej pracy.",
              ],
            ].map(([title, text], index) => (
              <li className="ds-card" key={title}>
                <span className="dr-step-no" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dr-wrap dr-firm-demo" aria-labelledby="demo-h">
        <p className="ds-label">Podgląd</p>
        <h2 id="demo-h" className="ds-title dr-big">
          Co mówisz i co z tego powstaje
        </h2>
        <p className="ds-lead">Przykład z fikcyjną firmą BrightLabs.</p>
        <div className="dr-demo-grid">
          <div className="ds-card" aria-label="Podgląd rozmowy z asystentem">
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
              <div className="ds-msg-ai">
                <span className="ds-who">Asystent</span>Co jest konieczne od pierwszego dnia, a
                czego nowa osoba może się nauczyć u Was?
              </div>
              <div className="ds-msg-human ds-tile-human">
                <span className="ds-who">Ty</span>Discovery z użytkownikami jest konieczne. Branżę
                finansową pozna w miesiąc.
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
                  <dt>Zespół</dt>
                  <dd>designer, 4 inżynierów</dd>
                </div>
                <div>
                  <dt>Kluczowa kompetencja</dt>
                  <dd>Prowadzenie wdrożeń AI</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="dr-demo-arrow" aria-hidden="true">
            →
          </div>
          <article className="ds-card" aria-labelledby="demo-ad-h">
            <p className="ds-meta">Szkic ogłoszenia · do Twojej edycji przed publikacją</p>
            <h3 id="demo-ad-h" className="dr-job-title">
              AI Product Manager
            </h3>
            <dl className="ds-facts ds-panel">
              <div>
                <dt>Kategoria</dt>
                <dd>Lead</dd>
              </div>
              <div>
                <dt>Widełki</dt>
                <dd>22–29 tys. zł brutto, UoP</dd>
              </div>
              <div>
                <dt>Tryb</dt>
                <dd>hybrydowo, Warszawa</dd>
              </div>
            </dl>
            <p className="ds-label">Kluczowa kompetencja</p>
            <div className="ds-tile-human dr-key">
              Prowadzenie wdrożeń AI od discovery do wyniku
            </div>
            <ul className="dr-reqs">
              <li className="ds-req">
                <span className="ds-tag ds-tag--must">Konieczne</span>Discovery z użytkownikami
              </li>
              <li className="ds-req">
                <span className="ds-tag ds-tag--must">Konieczne</span>Priorytetyzacja roadmapy
              </li>
              <li className="ds-req">
                <span className="ds-tag ds-tag--nice">Mile widziane</span>Produkty dla finansów
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="dr-firm-apps" aria-labelledby="firm-apps-h">
        <div className="dr-wrap dr-apps-grid">
          <div>
            <p className="ds-label">Zgłoszenia</p>
            <h2 id="firm-apps-h" className="ds-title dr-big">
              Zanim zaprosisz kogoś na rozmowę, zobaczysz, co ta osoba zrobiła sama
            </h2>
            <p className="ds-lead">
              Kandydat może przy aplikacji opisać dwa konkretne przykłady swojej pracy. Pisze bez
              asystenta i to deklaruje. Odpowiedź widzisz obok zgłoszenia.
            </p>
            <ul className="dr-checks">
              <li>W panelu filtrujesz zgłoszenia „Z przykładami”.</li>
              <li>Odpowiedzi są opcjonalne. Ich brak nie obniża wyniku dopasowania kandydata.</li>
              <li>„Bez AI” to deklaracja kandydata, nie gwarancja. Oznaczamy ją wprost.</li>
            </ul>
          </div>
          <div className="ds-card" aria-label="Podgląd karty kandydata">
            <p className="ds-meta">Zgłoszenie · AI Product Manager · kandydatka przykładowa</p>
            <h3 className="dr-job-title">Kandydatka A</h3>
            <span className="ds-tag ds-tag--signal">wypełniła formularz</span>
            <span className="ds-tag ds-tag--signal">deklaruje: bez AI</span>
            <p className="ds-label">Jej słowa</p>
            <div className="ds-tile-human">
              Sama przeprowadziłam 12 wywiadów z księgowymi i pokazałam, że automatyzacja faktur
              oszczędzi im 4 godziny tygodniowo. Zarząd przesunął ten projekt na pierwsze miejsce.
            </div>
          </div>
        </div>
      </section>

      <section
        id="pakiety"
        tabIndex={-1}
        className="dr-wrap dr-plans-sec"
        aria-labelledby="plans-h"
      >
        <p className="ds-label">Pakiety</p>
        <h2 id="plans-h" className="ds-title dr-big">
          Wybierz, ile ogłoszeń potrzebujesz
        </h2>
        <p className="ds-lead">
          Propozycja ogłoszenia z asystentem i krok „Twoja praca” są w każdym pakiecie.
        </p>
        <div className="dr-plans">
          {[
            [
              "Ogłoszenie na 30 dni",
              "Jedna rola, jedna publikacja",
              [
                "Propozycja z asystentem albo własny tekst",
                "Wymagania z priorytetami",
                "Odpowiedzi kandydatów obok zgłoszeń",
              ],
              false,
            ],
            [
              "Pakiet publikacji",
              "Kilka ogłoszeń do wykorzystania",
              [
                "Wszystko z pojedynczego ogłoszenia",
                "Publikacje w swoim tempie",
                "Wcześniejsze opisy jako punkt wyjścia",
              ],
              true,
            ],
            [
              "No Limit",
              "Dowolna liczba ogłoszeń przez ustalony okres",
              [
                "Wszystko z pakietu publikacji",
                "Bez limitu ogłoszeń w okresie umowy",
                "Dla zespołów, które rekrutują stale",
              ],
              false,
            ],
          ].map(([title, meta, points, main]) => (
            <div className={`ds-card dr-plan${main ? " dr-plan--main" : ""}`} key={title as string}>
              {main && <span className="ds-tag ds-tag--signal">Gdy rekrutujesz kilka ról</span>}
              <h3>{title as string}</h3>
              <p className="ds-meta">{meta as string}</p>
              <ul className="dr-checks">
                {(points as string[]).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="ds-btn-group">
                <Link
                  className={`ds-btn ${main ? "ds-btn--primary" : "ds-btn--secondary"}`}
                  to={start}
                >
                  {main ? "Wybierz pakiet" : "Wybierz"}
                  <span className="sr-only">: {title as string}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="ds-meta">Ceny i płatności nie są częścią prototypu.</p>
      </section>

      <section className="dr-wrap dr-faq" aria-labelledby="faq-h">
        <h2 id="faq-h" className="ds-title">
          Częste pytania
        </h2>
        {[
          [
            "Kto powinien opisać rolę?",
            "Osoba, która ją zna: rekruter albo hiring manager. Szkic możesz zapisać i wrócić do niego później.",
          ],
          [
            "Czy asystent zmieni moje słowa?",
            "Asystent zachowuje konkrety: liczby, nazwy narzędzi i Twoje sformułowania. Przed publikacją możesz zmienić każde zdanie.",
          ],
          [
            "Czy muszę podać widełki?",
            "Formularz o nie zapyta. Oferty z widełkami są czytelniejsze dla kandydatów.",
          ],
          [
            "Co, jeśli kandydat pominie krok „Twoja praca”?",
            "Zgłoszenie trafia do Ciebie normalnie, a wynik dopasowania się nie obniża. Zobaczysz tylko, że kandydat nie dodał przykładu.",
          ],
        ].map(([question, answer]) => (
          <details className="ds-card" key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>

      <section className="dr-firm-cta" aria-labelledby="firm-cta-h">
        <div className="dr-wrap dr-cta-grid">
          <img
            className="dr-cta-ilu"
            src={illustrations.teamBoard}
            alt={illustrationAlt.teamBoard}
          />
          <div>
            <h2 id="firm-cta-h" className="ds-title dr-big">
              Zacznij od opisu roli
            </h2>
            <p className="ds-lead">Kilka minut zamiast pisania ogłoszenia od zera.</p>
            <div className="ds-btn-group">
              <Link className="ds-btn ds-btn--primary" to={start}>
                Dodaj ogłoszenie
              </Link>
              <Link className="ds-btn ds-btn--secondary" to="/auth/sign-in?audience=employer">
                Zaloguj się jako firma
              </Link>
            </div>
            <p className="ds-meta dr-note">
              Prototyp: logowanie to wybór fikcyjnej osoby, bez hasła.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

const terms = [
  [
    "Postanowienia ogólne",
    [],
    "kto prowadzi serwis, definicje (serwis, kandydat, firma, ogłoszenie, aplikacja), zakres usług.",
  ],
  [
    "Konta kandydatów i firm",
    [
      "Serwis ma dwa rodzaje kont: konto kandydata lub kandydatki i konto firmy (rekruter albo hiring manager).",
    ],
    "zakładanie i usuwanie konta, logowanie, odpowiedzialność za dane logowania.",
  ],
  [
    "Aplikacje i przykłady własnej pracy",
    [
      "Aplikacja ma trzy kroki: dane i CV, opcjonalne przykłady własnej pracy oraz wysłanie. Pominięcie przykładów nie obniża wyniku dopasowania.",
      "Oświadczenie, że przykłady zostały napisane samodzielnie, jest deklaracją kandydata lub kandydatki. Firma widzi je przy zgłoszeniu jako „deklaruje: bez AI”.",
    ],
    "komu i na jak długo udostępniamy aplikację, wycofanie aplikacji, odpowiedzialność za prawdziwość informacji.",
  ],
  [
    "Asystent AI w serwisie",
    [
      "W przykładach własnej pracy asystent poprawia tylko literówki i interpunkcję. Firmom pomaga przygotować propozycję ogłoszenia, którą przed publikacją można edytować.",
    ],
    "zasady korzystania z asystenta, ograniczenia odpowiedzialności za wygenerowane treści.",
  ],
  [
    "Ogłoszenia i pakiety dla firm",
    ["Dostępne pakiety: ogłoszenie na 30 dni, pakiet publikacji oraz No Limit."],
    "ceny i płatności, zasady treści ogłoszeń, moderacja, czas publikacji, odnowienia.",
  ],
  [
    "Dane osobowe",
    [],
    "odesłanie do polityki prywatności, podstawy przetwarzania danych w rekrutacji, prawa osób, których dane dotyczą.",
  ],
  ["Reklamacje i kontakt", [], "sposób i termin składania reklamacji, dane kontaktowe."],
  ["Zmiany regulaminu", [], "jak informujemy o zmianach i od kiedy obowiązują."],
] as const;

/** Terms structure from the owner's regulamin.html pattern; legal text is still to be written. */
export function TermsPage() {
  useSectionHash();
  return (
    <div className="dr-wrap dr-legal">
      <nav className="ds-meta dr-crumbs" aria-label="Okruszki">
        <Link to="/">Strona główna</Link> / <span aria-current="page">Regulamin</span>
      </nav>
      <h1 className="ds-title dr-big">Regulamin serwisu DoRoboty.ai</h1>
      <div className="ds-panel" role="note">
        <p>
          <b>Wersja robocza prototypu.</b> To struktura regulaminu z tematami, które wynikają z
          działania serwisu. Treść prawną przygotuje i zatwierdzi dział prawny. Ten dokument nie
          jest wiążący.
        </p>
      </div>
      <nav className="ds-card dr-legal-toc" aria-labelledby="terms-toc-h">
        <h2 id="terms-toc-h" className="ds-label">
          Spis treści
        </h2>
        <ol>
          {terms.map(([title], index) => (
            <li key={title}>
              <Link to={{ pathname: "/regulamin", hash: `#s${index + 1}` }}>{title}</Link>
            </li>
          ))}
        </ol>
      </nav>
      {terms.map(([title, paragraphs, todo], index) => (
        <section id={`s${index + 1}`} tabIndex={-1} key={title} aria-labelledby={`s${index + 1}-h`}>
          <h2 id={`s${index + 1}-h`} className="ds-title">
            {index + 1}. {title}
          </h2>
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <p className="dr-todo">Do uzupełnienia: {todo}</p>
        </section>
      ))}
    </div>
  );
}
