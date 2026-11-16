import { Link } from "react-router";
import { usePrototype } from "@/features/prototype/store";
import type { JobWithCompany } from "./types";
import { categoryLabels, seniorityLabels } from "./presentation";
import { CompanyLogo } from "./company-logo";
import { modeText, payText, publishedAgo, relocationText } from "./offer";

export function Requirements({ job }: { job: JobWithCompany }) {
  if (!job.mustHave?.length && !job.niceToHave?.length) return null;
  return (
    <ul className="dr-reqs" aria-label="Wymagania">
      {job.mustHave?.map((item) => (
        <li className="ds-req" key={`must-${item}`}>
          <span className="ds-tag ds-tag--must">Konieczne</span>
          {item}
        </li>
      ))}
      {job.niceToHave?.map((item) => (
        <li className="ds-req" key={`nice-${item}`}>
          <span className="ds-tag ds-tag--nice">Mile widziane</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** K3 offer card: meta → title → facts → key competence → requirements → actions. */
export function JobCard({
  job,
  saved,
  distance,
}: {
  job: JobWithCompany;
  saved?: boolean;
  distance?: number | null;
}) {
  const { run } = usePrototype();
  const relocation = relocationText(job);
  return (
    <article className="ds-card dr-job" aria-labelledby={`job-${job.id}`}>
      <div className="dr-job-top">
        <CompanyLogo company={job.company} size="small" />
        <div className="min-w-0">
          <p className="ds-meta">
            <Link className="dr-job-company" to={`/firmy/${job.company.slug}`}>
              {job.company.name}
            </Link>{" "}
            · {publishedAgo(job)}
          </p>
          <h3 id={`job-${job.id}`} className="dr-job-title">
            <Link to={`/oferty/${job.slug}`}>{job.title}</Link>
          </h3>
        </div>
      </div>
      <dl className="ds-facts dr-job-facts">
        <div>
          <dt>Kategoria</dt>
          <dd>
            {categoryLabels[job.category]} · {seniorityLabels[job.seniority]}
          </dd>
        </div>
        <div>
          <dt>Widełki</dt>
          <dd>{payText(job)}</dd>
        </div>
        <div>
          <dt>Tryb</dt>
          <dd>
            {modeText(job)}
            {distance != null && ` · ${distance} km od Ciebie`}
          </dd>
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
          <div className="ds-tile-human dr-key">{job.keySkill}</div>
        </>
      )}
      <Requirements job={job} />
      <div className="ds-btn-group dr-job-actions">
        <Link className="ds-btn ds-btn--primary" to={`/aplikuj/${job.slug}`}>
          Aplikuj
          <span className="sr-only">: {job.title}</span>
        </Link>
        <Link className="ds-btn ds-btn--secondary" to={`/oferty/${job.slug}`}>
          Czytaj więcej
          <span className="sr-only">: {job.title}</span>
        </Link>
        {saved !== undefined && (
          <button
            type="button"
            className="ds-btn ds-btn--secondary dr-save"
            aria-pressed={saved}
            aria-label={`Zapisz ofertę: ${job.title}`}
            onClick={() => run({ type: "toggle_saved", jobId: job.id })}
          >
            {saved ? "Zapisano" : "Zapisz"}
          </button>
        )}
      </div>
    </article>
  );
}
