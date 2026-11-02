"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Avatar } from "@/components/Form";
import { MODE_LABEL, initials } from "@/lib/format";
import type { ParticipationMode, PublicEdition } from "@/lib/types";
import { campAges, campAllows, modesOf } from "@/lib/editions";
import type { Entry } from "./model";

export function ParticipantsStep({
  edition,
  entries,
  onChange,
  onRestart,
}: {
  edition: PublicEdition;
  entries: Entry[];
  onChange: (personId: string, patch: Partial<Entry>) => void;
  /** Cancels the person's draft so they can pick a different way of taking part. */
  onRestart: (personId: string) => void;
}) {
  const modes = modesOf(edition);
  const camp = campAges(edition);
  const studio = edition.capabilities.includes("StudioRequests");

  // Someone too young or too old for camp can't keep it chosen: move them to walk-in so Continue doesn't fail on it.
  useEffect(() => {
    for (const e of entries) {
      if (e.mode === "Camp" && !e.registration && !campAllows(edition, e.person.ageAtEvent)) onChange(e.person.personId, { mode: "Day" });
    }
  }, [entries, edition, onChange]);

  return (
    <div className="stack-4">
      <div>
        <h3>Who is attending, and how?</h3>
        <p className="sm muted" style={{ marginTop: 4 }}>Tick everyone attending, then choose how each person will take part. It can be different for each one.</p>
      </div>

      {entries.map((e) => {
        const p = e.person;
        const name = `${p.given} ${p.family}`;
        const reg = e.registration;
        const locked = !!reg; // the way of taking part is fixed once a registration exists
        const group = `mode-${p.personId}`;
        return (
          <div className="card mp stack-4" key={p.personId}>
            <label className="mp-head">
              <input type="checkbox" checked={e.selected} onChange={(ev) => onChange(p.personId, { selected: ev.target.checked, error: undefined })} />
              <Avatar>{initials(p.given)}</Avatar>
              <span>
                <b>{name}</b>{p.isSelf && " (you)"}
                <span className="xs muted" style={{ display: "block" }}>{p.age != null ? (p.age === 1 ? "1 year old" : p.age < 1 ? "Under 1 year old" : `${p.age} years old`) : "Date of birth needed"}</span>
              </span>
            </label>

            {e.selected && !p.hasDob && (
              <div className="alert warn" role="alert">
                <div><b>Add a date of birth first.</b>{p.isSelf ? <> <Link href="/profile">Open your profile</Link> to add yours.</> : " We need it to register them."}</div>
              </div>
            )}

            {e.selected && (
              <div className="mp-body stack-4">
                {locked ? (
                  <div className="stack-2">
                    <div className="row">
                      <span className="badge b-event">{MODE_LABEL[reg.participationMode]}</span>
                      <span className="xs muted">Reference <span className="mono">{reg.reference}</span></span>
                    </div>
                    <p className="sm muted">
                      Your choice is saved. To change how {p.given} takes part,{" "}
                      <button type="button" className="link-btn" onClick={() => onRestart(p.personId)}>start this registration again</button>.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="lbl" id={`${group}-lbl`}>How will {p.given} take part?</div>
                    <div className="mp-group" role="radiogroup" aria-labelledby={`${group}-lbl`}>
                      {modes.map((m) => {
                        const blocked = m.mode === "Camp" && !campAllows(edition, p.ageAtEvent);
                        return (
                          <label className="mp-opt" key={m.mode} aria-disabled={blocked || undefined} style={blocked ? { opacity: 0.55, cursor: "not-allowed" } : undefined}>
                            <input type="radio" name={group} value={m.mode} checked={e.mode === m.mode} disabled={blocked} onChange={() => onChange(p.personId, { mode: m.mode as ParticipationMode, error: undefined })} />
                            <div><b>{MODE_LABEL[m.mode]}</b><span>{m.mode === "Camp" && camp ? `Ages ${camp} only` : m.mode === "Online" ? "Stream online" : "In person, daily"}</span></div>
                          </label>
                        );
                      })}
                    </div>
                    {e.mode === "Camp" && <p className="sm muted">Camp is a request. Our team reviews it before a bed is offered.</p>}
                    {e.mode === "Day" && p.isChild && <p className="sm muted">Check in and out each day. A pass alone never releases a child.</p>}
                    {e.mode === "Online" && <p className="sm muted">Stream online from home. No check-in or pick-up.</p>}
                  </>
                )}
                {studio && p.isChild && (
                  <label className="opt">
                    <input type="checkbox" checked={e.studio} onChange={(ev) => onChange(p.personId, { studio: ev.target.checked })} />
                    <span className="sm">Indicate interest if you don't mind your child taking part in the Studio Session. This is a request, not an approval.</span>
                  </label>
                )}
                {e.error && <div className="alert bad" role="alert"><div>{e.error}</div></div>}
              </div>
            )}
          </div>
        );
      })}
      {entries.length === 0 && <div className="empty"><p className="muted sm">No one to register yet. <>Add a dependant in <Link href="/profile#pf-kids">your profile</Link>, or complete your profile.</></p></div>}
      <p className="xs muted">Age is worked out by the system at the event's start from the date of birth. Eligibility is checked when you continue.</p>
    </div>
  );
}
