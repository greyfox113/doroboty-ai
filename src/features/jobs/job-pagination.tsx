import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { jobListingHref, paginationNumbers, type paginateJobs } from "@/features/jobs/pagination";
import type { JobFilters } from "@/features/jobs/types";

export function JobPagination({
  pagination,
  filters,
}: {
  pagination: ReturnType<typeof paginateJobs>;
  filters: JobFilters;
}) {
  const { page, totalPages, total, start, end } = pagination;
  if (!total) return null;
  return (
    <div className="dr-pagination">
      <p className="ds-meta" data-job-page-summary>
        Oferty {start}–{end} z {total}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Strony ofert" className="flex items-center gap-[var(--gui-space-xs)]">
          {page > 1 ? (
            <Link
              rel="prev"
              to={jobListingHref(filters, page - 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ChevronLeft aria-hidden="true" /> Poprzednia
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft aria-hidden="true" /> Poprzednia
            </Button>
          )}
          <span className="text-sm sm:hidden">
            <span className="sr-only">Strona </span>
            {page} / {totalPages}
          </span>
          <div className="hidden items-center gap-[var(--gui-space-xxs)] sm:flex">
            {paginationNumbers(page, totalPages).map((number, index) =>
              number === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-[var(--gui-space-xs)] text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Link
                  key={number}
                  to={jobListingHref(filters, number)}
                  aria-label={`Strona ${number}`}
                  aria-current={page === number ? "page" : undefined}
                  className={buttonVariants({
                    variant: page === number ? "default" : "ghost",
                    className: "dr-page-button",
                    size: "icon-sm",
                  })}
                >
                  {number}
                </Link>
              ),
            )}
          </div>
          {page < totalPages ? (
            <Link
              rel="next"
              to={jobListingHref(filters, page + 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Następna <ChevronRight aria-hidden="true" />
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Następna <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
