import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationRecord } from "./application-record";
import { nextStages, stageLabels, type Application } from "./model";
import { usePrototype } from "./store";

export function RecruitingApplication({ application }: { application: Application }) {
  const { state, run } = usePrototype();
  const [note, setNote] = useState("");
  const [ownWork, setOwnWork] = useState(application.ownWorkNote ?? "");
  const [ownWorkStatus, setOwnWorkStatus] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const statusRef = useRef<HTMLSpanElement>(null);
  const pendingFocus = useRef(false);
  const company = state.companies.find((item) => item.id === application.companyId);
  const availableStages = nextStages[application.stage];

  useLayoutEffect(() => {
    if (pendingFocus.current) {
      statusRef.current?.focus();
      pendingFocus.current = false;
    }
  }, [application.stage]);

  return (
    <>
      <ApplicationRecord
        application={application}
        companyName={company?.name ?? ""}
        audience="employer"
        history={application.events}
        statusRef={statusRef}
        footer={
          availableStages.length > 0 ? (
            <>
              <p className="record-caption">Notatka zapisze się w historii po zmianie etapu.</p>
              <div className="record-actions">
                {availableStages.map((stage) => (
                  <Button
                    key={stage}
                    variant={stage === "rejected" ? "outline" : "default"}
                    onClick={() => {
                      if (run({ type: "stage", applicationId: application.id, stage, note })) {
                        setNote("");
                        setAnnouncement(`Zapisano etap: ${stageLabels[stage]}.`);
                        pendingFocus.current = true;
                      }
                    }}
                  >
                    {stageLabels[stage]}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="record-caption">
              {stageLabels[application.stage]}. Brak kolejnych działań w tym procesie.
            </p>
          )
        }
      >
        <section className="own-work-note" aria-labelledby="own-work-note-title">
          <h3 id="own-work-note-title">
            <label htmlFor="own-work-note">Co ta osoba zrobiła sama i z jakim skutkiem?</label>
          </h3>
          <p className="record-caption" id="own-work-note-hint">
            Odpowiedz krótko przed zaproszeniem na rozmowę. Jeśli nie wiesz, wpisz „nie wiem”.
          </p>
          <Textarea
            id="own-work-note"
            aria-describedby="own-work-note-hint"
            maxLength={12000}
            rows={3}
            value={ownWork}
            onChange={(event) => {
              setOwnWork(event.target.value);
              setOwnWorkStatus("");
            }}
          />
          <div className="record-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (run({ type: "own_work_note", applicationId: application.id, note: ownWork }))
                  setOwnWorkStatus("Zapisano odpowiedź.");
              }}
            >
              Zapisz odpowiedź
            </Button>
            <span className="record-caption" aria-live="polite">
              {ownWorkStatus}
            </span>
          </div>
        </section>
        {availableStages.length > 0 ? (
          <>
            <h3>
              <label htmlFor="recruiting-note">Notatka rekrutacyjna</label>
            </h3>
            <p className="record-caption" id="recruiting-note-hint">
              Widoczna tylko pracodawcy w tym scenariuszu.
            </p>
            <Textarea
              id="recruiting-note"
              aria-label="Notatka rekrutacyjna (widoczna pracodawcy)"
              aria-describedby="recruiting-note-hint"
              maxLength={12000}
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Co warto sprawdzić w rozmowie?"
            />
          </>
        ) : null}
      </ApplicationRecord>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
