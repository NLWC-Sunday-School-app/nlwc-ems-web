"use client";

import { useEffect, useState } from "react";
import { Avatar, FormError, Loading, TextAreaField } from "@/components/Form";
import { api } from "@/lib/api";
import { initials } from "@/lib/format";
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
  const [current, setCurrent] = useState(physical[0]?.person.personId);

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

  if (physical.length === 0)
    return (
      <div className="card stack-4">
        <h3>Health and care</h3>
        <p className="sm muted">Nobody you've chosen is attending in person, so there are no health questions. Continue to the next step.</p>
      </div>
    );

  const done = (e: Entry) => toHealthInput(answers[e.registration!.id] ?? emptyHealth()).ok;
  const doneCount = physical.filter(done).length;
  const selected = physical.find((e) => e.person.personId === current) ?? physical[0];
  const reg = selected.registration!;
  const a = answers[reg.id] ?? emptyHealth();
  const err = errors[reg.id];

  return (
    <div className="stack-4 hc">
      <div>
        <h3>Health and care</h3>
        <p className="sm muted" style={{ marginTop: 4 }}>Please answer for each person attending in person so our team can look after them well. It takes about a minute each.</p>
      </div>
      <div className="alert info hc-private">
        <span aria-hidden="true">🔒</span>
        <div><b>Private and restricted.</b>Only our welfare and medical team can see this. It never appears in the general list.</div>
      </div>

      <div className="row" role="group" aria-label="Choose a person" style={{ flexWrap: "wrap" }}>
        {physical.map((e) => (
          <button
            type="button"
            key={e.person.personId}
            className="hc-tab"
            aria-pressed={e.person.personId === selected.person.personId}
            onClick={() => setCurrent(e.person.personId)}
          >
            <Avatar>{initials(e.person.given)}</Avatar>
            <span><b>{e.person.given}</b><span className={`hc-status ${done(e) ? "done" : ""}`}>{done(e) ? "✓ Done" : "To do"}</span></span>
          </button>
        ))}
        <span className="hc-count xs muted">{doneCount} of {physical.length} done</span>
      </div>

      <section className="card stack-4" aria-label={`Health and care for ${selected.person.given}`}>
        <div><h3>{selected.person.given}</h3>{selected.person.age != null && <div className="xs muted">{selected.person.age} years old</div>}</div>
        {!a.loaded ? <Loading /> : (
          <>
            <fieldset className="hc-q" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="lbl">Does {selected.person.given} have any allergy or health condition we should know about?</legend>
              <div className="hc-yn">
                <label className="mp-opt"><input type="radio" name={`yn-${reg.id}`} checked={a.hasIssue === false} onChange={() => setAnswer(reg.id, { hasIssue: false, conditions: [] })} /><div><b>No</b><span>Nothing to report</span></div></label>
                <label className="mp-opt"><input type="radio" name={`yn-${reg.id}`} checked={a.hasIssue === true} onChange={() => setAnswer(reg.id, { hasIssue: true })} /><div><b>Yes</b><span>I'll tell you more</span></div></label>
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
    </div>
  );
}
