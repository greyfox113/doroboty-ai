import type { JobFilters } from "@/features/jobs/types";

export const JOBS_PER_PAGE = 20;

export function paginateJobs<T>(jobs: T[], requestedPage: number) {
  const total = jobs.length;
  const totalPages = Math.max(1, Math.ceil(total / JOBS_PER_PAGE));
  const page = Math.min(
    totalPages,
    Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1),
  );
  const offset = (page - 1) * JOBS_PER_PAGE;
  return {
    items: jobs.slice(offset, offset + JOBS_PER_PAGE),
    page,
    total,
    totalPages,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + JOBS_PER_PAGE, total),
  };
}

export function jobListingHref(filters: JobFilters, page = 1, view: "list" | "map" = "list") {
  const query = new URLSearchParams();
  for (const key of [
    "query",
    "category",
    "function",
    "remote",
    "seniority",
    "contract",
    "location",
    "home",
  ] as const) {
    if (filters[key]) query.set(key, filters[key]);
  }
  if (filters.distance) query.set("distance", String(filters.distance));
  if (filters.remoteToo === false) query.set("remoteToo", "0");
  if (filters.relocation) query.set("relocation", "1");
  if (view === "map") query.set("view", "map");
  else if (page > 1) query.set("page", String(page));
  return query.size ? `/oferty?${query}` : "/oferty";
}

export function paginationNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const visible = new Set([1, totalPages]);
  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  for (let number = start; number <= end; number++) visible.add(number);
  const numbers = [...visible].sort((a, b) => a - b);
  return numbers.flatMap((number, index) =>
    index && number - numbers[index - 1]! > 1 ? ["ellipsis" as const, number] : [number],
  );
}
