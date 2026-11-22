"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormError, Loading } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { HealthStep, emptyHealth, toHealthInput, type HealthAnswer } from "@/components/wizard/HealthStep";
import { PermissionsStep, type ConsentAnswers } from "@/components/wizard/PermissionsStep";
import { ContactsStep } from "@/components/wizard/ContactsStep";
import { ParticipantsStep } from "@/components/wizard/ParticipantsStep";
import { ReviewStep, type SubmitResult } from "@/components/wizard/ReviewStep";
import { ALL_STEPS, STEP_LABEL, active, canSelect, holderRole, isPhysical, joinNames, nearestStep, requiredConsentsGiven, stepFromDraft, stepsFor, type Entry, type Person, type StepKey } from "@/components/wizard/model";
import { ApiError, api, friendlyError } from "@/lib/api";
import { editionCodeOf } from "@/lib/editions";
import { MODE_LABEL, ageOn } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { Dependant, ParticipationMode, Profile, PublicEdition, Registration, Review, SubmitOutcome } from "@/lib/types";

export default function RegisterPage() {
  return (
    <RequireAuth>
      <Wizard />
    </RequireAuth>
  );
}

const EDITABLE = new Set(["Draft", "NeedsAction"]);

/** A dependant as a row of the wizard. Ages are worked out today (for display) and on the day the event starts (for the hints). */
const childPerson = (k: Dependant, start: Date): Person => ({
  personId: k.personId, given: k.givenName, family: k.familyName,
  age: k.dateOfBirth ? ageOn(k.dateOfBirth) : null, ageAtEvent: k.dateOfBirth ? ageOn(k.dateOfBirth, start) : null,
  isSelf: false, isChild: true, role: "Child", hasDob: !!k.dateOfBirth, dependant: k,
});
const DEAD = new Set(["Cancelled", "Rejected", "Expired"]);

function Wizard() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [edition, setEdition] = useState<PublicEdition>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [already, setAlready] = useState<{ person: Person; reg: Registration }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>();
  const [step, setStep] = useState<StepKey>("participants");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [health, setHealth] = useState<Record<string, HealthAnswer>>({});
  const [healthErrors, setHealthErrors] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState<ConsentAnswers>({});
  const [consentErrors, setConsentErrors] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [reviewing, setReviewing] = useState(false);
  const [results, setResults] = useState<Record<string, SubmitResult>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  // ---- load ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ed, profile, kids, regs] = await Promise.all([
          api.get<PublicEdition>(`/public/edition/${encodeURIComponent(slug)}`),
          api.get<Profile>("/profile"),
          api.get<Dependant[]>("/dependant"),
          api.get<Registration[]>("/registration"),
        ]);
        if (!alive) return;

        const start = new Date(`${ed.startsOn}T00:00:00`);
        const people: Person[] = [
          { personId: profile.personId, given: profile.givenName, family: profile.familyName, age: profile.dateOfBirth ? ageOn(profile.dateOfBirth) : null, ageAtEvent: profile.dateOfBirth ? ageOn(profile.dateOfBirth, start) : null, isSelf: true, isChild: false, role: holderRole(kids.map((k) => k.relationship)), hasDob: !!profile.dateOfBirth },
          ...kids.map((k) => childPerson(k, start)),
        ];
        // Registrations for this edition: by id once the API returns it, else by the edition code at the start of the reference.
        const mine = regs.filter((r) => !DEAD.has(r.state) && (ed.id ? r.editionId === ed.id : editionCodeOf(r.reference) === ed.code));

        const next: Entry[] = [];
        const settled: { person: Person; reg: Registration }[] = [];
        let resumeAt = ALL_STEPS.length - 1;
        for (const person of people) {
          const reg = mine.find((r) => r.personId === person.personId);
          if (reg && !EDITABLE.has(reg.state)) {
            settled.push({ person, reg });
            continue;
          }
          if (reg) resumeAt = Math.min(resumeAt, ALL_STEPS.indexOf(stepFromDraft((reg.draft as { step?: unknown } | undefined)?.step)));
          next.push({
            person,
            selected: !!reg,
            mode: reg?.participationMode ?? "Day",
            studio: !!(reg?.draft as { studio?: Record<string, boolean> } | undefined)?.studio?.[person.personId],
            registration: reg,
          });
        }
        const resuming = next.some((e) => e.registration);
        // Only one person can take part: tick them, so the family can go straight on.
        const selectable = next.filter((e) => canSelect(ed, e));
        if (!resuming && selectable.length === 1) selectable[0].selected = true;
        setEdition(ed);
        setProfile(profile);
        setEntries(next);
        setAlready(settled);
        setStep(resuming ? nearestStep(stepsFor(next.filter((e) => e.selected)), ALL_STEPS[resumeAt]) : "participants");
      } catch (e) {
        if (alive) setLoadError(e instanceof ApiError && e.status === 404 ? "We couldn't find this event." : friendlyError(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  /** After a dependant is added or edited from the Participants step: refresh everyone's details and append anyone new, leaving existing
   * choices alone. A newly added child who can take part is ticked, since they were added to be registered. */
  const addedDependant = useCallback(async () => {
    if (!edition) return;
    const kids = await api.get<Dependant[]>("/dependant");
    const start = new Date(`${edition.startsOn}T00:00:00`);
    setEntries((es) => {
      const byId = new Map(kids.map((k) => [k.personId, k]));
      const known = new Set([...es.map((e) => e.person.personId), ...already.map((a) => a.person.personId)]);
      const refreshed = es.map((e) => {
        const k = byId.get(e.person.personId);
        if (!k) return e;
        const updated: Entry = { ...e, person: childPerson(k, start) };
        // A date of birth was just added: tick them if it lets them take part.
        return !e.person.hasDob && updated.person.hasDob ? { ...updated, selected: canSelect(edition, updated) } : updated;
      });
      const fresh: Entry[] = kids.filter((k) => !known.has(k.personId)).map((k) => {
        const entry: Entry = { person: childPerson(k, start), selected: false, mode: "Day" as ParticipationMode, studio: false };
        return { ...entry, selected: canSelect(edition, entry) };
      });
      return [...refreshed, ...fresh];
    });
  }, [edition, already]);

  /** Sets the account holder's own date of birth (once only), then ticks them if that makes them eligible. Returns an error to show, or null. */
  const saveSelfDob = useCallback(async (iso: string): Promise<string | null> => {
    if (!profile || !edition) return "Please reload the page and try again.";
    try {
      await api.put("/profile", {
        givenName: profile.givenName, familyName: profile.familyName, middleName: profile.middleName ?? null,
        gender: profile.gender ?? null, maritalStatus: profile.maritalStatus ?? null, country: profile.country ?? null, city: profile.city ?? null,
        dateOfBirth: iso,
      });
    } catch (err) {
      return friendlyError(err);
    }
    setProfile({ ...profile, dateOfBirth: iso });
    const start = new Date(`${edition.startsOn}T00:00:00`);
    setEntries((es) => es.map((e) => {
      if (!e.person.isSelf) return e;
      const updated: Entry = { ...e, person: { ...e.person, hasDob: true, age: ageOn(iso), ageAtEvent: ageOn(iso, start) } };
      return { ...updated, selected: canSelect(edition, updated) };
    }));
    return null;
  }, [profile, edition]);

  const chosen = useMemo(() => entries.filter((e) => e.selected), [entries]);
  const live = useMemo(() => active(entries), [entries]);
  const steps = useMemo(() => stepsFor(chosen), [chosen]);
  const at = Math.max(0, steps.indexOf(step));

  const HEALTH_MESSAGE = "Some health questions still need an answer. They are marked in red above.";
  /** Records a health answer and clears that person's warning as soon as they change it; the form-level warning goes once none are left. */
  const answerHealth = useCallback((id: string, patch: Partial<HealthAnswer>) => {
    setHealth((h) => ({ ...h, [id]: { ...(h[id] ?? emptyHealth()), ...patch } }));
    if (!(id in healthErrors)) return;
    const { [id]: _removed, ...rest } = healthErrors;
    setHealthErrors(rest);
    if (Object.keys(rest).length === 0) setError((e) => (e === HEALTH_MESSAGE ? null : e));
  }, [healthErrors]);

  const patchEntry = useCallback((personId: string, patch: Partial<Entry>) => setEntries((es) => es.map((e) => (e.person.personId === personId ? { ...e, ...patch } : e))), []);

  /** Saves the step and each person's studio request, so a family can resume on another device. Failures are not fatal. */
  const saveDraft = useCallback(
    async (toStep: StepKey) => {
      await Promise.all(
        active(entries).map((e) =>
          api.put(`/registration/${e.registration!.id}/draft`, { draft: { step: toStep, studio: { [e.person.personId]: e.studio } } }).catch(() => undefined),
        ),
      );
    },
    [entries],
  );

  function goTo(s: StepKey) {
    setError(null);
    setStep(s);
    // Show the top of the wizard (title and progress), not wherever the previous step was scrolled to. The heading is focused for screen readers
    // without scrolling: it is visually hidden below the stepper, so letting focus() scroll would land the page beneath the title.
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    }, 0);
  }

  // Reviews are loaded fresh each time the review step opens.
  useEffect(() => {
    if (step !== "review" || live.length === 0) return;
    let alive = true;
    setReviewing(true);
    Promise.all(live.map((e) => api.get<Review>(`/registration/${e.registration!.id}/review`).then((r) => [e.registration!.id, r] as const)))
      .then((pairs) => alive && setReviews(Object.fromEntries(pairs)))
      .catch((e) => alive && setError(friendlyError(e)))
      .finally(() => alive && setReviewing(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, live.map((e) => e.registration!.id).join()]);

  // ---- actions ----
  async function startRegistrations(): Promise<boolean> {
    if (chosen.length === 0) {
      setError("Choose at least one person to register.");
      return false;
    }
    let allOk = true;
    const updated = [...entries];
    for (const [i, e] of updated.entries()) {
      if (!e.selected || e.registration) continue;
      if (!edition?.id) {
        updated[i] = { ...e, error: "This event can't be registered online just yet. Please try again later." };
        allOk = false;
        continue;
      }
      try {
        const registration = await api.post<Registration>("/registration", { editionId: edition.id, personId: e.person.isSelf ? undefined : e.person.personId, participationMode: e.mode });
        updated[i] = { ...e, registration, error: undefined };
      } catch (err) {
        updated[i] = { ...e, error: friendlyError(err) };
        allOk = false;
      }
    }
    setEntries(updated);
    return allOk;
  }

  async function saveHealth(): Promise<boolean> {
    const errs: Record<string, string> = {};
    for (const e of live.filter((x) => isPhysical(x.registration!.participationMode))) {
      const id = e.registration!.id;
      const input = toHealthInput(health[id] ?? emptyHealth());
      if (!input.ok) {
        errs[id] = input.message;
        continue;
      }
      try {
        await api.put(`/registration/${id}/health`, input.body);
      } catch (err) {
        errs[id] = friendlyError(err);
      }
    }
    setHealthErrors(errs);
    if (Object.keys(errs).length) setError(HEALTH_MESSAGE);
    return Object.keys(errs).length === 0;
  }

  const consentsReady = requiredConsentsGiven(live, consents);

  async function next() {
    setError(null);
    setBusy(true);
    try {
      if (step === "participants" && !(await startRegistrations())) return;
      if (step === "health" && !(await saveHealth())) return;
      const to = steps[at + 1] ?? "review";
      await saveDraft(to);
      goTo(to);
    } finally {
      setBusy(false);
    }
  }

  async function saveAndExit() {
    setBusy(true);
    if (step === "health") await saveHealth();
    await saveDraft(step);
    router.push("/dashboard");
  }

  async function restart(personId: string) {
    const e = entries.find((x) => x.person.personId === personId);
    if (!e?.registration) return;
    if (!window.confirm(`Start ${e.person.given}'s registration again? What you entered for them so far will be discarded.`)) return;
    try {
      await api.post(`/registration/${e.registration.id}/cancel`, { reason: "Changed how they take part" });
      patchEntry(personId, { registration: undefined, error: undefined });
    } catch (err) {
      patchEntry(personId, { error: friendlyError(err) });
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const out: Record<string, SubmitResult> = { ...results };
    // All together in one call, so the family gets one confirmation email that lists every child, not one email per child.
    const ids = live.map((e) => e.registration!.id).filter((id) => !out[id]?.ok && reviews[id]?.canSubmit);
    if (ids.length > 0) {
      try {
        const outcomes = await api.post<SubmitOutcome[]>("/registration/submit", { registrationIds: ids });
        for (const o of outcomes)
          out[o.registrationId] = o.ok ? { ok: true, state: o.state! } : { ok: false, message: friendlyError(new ApiError(400, o.code, o.message ?? "That didn't work. Please try again.")) };
      } catch (err) {
        for (const id of ids) out[id] = { ok: false, message: friendlyError(err) };
      }
    }
    setResults(out);
    setBusy(false);
  }

  // ---- render ----
  if (loadError) return <div className="container page-pad"><FormError message={loadError} /><p><Link href="/events">Back to events</Link></p></div>;
  if (!edition) return <div className="container page-pad"><Loading /></div>;

  if (edition.registrationWindow !== "Open" && live.length === 0)
    return (
      <div className="container page-pad narrow stack-4">
        <h1>{edition.name}</h1>
        <div className="alert warn" role="status"><div><b>Registration isn't open right now.</b>Check the event page for updates.</div></div>
        <Link className="btn btn-secondary" href={`/events/${edition.slug}`}>Back to the event</Link>
      </div>
    );

  const submittedAll = live.length > 0 && live.every((e) => results[e.registration!.id]?.ok);
  if (submittedAll)
    return (
      <div className="container page-pad"><div className="narrow stack-6">
        <div><span className="badge b-event">{edition.name}</span><h1 style={{ marginTop: 8 }}>You're registered</h1></div>
        <div className="card stack-4">
          {live.map((e) => (
            <div className="person-pill" key={e.registration!.id}>
              <div style={{ flex: 1 }}>
                <b>{e.person.given} {e.person.family}</b>
                <div className="xs muted">{MODE_LABEL[e.registration!.participationMode]} · reference <span className="mono">{e.registration!.reference}</span></div>
              </div>
              <StatusBadge state={results[e.registration!.id].state === "Confirmed" ? "Confirmed" : "Submitted"} />
            </div>
          ))}
          {Object.values(reviews).some((r) => r.holdsPass) && <div className="alert warn"><span aria-hidden="true">⏱</span><div>A pass stays "Pending" until the photo and video permission is answered. You can answer it any time from My events.</div></div>}
        </div>
        <div className="row"><Link className="btn btn-primary" href="/dashboard">Go to my events</Link><Link className="btn btn-secondary" href="/events">Browse events</Link></div>
      </div></div>
    );

  return (
    <div className="container page-pad">
      <div className="narrow stack-6" data-wiz data-event={edition.code.toLowerCase()} ref={wizardRef} style={{ scrollMarginTop: 16 }}>
        <div>
          <span className="badge b-event">{edition.name}</span>
          <h1 style={{ marginTop: 8 }}>Register</h1>
        </div>

        <ol className="stepper" aria-label="Progress">
          {steps.map((key, i) => (
            <li key={key} className={i < at ? "done" : i === at ? "cur" : undefined} aria-current={i === at ? "step" : undefined}>{STEP_LABEL[key]}</li>
          ))}
        </ol>

        {already.length > 0 && (
          <div className="card stack-2">
            <h3>Already registered</h3>
            {already.map(({ person, reg }) => (
              <div className="row between" key={reg.id}>
                <span><b>{person.given}</b> <span className="xs muted mono">{reg.reference}</span></span>
                <StatusBadge state={reg.state} />
              </div>
            ))}
          </div>
        )}

        <h2 className="sr" tabIndex={-1} ref={headingRef}>Step {at + 1} of {steps.length}: {STEP_LABEL[step]}</h2>

        {step === "participants" && <ParticipantsStep edition={edition} entries={entries} onChange={patchEntry} onRestart={restart} onDependantAdded={addedDependant} onSelfDob={saveSelfDob} />}
        {step === "health" && <HealthStep entries={live} answers={health} setAnswer={answerHealth} errors={healthErrors} />}
        {step === "pickup" && <ContactsStep />}
        {step === "permissions" && (
          <PermissionsStep
            edition={edition}
            entries={live}
            answers={consents}
            setAnswers={(f) => setConsents(f)}
            errors={consentErrors}
            setError={(id, m) => setConsentErrors((c) => (m ? { ...c, [id]: m } : Object.fromEntries(Object.entries(c).filter(([k]) => k !== id))))}
          />
        )}
        {step === "review" && <ReviewStep edition={edition} entries={live} reviews={reviews} results={results} loading={reviewing && Object.keys(reviews).length === 0} onGoTo={goTo} />}

        <FormError message={error} />

        {step === "participants" && chosen.length === 0 && (
          <p className="xs muted" id="choose-hint" role="status">Tick at least one person to continue.</p>
        )}

        {step === "permissions" && !consentsReady && (
          <p className="xs muted" id="consent-hint" role="status">Give the parent consent, confirm the pick-up notice and answer the photos and videos question for each child to continue.</p>
        )}

        <div className="wiz-actions">
          {at > 0 ? <button type="button" className="btn btn-secondary" onClick={() => goTo(steps[at - 1])} disabled={busy}>Back</button> : <span />}
          <div className="row">
            {live.length > 0 && <button type="button" className="btn btn-ghost" onClick={saveAndExit} disabled={busy}>Save draft and exit</button>}
            {step !== "review" ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={next}
                disabled={busy || (step === "participants" && chosen.length === 0) || (step === "permissions" && !consentsReady)}
                aria-describedby={step === "participants" && chosen.length === 0 ? "choose-hint" : step === "permissions" && !consentsReady ? "consent-hint" : undefined}
              >
                {busy ? "Saving…" : step === "participants" && chosen.length > 0 ? continueLabel(chosen.map((e) => e.person.isSelf ? "you" : e.person.given)) : "Continue"}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || reviewing || !live.some((e) => reviews[e.registration!.id]?.canSubmit && !results[e.registration!.id]?.ok)}>
                {busy ? "Submitting…" : "Submit registration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Continue with Tobi and Dara"; past three people, just the count, so the button stays short. */
function continueLabel(names: string[]): string {
  return names.length > 3 ? `Continue with ${names.length} people` : `Continue with ${joinNames(names)}`;
}
