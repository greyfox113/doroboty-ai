import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  OWN_WORK_FOLLOW_UPS,
  OWN_WORK_MAX_LENGTH,
  fixTypos,
  placesLabel,
  type OwnWorkPrompt,
} from "./own-work";

/** Step 2 of the application: optional own-work examples written without AI. */
export function OwnWorkStep({
  prompts,
  answers,
  onAnswer,
  declared,
  onDeclared,
  declarationInvalid,
  disabled,
}: {
  prompts: OwnWorkPrompt[];
  answers: string[];
  onAnswer: (index: number, value: string) => void;
  declared: boolean;
  onDeclared: (value: boolean) => void;
  declarationInvalid: boolean;
  disabled: boolean;
}) {
  const [messages, setMessages] = useState<string[]>([]);
  const [before, setBefore] = useState<(string | null)[]>([]);
  const hasAnswer = answers.some((answer) => answer.trim().length > 0);
  const setMessage = (index: number, value: string) =>
    setMessages((list) => Object.assign([...list], { [index]: value }));
  const setUndo = (index: number, value: string | null) =>
    setBefore((list) => Object.assign([...list], { [index]: value }));

  return (
    <section className="application-form-section own-work" aria-labelledby="own-work-title">
      <p className="own-work-step">Krok 2 z 3 · opcjonalnie</p>
      <h3 id="own-work-title">Twoja praca</h3>
      <p className="application-help">
        Opisz konkretny, ostatni przykład z kompetencji, których potrzebuje ta rola. Pisz własnymi
        słowami. Asystent może tylko poprawić literówki. Możesz pominąć ten krok: aplikacja i Match
        Score się nie zmienią.
      </p>
      {prompts.map((prompt, index) => {
        const id = `own-work-${index + 1}`;
        const length = answers[index]?.length ?? 0;
        return (
          <fieldset className="own-work-item" key={prompt.competence}>
            <legend>
              <span className="own-work-tag">Kompetencja</span> {prompt.competence}
            </legend>
            <label className="own-work-question" htmlFor={id}>
              {prompt.question} Co zrobiłeś/zrobiłaś sam/sama i z jakim skutkiem?
            </label>
            <ul className="own-work-prompts" id={`${id}-prompts`}>
              {OWN_WORK_FOLLOW_UPS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Textarea
              id={id}
              disabled={disabled}
              maxLength={OWN_WORK_MAX_LENGTH}
              rows={5}
              spellCheck
              data-gramm="false"
              aria-describedby={`${id}-prompts ${id}-count`}
              placeholder="Napisz własnymi słowami…"
              value={answers[index] ?? ""}
              onChange={(event) => {
                onAnswer(index, event.target.value);
                setUndo(index, null);
                setMessage(index, "");
              }}
            />
            <p className="application-help own-work-count" id={`${id}-count`}>
              {length} / {OWN_WORK_MAX_LENGTH} znaków
            </p>
            <div className="own-work-actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  const value = answers[index] ?? "";
                  if (!value.trim()) {
                    setMessage(index, "Najpierw opisz przykład.");
                    return;
                  }
                  const result = fixTypos(value);
                  if (result.count) {
                    setUndo(index, value);
                    onAnswer(index, result.text);
                  }
                  setMessage(
                    index,
                    result.count
                      ? `Poprawiono ${placesLabel(result.count)} (literówki i interpunkcja). Treść i sformułowania zostały bez zmian.`
                      : "Nie znaleziono literówek.",
                  );
                }}
              >
                Popraw literówki
              </Button>
              {typeof before[index] === "string" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    onAnswer(index, before[index] ?? "");
                    setUndo(index, null);
                    setMessage(index, "Przywrócono Twój tekst.");
                  }}
                >
                  Cofnij poprawki
                </Button>
              )}
            </div>
            <p className="application-help" aria-live="polite">
              {messages[index] ?? ""}
            </p>
          </fieldset>
        );
      })}
      {hasAnswer && (
        <div className="own-work-declaration">
          <label className="application-consent">
            <Checkbox
              id="own-work-declaration"
              disabled={disabled}
              checked={declared}
              onCheckedChange={(value) => onDeclared(value)}
              aria-invalid={declarationInvalid || undefined}
              aria-describedby={declarationInvalid ? "own-work-declaration-error" : undefined}
              aria-label="Oświadczam, że przykłady napisałem/napisałam samodzielnie"
            />
            <span>
              Napisałem/napisałam te odpowiedzi samodzielnie. AI poprawiło w nich najwyżej
              literówki.
            </span>
          </label>
          {declarationInvalid && (
            <p id="own-work-declaration-error" className="error-message" role="alert">
              Zaznacz oświadczenie albo usuń treść przykładów.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
