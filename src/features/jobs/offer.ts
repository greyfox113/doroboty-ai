import type { JobWithCompany } from "./types";
import { contractLabels, remoteLabels } from "./presentation";

const number = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });
const day = 24 * 60 * 60 * 1000;

/** "dzisiaj", "wczoraj", "3 dni temu" relative to now; the prototype has no server clock. */
export function publishedAgo(job: JobWithCompany, now = Date.now()) {
  const days = Math.max(0, Math.floor((now - new Date(job.publishedAt).getTime()) / day));
  return days === 0 ? "dzisiaj" : days === 1 ? "wczoraj" : `${days} dni temu`;
}

export function validUntil(job: JobWithCompany) {
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(
    new Date(job.expiryAt),
  );
}

/** Short salary fact for cards and fact grids, e.g. "22–29 tys. zł brutto, UoP / mies.". */
export function payText(job: JobWithCompany) {
  if (!job.salaryMin && !job.salaryMax) return "Nie podano";
  const thousands = job.salaryPeriod !== "year" && job.salaryCurrency !== "EUR";
  const amount = [job.salaryMin, job.salaryMax]
    .filter((x): x is number => typeof x === "number")
    .map((x) => (thousands ? number.format(x / 1000) : number.format(x)))
    .join("–");
  const unit = thousands ? "tys. zł" : job.salaryCurrency === "EUR" ? "EUR" : "zł";
  const kind = job.salaryKind === "net" ? "netto" : "brutto";
  const contract = job.contract === "employment" ? "UoP" : contractLabels[job.contract];
  return `${amount} ${unit} ${kind}, ${contract} / ${job.salaryPeriod === "year" ? "rok" : "mies."}`;
}

/** Amount only, for the large figure in the offer summary card. */
export function payAmount(job: JobWithCompany) {
  return payText(job).split(/ (brutto|netto),/)[0];
}

export function payBasis(job: JobWithCompany) {
  const kind = job.salaryKind === "net" ? "netto" : "brutto";
  return `${contractLabels[job.contract]}, ${kind} / ${job.salaryPeriod === "year" ? "rok" : "mies."}`;
}

export function modeText(job: JobWithCompany) {
  return `${remoteLabels[job.remoteStatus].toLocaleLowerCase("pl")}, ${job.locations.join(" / ")}`;
}

/** Relocation is shown only for hybrid and on-site roles (owner decision 13.11.2026). */
export function relocationText(job: JobWithCompany) {
  if (job.remoteStatus === "remote") return null;
  return job.relocation ?? null;
}

export function responseDays(job: JobWithCompany) {
  return job.responseDays ?? 5;
}

export type HiringStage = { title: string; who?: string; how: string; when: string };

/** Six-step recruitment process from the owner's pattern (13.11.2026). Stages and times are examples. */
export function hiringProcess(job: JobWithCompany): { total: string; stages: HiringStage[] } {
  const lead = job.category === "lead";
  const build = job.category === "build";
  return {
    total: lead ? "4–5 tygodni" : "3–4 tygodnie",
    stages: [
      {
        title: "Przegląd zgłoszeń",
        who: "rekruter lub rekruterka razem z hiring managerem",
        how: "Czytają CV i Twoje przykłady z kroku „Twoja praca”.",
        when: `odpowiedź do ${responseDays(job)} dni roboczych od wysłania`,
      },
      {
        title: "Rozmowa z rekruterem",
        who: "rekruter lub rekruterka",
        how: "Wideo. Oczekiwania, warunki, dostępność i Twoje pytania o firmę.",
        when: "30 min",
      },
      {
        title: "Rozmowa z hiring managerem",
        who: lead ? "przyszły przełożony lub przełożona" : "lider lub liderka zespołu",
        how: "Wideo. Pytania o Twoje przykłady: co zrobiłeś/zrobiłaś sam/sama i z jakim skutkiem.",
        when: "60 min",
      },
      {
        title: "Zadanie rekrutacyjne",
        who: "robisz je samodzielnie",
        how: build
          ? "Zadanie techniczne oparte na problemie z ogłoszenia. Firma podaje zakres i oczekiwany wynik."
          : lead
            ? "Studium przypadku: plan i priorytety dla wyzwania z ogłoszenia."
            : "Praktyczne zadanie z narzędziami z ogłoszenia.",
        when: lead
          ? "ok. 6 godzin pracy, 7 dni na oddanie"
          : "ok. 4 godziny pracy, 5 dni na oddanie",
      },
      {
        title: "Prezentacja rozwiązania",
        who: lead ? "hiring manager i osoba z zarządu" : "hiring manager i 1–2 osoby z zespołu",
        how: "Przedstawiasz rozwiązanie i rozmawiacie o nim.",
        when: "60 min",
      },
      {
        title: "Decyzja",
        how: "Informacja o decyzji z krótkim uzasadnieniem, także przy odmowie.",
        when: "do 5 dni roboczych po prezentacji",
      },
    ],
  };
}

export function mapHref(address: string) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address.replace(/\s*\(.*\)$/, ""))}`;
}
