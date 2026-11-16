import { CompanyLogoImage } from "@/features/jobs/company-logo-image";
import { companyInitials, companyLogoUrl } from "@/features/jobs/company-logos";
import type { Company } from "@/features/jobs/types";
import { cn } from "@/lib/utils";

export function CompanyLogo({
  company,
  size = "default",
}: {
  company: Pick<Company, "name" | "slug" | "logoUrl">;
  size?: "small" | "default" | "large";
}) {
  const src = companyLogoUrl(company);
  const dimension = size === "large" ? 80 : size === "small" ? 40 : 56;
  const initials = companyInitials(company.name);

  return (
    <span
      aria-hidden="true"
      data-company-logo={company.slug}
      className={cn(
        "dr-logo relative flex shrink-0 items-center justify-center overflow-hidden text-sm font-bold",
        size === "large" ? "size-20" : size === "small" ? "size-10" : "size-14",
      )}
    >
      {src ? <CompanyLogoImage src={src} dimension={dimension} initials={initials} /> : initials}
    </span>
  );
}
