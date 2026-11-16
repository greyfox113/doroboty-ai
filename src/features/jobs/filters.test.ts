import { describe, expect, it } from "vitest";
import { filterJobs, hasIndexableFilters, parseJobFilters } from "@/features/jobs/filters";
import { initialState, publishedJobs } from "@/features/prototype/model";
const joinJobsWithCompanies = () => publishedJobs(initialState());

describe("job filters", () => {
  it("accepts controlled filter values", () => {
    expect(
      parseJobFilters({ category: "build", remote: "remote", page: "2", query: "engineer" }),
    ).toEqual({ category: "build", remote: "remote", page: 2, query: "engineer" });
  });

  it("accepts empty values emitted by the native GET form", () => {
    expect(
      parseJobFilters({
        query: "",
        category: "lead",
        function: "",
        remote: "",
        seniority: "",
        contract: "",
      }),
    ).toMatchObject({ category: "lead", page: 1 });
  });

  it("falls back safely when controlled values are invalid", () => {
    expect(parseJobFilters({ category: "everything", page: "-1" })).toEqual({ page: 1 });
  });

  it("keeps filters for invalid page values and allows clamping large valid pages", () => {
    expect(parseJobFilters({ category: "build", page: "999" })).toMatchObject({
      category: "build",
      page: 999,
    });
    for (const page of ["0", "-1", "1.5", "NaN", "Infinity", "999999999999999999999"])
      expect(parseJobFilters({ category: "build", page })).toMatchObject({
        category: "build",
        page: 1,
      });
  });

  it("filters deterministic jobs by taxonomy and text", () => {
    const items = joinJobsWithCompanies();
    expect(filterJobs(items, { category: "build", page: 1 })).toHaveLength(2);
    expect(filterJobs(items, { query: "northstar", page: 1 }).map((job) => job.slug)).toEqual([
      "staff-ai-engineer",
      "growth-lead-ai-products",
    ]);
  });

  it("marks filtered combinations as non-indexable", () => {
    expect(hasIndexableFilters({ page: 1 })).toBe(false);
    expect(hasIndexableFilters({ function: "product", page: 1 })).toBe(true);
  });
});

describe("distance and relocation filters", () => {
  it("parses home, distance, remote and relocation parameters", () => {
    expect(
      parseJobFilters({ home: "Pruszków", distance: "25", remoteToo: "0", relocation: "1" }),
    ).toMatchObject({ home: "Pruszków", distance: 25, remoteToo: false, relocation: true });
    expect(parseJobFilters({ distance: "7" })).toEqual({ page: 1 });
  });

  it("keeps offices within the radius and remote roles unless excluded", () => {
    const jobs = joinJobsWithCompanies();
    const near = filterJobs(jobs, { page: 1, home: "Pruszków", distance: 25 });
    expect(near.map((x) => x.slug)).toEqual(
      expect.arrayContaining([
        "ai-product-manager",
        "ai-operations-specialist",
        "staff-ai-engineer",
      ]),
    );
    expect(near.some((x) => x.slug === "machine-learning-engineer")).toBe(false);
    const officeOnly = filterJobs(jobs, {
      page: 1,
      home: "Pruszków",
      distance: 25,
      remoteToo: false,
    });
    expect(officeOnly.every((x) => x.remoteStatus !== "remote")).toBe(true);
  });

  it("shows only hybrid or on-site roles with a relocation allowance", () => {
    const jobs = filterJobs(joinJobsWithCompanies(), { page: 1, relocation: true });
    expect(jobs.map((x) => x.slug).sort()).toEqual([
      "ai-product-manager",
      "machine-learning-engineer",
    ]);
  });
});
