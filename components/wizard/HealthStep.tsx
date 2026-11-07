"use client";

import { useEffect, useRef } from "react";
import { FormError, Loading, TextAreaField } from "@/components/Form";
import { api } from "@/lib/api";
import type { Health } from "@/lib/types";
import { CONDITIONS, isPhysical, type Entry } from "./model";

export interface HealthAnswer {
  loaded: boolean;
  /** null until the family answers Yes or No. */
  hasIssue: boolean | null;
  conditions: string[];
  allergies: string;
  notes: string;
}

export const emptyHealth = (): HealthAnswer => ({ loaded: false, hasIssue: null, conditions: [], allergies: "", notes: "" });

/** The API's input for an answer, or an error message when it can't be sent yet. */
export function toHealthInput(a: HealthAnswer): { ok: true; body: { none: boolean; conditions: string[]; allergies?: string; notes?: string } } | { ok: false; message: string } {
  if (a.hasIssue === null) return { ok: false, message: "Answer Yes or No." };
  if (!a.hasIssue) return { ok: true, body: { none: true, conditions: [] } };
  if (a.conditions.length === 0 && !a.allergies.trim() && !a.notes.trim()) return { ok: false, message: "Choose a condition, or tell us about the allergy or care needed." };
  if (a.conditions.includes("other") && !a.notes.trim()) return { ok: false, message: "Describe the other condition in the notes." };
  return { ok: true, body: { none: false, conditions: a.conditions, allergies: a.allergies.trim() || undefined, notes: a.notes.trim() || undefined } };
}

/** Health answers live in memory and on the server only. They are never written to browser storage. */
export function HealthStep({
  entries,
  answers,
  setAnswer,
  errors,
}: {
  entries: Entry[];
  answers: Record<string, HealthAnswer>;
  setAnswer: (registrationId: string, patch: Partial<HealthAnswer>) => void;
  errors: Record<string, string>;
}) {
  const physical = entries.filter((e) => e.registration && isPhysical(e.registration.participationMode));
  const cards = useRef<Record<string, HTMLElement | null>>({});

  // Load what was already saved (resuming a draft).
  useEffect(() => {
    physical.forEach((e) => {
      const id = e.registration!.id;
      if (answers[id]?.loaded) return;
      api
        .get<Health | null>(`/registration/${id}/health`)
        .then((h) =>
          setAnswer(id, h ? { loaded: true, hasIssue: !h.none, conditions: h.conditions, allergies: h.allergies ?? "", notes: h.notes ?? "" } : { loaded: true }),
        )
        .catch(() => setAnswer(id, { loaded: true }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physical.map((e) => e.registration!.id).join()]);

  // After Continue finds gaps, take the person straight to the first card that still needs an answer.
  const errorKey = Object.keys(errors).join();
  useEffect(() => {
    const first = physical.find((e) => errors[e.registration!.id]);
    const el = first && cards.current[first.registration!.id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorKey]);

  if (physical.length === 0)
    return (
      <div className="card stack-4">
        <h3>Health and care</h3>
        <p className="sm muted">Nobody you've chosen is attending in person, so there are no health questions. Continue to the next step.</p>
      </div>
    );

  const done = (e: Entry) => toHealthInput(answers[e.registration!.id] ?? emptyHealth()).ok;
  const doneCount = physical.filter(done).length;
  const many = physical.length > 1;

  return (
    <div className="stack-4 hc">
      <div>
        <h3>Health and care</h3>
        <p className="sm muted" style={{ marginTop: 4 }}>
          {many
            ? `There is one question for each of the ${physical.length} people below. Tap Yes or No for each one to continue.`
            : "There is one question below. Tap Yes or No to continue."}
        </p>
      </div>
      <div className="alert info hc-private">
        <span aria-hidden="true">🔒</span>
        <div><b>Private and restricted.</b>Only our welfare and medical team can see this. It never appears in the general list.</div>
      </div>

      {many && (
        <div className="hc-progress" aria-live="polite">
          <div className="row between"><b className="sm">{doneCount} of {physical.length} answered</b>{doneCount === physical.length && <span className="xs hc-all">✓ All done</span>}</div>
          <div className="hc-bar" aria-hidden="true"><span style={{ width: `${(doneCount / physical.length) * 100}%` }} /></div>
        </div>
      )}

      {physical.map((e, i) => {
        const reg = e.registration!;
        const a = answers[reg.id] ?? emptyHealth();
        const err = errors[reg.id];
        const ok = done(e);
        const name = e.person.given;
        return (
          <section
            key={reg.id}
            ref={(el) => { cards.current[reg.id] = el; }}
            tabIndex={-1}
            className={`card stack-4 hc-card${ok ? " done" : ""}${err ? " bad" : ""}`}
            aria-label={`Health and care for ${name}`}
          >
            <div className="hc-card-h">
              <span className="hc-n" aria-hidden="true">{ok ? "✓" : i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{name} {e.person.family}</b>
                {e.person.age != null && <div className="xs muted">{e.person.age === 1 ? "1 year old" : `${e.person.age} years old`}</div>}
              </div>
              <span className={`hc-pill ${ok ? "ok" : "todo"}`}>{ok ? "Answered" : "Needs an answer"}</span>
            </div>

            {!a.loaded ? <Loading /> : (
              <>
                <fieldset className="hc-q" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="hc-question">Does {name} have any allergy or health condition we should know about?</legend>
                  <p className="xs muted" style={{ margin: "4px 0 var(--space-3)" }}>Tap one answer.</p>
                  <div className="hc-yn">
                    <label className="mp-opt hc-choice"><input type="radio" name={`yn-${reg.id}`} checked={a.hasIssue === false} onChange={() => setAnswer(reg.id, { hasIssue: false, conditions: [] })} /><div><b>No</b><span>Nothing to report</span></div></label>
                    <label className="mp-opt hc-choice"><input type="radio" name={`yn-${reg.id}`} checked={a.hasIssue === true} onChange={() => setAnswer(reg.id, { hasIssue: true })} /><div><b>Yes</b><span>I'll tell you more</span></div></label>
                  </div>
                </fieldset>

                {a.hasIssue && (
                  <div className="stack-4">
                    <fieldset className="hc-q" style={{ border: 0, padding: 0, margin: 0 }}>
                      <legend className="lbl">Which of these apply? <span className="muted">(choose all that apply)</span></legend>
                      <div className="chip-checks">
                        {CONDITIONS.map((c) => (
                          <label className="chip-check" key={c.value}>
                            <input
                              type="checkbox"
                              checked={a.conditions.includes(c.value)}
                              onChange={(ev) => setAnswer(reg.id, { conditions: ev.target.checked ? [...a.conditions, c.value] : a.conditions.filter((x) => x !== c.value) })}
                            />
                            <span>{c.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <TextAreaField label="Allergies" maxLength={1000} placeholder="Foods, medicines, stings…" value={a.allergies} onChange={(ev) => setAnswer(reg.id, { allergies: ev.target.value })} />
                    <TextAreaField
                      label="Anything else we should know, and what to do"
                      required={a.conditions.includes("other")}
                      maxLength={1000}
                      placeholder="Tell us what to look out for and what to do"
                      value={a.notes}
                      onChange={(ev) => setAnswer(reg.id, { notes: ev.target.value })}
                    />
                  </div>
                )}
                <FormError message={err} />
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
