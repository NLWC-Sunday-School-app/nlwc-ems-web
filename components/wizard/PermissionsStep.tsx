"use client";

import { useEffect } from "react";
import { Avatar, FormError } from "@/components/Form";
import { api, friendlyError } from "@/lib/api";
import { initials } from "@/lib/format";
import type { Consent, ConsentKind } from "@/lib/types";
import { CONSENT_TEXT, CONSENT_TITLE, consentKinds, type Entry } from "./model";

/** registrationId → kind → what the family answered. A missing kind is "not answered", which is not the same as No. */
export type ConsentAnswers = Record<string, Partial<Record<ConsentKind, boolean>>>;

export function PermissionsStep({
  entries,
  answers,
  setAnswers,
  errors,
  setError,
}: {
  entries: Entry[];
  answers: ConsentAnswers;
  setAnswers: (updater: (prev: ConsentAnswers) => ConsentAnswers) => void;
  errors: Record<string, string>;
  setError: (registrationId: string, message: string | null) => void;
}) {
  // Load what was already answered (resuming a draft).
  useEffect(() => {
    entries.forEach((e) => {
      const id = e.registration!.id;
      api
        .get<Consent[]>(`/registration/${id}/consent`)
        .then((list) => setAnswers((prev) => ({ ...prev, [id]: { ...Object.fromEntries(list.map((c) => [c.kind, c.accepted])), ...prev[id] } })))
        .catch(() => undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.map((e) => e.registration!.id).join()]);

  async function answer(registrationId: string, kind: ConsentKind, accepted: boolean) {
    setError(registrationId, null);
    setAnswers((prev) => ({ ...prev, [registrationId]: { ...prev[registrationId], [kind]: accepted } }));
    try {
      await api.put(`/registration/${registrationId}/consent/${kind}`, { accepted });
    } catch (e) {
      // Roll the choice back so the screen never shows an answer the server didn't record.
      setAnswers((prev) => {
        const { [kind]: _removed, ...rest } = prev[registrationId] ?? {};
        return { ...prev, [registrationId]: rest };
      });
      setError(registrationId, friendlyError(e));
    }
  }

  // Terms, guardian and medical are required; media is not, and a No is a complete answer.
  const required = entries.flatMap((e) => consentKinds(e.person).filter((k) => k !== "Media").map((k) => ({ id: e.registration!.id, k })));
  const accepted = required.filter((r) => answers[r.id]?.[r.k] === true).length;
  const kinds = Array.from(new Set(entries.flatMap((e) => consentKinds(e.person))));

  return (
    <div className="stack-4">
      <div className="row between">
        <div>
          <h3>Permissions</h3>
          <p className="sm muted" style={{ marginTop: 4 }}>Nothing is pre-selected. Answer each one for each person.</p>
        </div>
        <div className="perm-progress">
          <span className="sm bold" role="status">{accepted} of {required.length} required done</span>
          <div className="meter" aria-hidden="true"><i className="m-sold" style={{ width: required.length ? `${(accepted / required.length) * 100}%` : 0 }} /></div>
        </div>
      </div>

      <div className="alert warn"><span aria-hidden="true">⏱</span><div><b>Wording pending approval.</b>The text below is a placeholder until NLWC signs off the final consent wording. Your answers are recorded with the version that applied.</div></div>

      {kinds.map((kind, i) => {
        const rows = entries.filter((e) => consentKinds(e.person).includes(kind));
        const allDone = rows.every((e) => answers[e.registration!.id]?.[kind] !== undefined);
        return (
          <section className={`card perm-card stack-2 ${allDone ? "done" : ""}`} key={kind} aria-labelledby={`perm-${kind}`}>
            <header className="perm-h">
              <span className="perm-n" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 id={`perm-${kind}`}>{CONSENT_TITLE[kind]}</h3>
                <span className="xs muted">{kind === "Media" ? "Optional. Saying no never stops registration." : "Required to register."}</span>
              </div>
              {allDone && <span className="perm-ok" style={{ display: "inline-flex" }}>✓ Answered</span>}
            </header>
            <div className="consent-text" role="region" aria-label={CONSENT_TITLE[kind]}><p>{CONSENT_TEXT[kind]}</p></div>
            {rows.map((e) => {
              const id = e.registration!.id;
              const value = answers[id]?.[kind];
              const name = `${e.person.given} ${e.person.family}`;
              const group = `${kind}-${id}`;
              return (
                <div className="consent-row" key={id}>
                  <div className="row" style={{ flex: 1, minWidth: 150 }}>
                    <Avatar>{initials(e.person.given)}</Avatar>
                    <div><b>{name}</b>{e.person.age != null && <div className="xs muted">{e.person.age} years old</div>}</div>
                  </div>
                  <div className="ph-choice" role="radiogroup" aria-label={`${CONSENT_TITLE[kind]} for ${name}`}>
                    <label><input type="radio" name={group} checked={value === true} onChange={() => answer(id, kind, true)} /><span>I consent</span></label>
                    <label><input type="radio" name={group} checked={value === false} onChange={() => answer(id, kind, false)} /><span>I do not consent</span></label>
                  </div>
                  <span className="ph-st">
                    {value === undefined && <span className="badge b-warn">⏱ Not answered</span>}
                    {value === true && <span className="badge b-ok">✓ Consent given</span>}
                    {value === false && <span className={`badge ${kind === "Media" ? "b-neutral" : "b-bad"}`}>{kind === "Media" ? "Declined" : "Declined · can't register"}</span>}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}

      {entries.map((e) => errors[e.registration!.id] && <FormError key={e.registration!.id} message={`${e.person.given}: ${errors[e.registration!.id]}`} />)}
    </div>
  );
}
