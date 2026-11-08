"use client";

import { useEffect } from "react";
import { Avatar, FormError } from "@/components/Form";
import { api, friendlyError } from "@/lib/api";
import { formatLongDay, formatOrdinalRange, formatTime, initials } from "@/lib/format";
import type { Consent, ConsentKind, PublicEdition } from "@/lib/types";
import { isPhysical, type ConsentAnswers, type Entry } from "./model";

export type { ConsentAnswers };

const TICK = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);
const MEGAPHONE = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
);

const names = (list: Entry[]) => {
  const n = list.map((e) => e.person.given);
  return n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
};
const words = ["Zero", "One", "Two", "Three", "Four"];

/**
 * The permissions step, laid out as the portal template does: one parent consent for all the children, the last-day pick-up
 * acknowledgement, then photos and videos child by child. The API still records its own consent kinds, so each card writes the
 * kinds it stands for: the parent consent is guardian authorisation plus emergency treatment, the pick-up card (or the plain
 * terms card when no child is attending in person) is the event terms.
 */
export function PermissionsStep({
  edition,
  entries,
  answers,
  setAnswers,
  errors,
  setError,
}: {
  edition: PublicEdition;
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

  const idOf = (e: Entry) => e.registration!.id;
  const has = (e: Entry, k: ConsentKind) => answers[idOf(e)]?.[k];

  /** Records one answer for one person, rolling the screen back if the server didn't keep it. */
  async function record(e: Entry, kind: ConsentKind, accepted: boolean) {
    const id = idOf(e);
    setError(id, null);
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], [kind]: accepted } }));
    try {
      await api.put(`/registration/${id}/consent/${kind}`, { accepted });
    } catch (err) {
      setAnswers((prev) => {
        const { [kind]: _removed, ...rest } = prev[id] ?? {};
        return { ...prev, [id]: rest };
      });
      setError(id, friendlyError(err));
    }
  }
  const recordAll = (list: Entry[], kinds: ConsentKind[], accepted: boolean) => list.flatMap((e) => kinds.map((k) => record(e, k, accepted)));

  const kids = entries.filter((e) => e.person.isChild);
  const adults = entries.filter((e) => !e.person.isChild);
  const inPerson = kids.some((e) => isPhysical(e.mode));
  const everyone = (list: Entry[], kinds: ConsentKind[]) => list.length > 0 && list.every((e) => kinds.every((k) => has(e, k) === true));

  const lastDay = edition.days.length > 0 ? edition.days[edition.days.length - 1].day : edition.endsOn;
  const before = edition.pickupWindow ? formatTime(edition.pickupWindow.end) : null;

  type Card = { key: string; done: boolean; render: (n: number) => React.ReactNode };
  const cards: Card[] = [];

  if (kids.length > 0) {
    const kinds: ConsentKind[] = ["GuardianAuthorization", "MedicalEmergency"];
    const done = everyone(kids, kinds);
    cards.push({
      key: "parent",
      done,
      render: (n) => (
        <section className={`card perm-card stack-4 ${done ? "done" : ""}`} aria-labelledby="perm-parent">
          <header className="perm-h">
            <span className="perm-n" aria-hidden="true">{n}</span>
            <div><h3 id="perm-parent">Parent Consent for {edition.name}</h3></div>
            <span className="perm-ok">{TICK} Done</span>
          </header>
          <div className="consent-text" role="region" aria-label={`Parent Consent for ${edition.name}`}>
            <p><b>{kids.length === 1 ? "Child:" : "Children:"}</b> {kids.map((e) => `${e.person.given} ${e.person.family}`).join(", ")}</p>
            <p>
              As the parent/legal guardian of {kids.length === 1 ? "the child" : "the children"} named above, by submitting this form, I hereby give my consent for my {kids.length === 1 ? "child" : "children"} to participate
              in the {edition.name} organized by The New and Living Way Church taking place from {formatOrdinalRange(edition.startsOn, edition.endsOn)}.
            </p>
            <p>
              I understand that my {kids.length === 1 ? "child" : "children"} will be involved in camp activities and I acknowledge the potential risks associated with these activities. I affirm that my {kids.length === 1 ? "child is" : "children are"} physically and emotionally fit to participate in camp activities.
            </p>
            <p>I further consent to the following:</p>
            <ol>
              <li><b>Emergency Medical Treatment:</b> In the event of an emergency, I authorize the camp authorities to seek first aid medical treatment for my {kids.length === 1 ? "child" : "children"}.</li>
              <li><b>Liability Waiver:</b> I release The New and Living Way Church and its volunteers from any liability for injuries or losses sustained by my {kids.length === 1 ? "child" : "children"} during camp activities, except in cases of gross negligence or willful misconduct.</li>
            </ol>
          </div>
          <label className="opt perm-confirm">
            <input type="checkbox" checked={done} onChange={(ev) => void Promise.all(recordAll(kids, kinds, ev.target.checked))} />
            <span className="sm"><b>I am the parent or legal guardian of {names(kids)}, and I give this consent.</b></span>
          </label>
        </section>
      ),
    });
  }

  // The event terms: shown as the last-day pick-up notice when a child is attending in person, plainly otherwise.
  if (kids.length > 0 && inPerson) {
    const done = everyone(kids, ["Terms"]);
    cards.push({
      key: "pickup",
      done,
      render: (n) => (
        <section className={`card perm-card stack-4 ${done ? "done" : ""}`} aria-labelledby="perm-pickup">
          <header className="perm-h">
            <span className="perm-n" aria-hidden="true">{n}</span>
            <div><h3 id="perm-pickup">Last day pick-up</h3></div>
            <span className="perm-ok">{TICK} Done</span>
          </header>
          <div className="perm-callout">
            <span className="perm-ico">{MEGAPHONE}</span>
            <p>On the last day, <b>{formatLongDay(lastDay)}</b>, all parents and guardians must come to pick up their children{before ? <> <b>before {before}</b></> : null}.</p>
          </div>
          <label className="opt perm-confirm">
            <input type="checkbox" checked={done} onChange={(ev) => void Promise.all(recordAll(kids, ["Terms"], ev.target.checked))} />
            <span className="sm"><b>I understand.</b></span>
          </label>
        </section>
      ),
    });
  }

  const termsFor = kids.length > 0 && inPerson ? adults : entries;
  if (termsFor.length > 0) {
    const done = everyone(termsFor, ["Terms"]);
    cards.push({
      key: "terms",
      done,
      render: (n) => (
        <section className={`card perm-card stack-4 ${done ? "done" : ""}`} aria-labelledby="perm-terms">
          <header className="perm-h">
            <span className="perm-n" aria-hidden="true">{n}</span>
            <div><h3 id="perm-terms">Event terms</h3></div>
            <span className="perm-ok">{TICK} Done</span>
          </header>
          <div className="consent-text" role="region" aria-label="Event terms"><p>I accept the terms for taking part in {edition.name}.</p></div>
          <label className="opt perm-confirm">
            <input type="checkbox" checked={done} onChange={(ev) => void Promise.all(recordAll(termsFor, ["Terms"], ev.target.checked))} />
            <span className="sm"><b>I accept the event terms{termsFor.length > 1 ? ` for ${names(termsFor)}` : ""}.</b></span>
          </label>
        </section>
      ),
    });
  }

  if (kids.length > 0) {
    const done = kids.every((e) => has(e, "Media") !== undefined);
    cards.push({
      key: "photos",
      done,
      render: (n) => (
        <section className={`card perm-card perm-photo stack-4 ${done ? "done" : ""}`} aria-labelledby="perm-photos">
          <header className="perm-h">
            <span className="perm-n" aria-hidden="true">{n}</span>
            <div>
              <h3 id="perm-photos">Photos and videos</h3>
              <span className="xs muted">
                As a parent or guardian, do you consent to the use of clear, individual pictures and videos of your {kids.length === 1 ? "child" : "child or children"} for event publicity? Saying no never stops registration. Saying no means no solo photos, but your child may still appear in group photos.
              </span>
            </div>
            <span className="perm-ok">{TICK} Done</span>
          </header>
          <div className="ph-rows">
            {kids.map((e) => {
              const value = has(e, "Media");
              const name = `${e.person.given} ${e.person.family}`;
              const group = `Media-${idOf(e)}`;
              return (
                <div className="ph-row" key={idOf(e)}>
                  <div className="row" style={{ flex: 1, minWidth: 150 }}>
                    <Avatar>{initials(e.person.given)}</Avatar>
                    <div><b>{name}</b>{e.person.age != null && <div className="xs muted">{e.person.age === 1 ? "1 year old" : `${e.person.age} years old`}</div>}</div>
                  </div>
                  <div className="ph-choice" role="radiogroup" aria-label={`Photo and video for ${name}`}>
                    <label><input type="radio" name={group} value="yes" checked={value === true} onChange={() => void record(e, "Media", true)} /><span>I consent</span></label>
                    <label><input type="radio" name={group} value="no" checked={value === false} onChange={() => void record(e, "Media", false)} /><span>I do not consent</span></label>
                  </div>
                  <span className="ph-st">
                    <span className="badge b-warn st-none">⏱ Not answered</span>
                    <span className="badge b-ok st-yes">✓ Consent given</span>
                    <span className="badge b-neutral st-no">Declined</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ),
    });
  }

  const doneCount = cards.filter((c) => c.done).length;
  const who = kids.length > 0 ? names(kids) : names(entries);

  return (
    <div className="stack-4">
      <div className="row between">
        <div>
          <h3>Permissions</h3>
          <p className="sm muted" style={{ marginTop: 4 }}>
            For {who}. {words[cards.length] ?? cards.length} quick {cards.length === 1 ? "thing" : "things"} to confirm. Nothing is pre-selected.
          </p>
        </div>
        <div className="perm-progress">
          <span className="sm bold" role="status">{doneCount} of {cards.length} done</span>
          <div className="meter" aria-hidden="true"><i className="m-sold" style={{ width: cards.length ? `${(doneCount / cards.length) * 100}%` : 0 }} /></div>
        </div>
      </div>

      {cards.map((c, i) => <div key={c.key}>{c.render(i + 1)}</div>)}

      {entries.map((e) => errors[idOf(e)] && <FormError key={idOf(e)} message={`${e.person.given}: ${errors[idOf(e)]}`} />)}
    </div>
  );
}
