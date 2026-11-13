import type { ReactNode, Ref } from "react";
import { BackLink } from "@/components/back-link";
import { ProcessTimeline } from "@/components/process-timeline";
import { RecordSheet } from "@/components/record-sheet";
import { CvAttachment } from "./cv-attachment";
import { MatchScore } from "./match-score";
import { stageLabels, type Application, type Stage } from "./model";

type RecordEvent = { stage: Stage; at: string; note?: string };
const dateFormat = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Role controllers authorize the record and project the history before rendering. */
export function ApplicationRecord({
  application,
  companyName,
  audience,
  history,
  statusRef,
  children,
  footer,
}: {
  application: Pick<
    Application,
    | "candidateId"
    | "candidateName"
    | "jobTitle"
    | "stage"
    | "answer"
    | "cv"
    | "score"
    | "summary"
    | "examples"
    | "declaredOwnWork"
  >;
  companyName: string;
  audience: "candidate" | "employer";
  history: RecordEvent[];
  statusRef?: Ref<HTMLSpanElement>;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const candidate = audience === "candidate";
  const title = candidate ? application.jobTitle : application.candidateName;
  const context = candidate ? application.candidateName : application.jobTitle;
  const submitted = history[0];
  return (
    <article className="recruiting-record">
      <header className="recruiting-header">
        <nav aria-label="Ścieżka nawigacji" className="record-breadcrumb">
          <BackLink to={candidate ? "/app/aplikacje" : "/app/kandydaci"}>
            {candidate ? "Moje aplikacje" : "Kandydaci"}
          </BackLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        <div className="record-meta">
          <span>
            {context} · {companyName}
          </span>
          <span className="record-stage" tabIndex={-1} ref={statusRef}>
            {stageLabels[application.stage]}
          </span>
          <MatchScore score={application.score} />
          {submitted && (
            <span>
              Złożona:{" "}
              <time dateTime={submitted.at}>{dateFormat.format(new Date(submitted.at))}</time>
            </span>
          )}
        </div>
      </header>
      <div className="recruiting-layout">
        <RecordSheet
          label={candidate ? "Twoja wysłana aplikacja" : "Materiały kandydata"}
          sections={[
            {
              value: "answer",
              label: "Odpowiedź",
              content: (
                <>
                  <h3>Przesłana aplikacja</h3>
                  <p>{application.answer}</p>
                  <OwnWorkExamples
                    examples={application.examples ?? []}
                    declared={application.declaredOwnWork ?? false}
                    candidate={candidate}
                  />
                </>
              ),
            },
            {
              value: "cv",
              label: "CV",
              content: (
                <>
                  <h3>CV z momentu aplikowania</h3>
                  <CvAttachment
                    candidateId={application.candidateId}
                    fallbackText={application.cv}
                    layout="row"
                    preview
                  />
                </>
              ),
            },
          ]}
          footer={footer}
        >
          {children}
        </RecordSheet>
        <aside className="recruiting-margin" aria-label="Historia i podsumowanie">
          <section aria-labelledby="process-heading">
            <h2 id="process-heading">Historia procesu</h2>
            <ProcessTimeline
              items={history.map((event, index) => ({
                id: `${index}-${event.at}`,
                title: stageLabels[event.stage],
                dateTime: event.at,
                content: event.note || undefined,
              }))}
            />
          </section>
          <section className="record-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Podsumowanie</h2>
            <p>{application.summary}</p>
          </section>
        </aside>
      </div>
    </article>
  );
}

function OwnWorkExamples({
  examples,
  declared,
  candidate,
}: {
  examples: NonNullable<Application["examples"]>;
  declared: boolean;
  candidate: boolean;
}) {
  return (
    <section className="own-work-record" aria-labelledby="own-work-record-title">
      <h3 id="own-work-record-title">Przykłady pracy</h3>
      {examples.length ? (
        <>
          <p className="record-caption">
            {declared
              ? "Kandydat deklaruje, że napisał te odpowiedzi samodzielnie (AI najwyżej poprawiło literówki). To deklaracja, nie gwarancja."
              : "Przykłady bez oświadczenia."}
          </p>
          {examples.map((example) => (
            <div className="own-work-pair" key={example.question}>
              <p className="own-work-pair-question">{example.question}</p>
              <div className="own-work-human">
                <span className="own-work-human-label">{candidate ? "Ty" : "Kandydat"}</span>
                <p>{example.answer}</p>
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="record-caption">
          {candidate
            ? "Nie dodałeś/dodałaś przykładów pracy. To niczego nie obniża."
            : "Kandydat nie dodał przykładów pracy. Brak przykładów nie obniża Match Score."}
        </p>
      )}
    </section>
  );
}
