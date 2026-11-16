import type { Job } from "./types";
import { contractLabels } from "./presentation";

/** Amount and agreement basis are distinct facts, shared by cards and offer conditions. */
export function SalaryFact({ job }: { job: Job }) {
  const amount = [job.salaryMin, job.salaryMax]
    .filter((x): x is number => x !== undefined)
    .map((x) => new Intl.NumberFormat("pl-PL").format(x))
    .join("–");
  return (
    <div>
      {amount ? (
        <>
          <span className="salary-amount">
            {amount} {job.salaryCurrency === "EUR" ? "EUR" : "zł"}
          </span>
          <p className="salary-basis">
            {contractLabels[job.contract]} ·{" "}
            {job.salaryKind === "net"
              ? "netto" + (job.contract === "b2b" ? " + VAT" : "")
              : "brutto"}{" "}
            / {job.salaryPeriod === "year" ? "rok" : "mies."}
          </p>
        </>
      ) : (
        <span className="salary-missing">Nie podano wynagrodzenia</span>
      )}
    </div>
  );
}
