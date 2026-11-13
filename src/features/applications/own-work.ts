/**
 * Optional "Twoja praca" step (experiment E1, idea I1 from the discovery sprint).
 * The candidate describes a recent, concrete example for a competence the role needs,
 * written in their own words. The assistant may only fix typos and punctuation.
 * Match Score does not change; skipping the step lowers nothing.
 */
export type JobCategory = "build" | "apply" | "lead";

export interface OwnWorkPrompt {
  competence: string;
  question: string;
}

export const OWN_WORK_MAX_LENGTH = 2500;
export const OWN_WORK_FOLLOW_UPS = [
  "Jaka była Twoja rola?",
  "Jaka była skala: zespół, dane, użytkownicy?",
  "Co wybrałeś/wybrałaś i dlaczego?",
  "Jaki był wynik i co było potem?",
] as const;

const prompts: Record<JobCategory, OwnWorkPrompt[]> = {
  build: [
    {
      competence: "Budowanie i ewaluacja rozwiązań AI",
      question:
        "Opowiedz o ostatnim razie, kiedy budowałeś/budowałaś lub ewaluowałaś rozwiązanie AI, które trafiło do użytkowników.",
    },
    {
      competence: "Jakość danych i modeli",
      question:
        "Opowiedz o ostatnim razie, kiedy zauważyłeś/zauważyłaś problem z jakością danych lub odpowiedzi modelu. Co zrobiłeś/zrobiłaś sam/sama?",
    },
  ],
  apply: [
    {
      competence: "Wdrażanie AI w pracy zespołu",
      question: "Opowiedz o ostatnim razie, kiedy wplatałeś/wplatałaś AI w workflow zespołu.",
    },
    {
      competence: "Weryfikacja wyników z asystenta AI",
      question:
        "Opowiedz o ostatnim razie, kiedy sprawdzałeś/sprawdzałaś wynik z asystenta AI, zanim trafił dalej. Co wychwyciłeś/wychwyciłaś?",
    },
  ],
  lead: [
    {
      competence: "Prowadzenie wdrożeń AI",
      question:
        "Opowiedz o ostatnim razie, kiedy prowadziłeś/prowadziłaś wdrożenie AI w zespole lub organizacji.",
    },
    {
      competence: "Priorytety i mierzenie efektów",
      question:
        "Opowiedz o ostatnim razie, kiedy musiałeś/musiałaś zdecydować, które rozwiązanie AI idzie pierwsze, i jak zmierzyłeś/zmierzyłaś jego efekt.",
    },
  ],
};

export function ownWorkPrompts(category: JobCategory): OwnWorkPrompt[] {
  return prompts[category];
}

/** Keeps only answered examples, paired with the question the candidate saw. */
export function answeredExamples(questions: OwnWorkPrompt[], answers: string[]) {
  return questions
    .map((prompt, index) => ({ question: prompt.question, answer: (answers[index] ?? "").trim() }))
    .filter((example) => example.answer.length > 0);
}

// Prototype "assistant": a small dictionary of common Polish typos and punctuation spacing.
// It never rewrites content; it is not a language model.
const typos: [RegExp, string][] = [
  [/\bnapewno\b/gi, "na pewno"],
  [/\bwogóle\b/gi, "w ogóle"],
  [/\bnarazie\b/gi, "na razie"],
  [/\bpoprostu\b/gi, "po prostu"],
  [/\bconajmniej\b/gi, "co najmniej"],
  [/\bnapoczątku\b/gi, "na początku"],
  [/\bwkoncu\b/gi, "w końcu"],
  [/\bnaprzykład\b/gi, "na przykład"],
  [/\bktóy\b/gi, "który"],
  [/\bzespółu\b/gi, "zespołu"],
  [/\bwdrozenie\b/gi, "wdrożenie"],
  [/\bwdrozenia\b/gi, "wdrożenia"],
  [/\bzrobilam\b/gi, "zrobiłam"],
  [/\bzrobilem\b/gi, "zrobiłem"],
  [/ +([,.;:!?])/g, "$1"],
  [/([,.;:!?])(?=[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])/g, "$1 "],
  [/ {2,}/g, " "],
];

export function fixTypos(input: string) {
  let count = 0;
  let text = input;
  for (const [pattern, replacement] of typos) {
    text = text.replace(pattern, (...args: string[]) => {
      count++;
      return replacement.replace("$1", args[1] ?? "");
    });
  }
  text = text.replace(/(^|[.!?]\s+)([a-ząćęłńóśźż])/g, (_match, before: string, letter: string) => {
    count++;
    return before + letter.toLocaleUpperCase("pl");
  });
  return { text, count };
}

export function placesLabel(count: number) {
  if (count === 1) return "1 miejsce";
  const tens = count % 100;
  const units = count % 10;
  return units >= 2 && units <= 4 && (tens < 10 || tens >= 20)
    ? `${count} miejsca`
    : `${count} miejsc`;
}
