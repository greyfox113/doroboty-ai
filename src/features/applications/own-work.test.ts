import { describe, expect, it } from "vitest";
import { initialState, transition, type State } from "@/features/prototype/model";
import { answeredExamples, fixTypos, ownWorkPrompts, placesLabel } from "./own-work";

const time = "2026-11-13T10:00:00.000Z";
const as = (state: State, id: string) => transition(state, { type: "select_person", id });
const base = (state: State) => ({
  type: "submit" as const,
  jobId: state.jobs[0].id,
  notes: "",
  generated: "",
  answer: "Approved application with sufficient context.",
  consent: true,
});
const example = { question: "Opowiedz o ostatnim razie…", answer: "Sama zbudowałam testy." };

describe("own-work examples (E1)", () => {
  it("keeps the step optional and stores nothing when skipped", () => {
    const s = as(initialState(), "candidate-anna");
    const app = transition(s, base(s), time, "app-a").applications.at(-1)!;
    expect(app.examples).toBeUndefined();
    expect(app.declaredOwnWork).toBeUndefined();
  });
  it("requires the own-work declaration when examples are sent", () => {
    const s = as(initialState(), "candidate-anna");
    expect(() => transition(s, { ...base(s), examples: [example] }, time)).toThrow("oświadczenie");
    const app = transition(
      s,
      { ...base(s), examples: [example], declaredOwnWork: true },
      time,
      "app-b",
    ).applications.at(-1)!;
    expect(app.examples).toEqual([example]);
    expect(app.declaredOwnWork).toBe(true);
  });
  it("lets only the hiring company save the recruiter note", () => {
    let s = as(initialState(), "candidate-anna");
    s = transition(s, { ...base(s), examples: [example], declaredOwnWork: true }, time, "app-c");
    expect(() =>
      transition(s, { type: "own_work_note", applicationId: "app-c", note: "nie wiem" }),
    ).toThrow();
    const employer = as(s, "employer-brightlabs");
    const companyId = employer.applications.find((x) => x.id === "app-c")!.companyId;
    const owner = employer.people.find((x) => x.role === "employer" && x.companyId === companyId)!;
    const noted = transition(as(s, owner.id), {
      type: "own_work_note",
      applicationId: "app-c",
      note: "Sama zbudowała testy regresji.",
    });
    expect(noted.applications.find((x) => x.id === "app-c")!.ownWorkNote).toBe(
      "Sama zbudowała testy regresji.",
    );
  });
  it("pairs answered examples with their questions and drops empty ones", () => {
    const prompts = ownWorkPrompts("apply");
    expect(answeredExamples(prompts, ["  ", "Sprawdziłem wynik."])).toEqual([
      { question: prompts[1].question, answer: "Sprawdziłem wynik." },
    ]);
  });
  it("fixes only typos and punctuation without changing content", () => {
    const result = fixTypos("napewno zrobilam testy ,wogóle bez AI.potem raport");
    expect(result.text).toBe("Na pewno zrobiłam testy, w ogóle bez AI. Potem raport");
    expect(result.count).toBeGreaterThan(0);
    expect(placesLabel(1)).toBe("1 miejsce");
    expect(placesLabel(3)).toBe("3 miejsca");
    expect(placesLabel(5)).toBe("5 miejsc");
    expect(placesLabel(22)).toBe("22 miejsca");
  });
});
