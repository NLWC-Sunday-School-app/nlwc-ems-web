"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddDependantForm } from "@/components/Dependants";
import { Avatar, DateParts, FormError } from "@/components/Form";
import { MODE_LABEL, initials, toIsoDate } from "@/lib/format";
import type { ParticipationMode, PublicEdition } from "@/lib/types";
import { MIN_REGISTRATION_AGE, ageAllowed, campAges, campAllows, modesOf } from "@/lib/editions";
import { ageRangeText, canSelect, childrenWelcome, selfEligibility, type Entry } from "./model";

export function ParticipantsStep({
  edition,
  entries,
  onChange,
  onRestart,
  onDependantAdded,
  onSelfDob,
}: {
  edition: PublicEdition;
  entries: Entry[];
  onChange: (personId: string, patch: Partial<Entry>) => void;
  /** Cancels the person's draft so they can pick a different way of taking part. */
  onRestart: (personId: string) => void;
  /** Called after a new dependant is saved so the list can pick them up. */
  onDependantAdded: () => Promise<void> | void;
  /** Saves the account holder's own date of birth. Resolves to an error message, or null when saved. */
  onSelfDob: (iso: string) => Promise<string | null>;
}) {
  const [adding, setAdding] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [selfDobAdded, setSelfDobAdded] = useState(false);
  const modes = modesOf(edition);
  const camp = campAges(edition);
  const studio = edition.capabilities.includes("StudioRequests");

  // Someone too young or too old for camp can't keep it chosen: move them to walk-in so Continue doesn't fail on it.
  useEffect(() => {
    for (const e of entries) {
      if (e.mode === "Camp" && !e.registration && !campAllows(edition, e.person.ageAtEvent)) onChange(e.person.personId, { mode: "Day" });
    }
  }, [entries, edition, onChange]);

  // Anyone over the event's age limit, or with no date of birth (so no way to tell their age), can't take part: never left ticked.
  useEffect(() => {
    for (const e of entries) {
      if (e.selected && ((!e.registration && !e.person.hasDob) || (e.person.hasDob && !ageAllowed(edition, e.person.ageAtEvent)))) onChange(e.person.personId, { selected: false });
    }
  }, [entries, edition, onChange]);

  // Who to show. The account holder only when they can take part (a parent on a children's event never sees themself);
  // children always on events that admit children, even if too young, so the family can see why.
  const kidsWelcome = childrenWelcome(edition);
  const self = entries.find((e) => e.person.isSelf);
  const selfState = self ? selfEligibility(edition, self.person, !!self.registration) : "ineligible";
  const shown = entries
    .filter((e) => (e.person.isSelf ? selfState === "eligible" : kidsWelcome || !!e.registration))
    .map((e, i) => ({ e, i, ok: canSelect(edition, e) }))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || a.i - b.i)   // the ones that can be ticked first, otherwise in the usual order
    .map((x) => x.e);
  const kids = shown.filter((e) => !e.person.isSelf);
  const selfShown = shown.some((e) => e.person.isSelf);
  const anyKidSelectable = kids.some((e) => canSelect(edition, e));

  const heading = selfShown && kids.length === 0 ? "How will you take part?" : !selfShown && kids.length > 0 ? "Which of your children are coming?" : "Who is attending, and how?";
  const intro = selfShown && kids.length === 0
    ? "Choose how you will take part."
    : "Tick each person attending, then choose how they will take part. It can be different for each one.";

  return (
    <div className="stack-4">
      <div>
        <h3>{heading}</h3>
        <p className="sm muted" style={{ marginTop: 4 }}>{intro}</p>
        <p className="xs muted" style={{ marginTop: 4 }}>{ageRangeText(edition)}</p>
      </div>

      {kidsWelcome && kids.length === 0 && !selfShown && !adding && (
        <div className="card stack-2">
          <b>Add your child to register them for {edition.name}</b>
          <p className="sm muted">{ageRangeText(edition)}. You'll need their date of birth. It only takes a minute.</p>
          <div><button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>Add a child</button></div>
        </div>
      )}

      {kidsWelcome && kids.length > 0 && !anyKidSelectable && !selfShown && !adding && (
        <div className="alert info" role="note">
          <div><b>None of your children can take part yet.</b> {edition.name} is {forAges(edition)}. Add a date of birth where one is missing, or add another child.</div>
        </div>
      )}

      {shown.map((e) => {
        const p = e.person;
        const name = `${p.given} ${p.family}`;
        const reg = e.registration;
        const locked = !!reg; // the way of taking part is fixed once a registration exists
        const group = `mode-${p.personId}`;
        const tooOld = p.hasDob && !ageAllowed(edition, p.ageAtEvent);
        const minAge = Math.max(edition.minAge ?? 0, MIN_REGISTRATION_AGE);
        const tooYoung = tooOld && p.ageAtEvent != null && p.ageAtEvent < minAge;
        const noDob = !reg && !p.hasDob;   // eligibility depends on age, so nobody can be ticked without a date of birth
        return (
          <div className="card mp stack-4" key={p.personId}>
            <label className="mp-head">
              <input type="checkbox" checked={e.selected && !tooOld && !noDob} disabled={tooOld || noDob} onChange={(ev) => onChange(p.personId, { selected: ev.target.checked, error: undefined })} />
              <Avatar>{initials(p.given)}</Avatar>
              <span>
                <b>{name}</b>{p.isSelf && " (you)"}{p.role && <span className={`badge ${p.isChild ? "b-info" : "b-event"}`} style={{ marginLeft: 8, verticalAlign: "middle" }}>{p.role}</span>}
                <span className="xs muted" style={{ display: "block" }}>{p.age != null ? (p.age === 1 ? "1 year old" : p.age < 1 ? "Under 1 year old" : `${p.age} years old`) : "Date of birth needed"}</span>
              </span>
            </label>

            {tooOld && (
              <p className="sm muted" role="note">{edition.name} is for people {tooYoung ? `aged ${minAge} and over` : `up to ${edition.maxAge} years old`}{p.isSelf ? "" : `, so ${p.given} can't take part`}.</p>
            )}

            {noDob && !p.isSelf && editingChild !== p.personId && (
              <div className="alert warn" role="note">
                <div><b>Add {p.given}'s date of birth to register them.</b> We check each child's age before they can be registered.{" "}
                  {p.dependant
                    ? <button type="button" className="link-btn" onClick={() => setEditingChild(p.personId)}>Add date of birth</button>
                    : <Link href="/profile#pf-kids">Open your profile</Link>}</div>
              </div>
            )}
            {editingChild === p.personId && p.dependant && (
              <AddDependantForm
                child={p.dependant}
                onDone={async () => {
                  await onDependantAdded();
                  setEditingChild(null);
                }}
                onCancel={() => setEditingChild(null)}
              />
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
      {selfState === "unknown" && (
        <SelfDob
          eventName={edition.name}
          onSave={async (iso) => {
            const err = await onSelfDob(iso);
            if (!err) setSelfDobAdded(true);
            return err;
          }}
        />
      )}
      {selfDobAdded && selfState === "ineligible" && (
        <p className="sm muted" role="note">{edition.name} is {forAges(edition)}, so you can't register yourself. You can still register your children.</p>
      )}

      {!kidsWelcome ? null : adding ? (
        <AddDependantForm
          onDone={async () => {
            await onDependantAdded();
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        (kids.length > 0 || selfShown) && <div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>+ Add a child</button></div>
      )}
    </div>
  );
}

/** For an account holder with no date of birth: a quiet way to add it here, if they are attending themself. */
function SelfDob({ eventName, onSave }: { eventName: string; onSave: (iso: string) => Promise<string | null> }) {
  const [open, setOpen] = useState(false);
  const [dob, setDob] = useState({ d: "", m: "", y: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open)
    return (
      <p className="sm muted">
        Attending {eventName} yourself? <button type="button" className="link-btn" onClick={() => setOpen(true)}>Add your date of birth</button>
      </p>
    );

  async function save() {
    const iso = toIsoDate(dob.d, dob.m, dob.y);
    if (!iso) return setError("Choose your date of birth from the calendar.");
    setBusy(true);
    setError(null);
    const err = await onSave(iso);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="card stack-4" style={{ background: "var(--surface-sunken)", boxShadow: "none" }}>
      <DateParts label="Your date of birth" required hint="We use it to check you can take part. You can only set it once, so check it carefully." value={dob} onChange={setDob} />
      <FormError message={error} />
      <div className="row">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}

/** "for ages 3–20", without the camp part. */
const forAges = (edition: PublicEdition) => ageRangeText(edition).split(" · ")[0].replace(/^For/, "for");
