"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar, FormError, Loading, TextAreaField } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { api, friendlyError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MODE_LABEL, TASK_LABEL, ageOn, initials } from "@/lib/format";
import { canCancel, editionOf, isEditable, isLive, whoMap, type Who } from "@/lib/registrations";
import type { Dependant, Profile, PublicEdition, Registration, Review } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

interface Data { profile: Profile; who: Record<string, Who>; regs: Registration[]; editions: PublicEdition[] }

function Dashboard() {
  const { me } = useAuth();
  const { data, loading, error, reload } = useLoad<Data>(async () => {
    const [profile, kids, regs, editions] = await Promise.all([
      api.get<Profile>("/profile"),
      api.get<Dependant[]>("/dependant"),
      api.get<Registration[]>("/registration"),
      api.get<PublicEdition[]>("/public/edition"),
    ]);
    return { profile, who: whoMap(profile, kids, (d) => ageOn(d)), regs: regs.filter(isLive), editions };
  });
  const [reviews, setReviews] = useState<Record<string, Review>>({});

  // What each editable registration still needs, as computed by the API.
  useEffect(() => {
    if (!data) return;
    let alive = true;
    Promise.all(data.regs.filter(isEditable).map((r) => api.get<Review>(`/registration/${r.id}/review`).then((v) => [r.id, v] as const).catch(() => null))).then((pairs) => {
      if (alive) setReviews(Object.fromEntries(pairs.filter((p): p is readonly [string, Review] => p !== null)));
    });
    return () => {
      alive = false;
    };
  }, [data]);

  if (loading && !data) return <div className="container page-pad"><Loading /></div>;
  if (!data) return <div className="container page-pad"><FormError message={error ?? "We couldn't load your events."} /></div>;

  const { profile, who, regs, editions } = data;
  const tasks = regs.filter(isEditable).flatMap((r) => (reviews[r.id]?.openTasks ?? []).map((t) => ({ reg: r, task: t })));
  const needsDob = profile.needsDateOfBirth;

  return (
    <div className="container page-pad stack-6">
      <div className="row between">
        <div>
          <h1>Hello, {profile.givenName}</h1>
          <p className="muted sm">Your events, your family and anything that needs you.</p>
        </div>
        <Link className="btn btn-primary" href="/events">Register for an event</Link>
      </div>

      {me && !me.emailVerified && (
        <div className="alert warn" role="status"><span aria-hidden="true">⏱</span><div><b>Confirm your email.</b>We sent you a link when you signed up. Open it to confirm {profile.email}.</div></div>
      )}

      {(tasks.length > 0 || needsDob) && (
        <div className="stack-2">
          <h2 className="h3">Needs your attention <span className="badge b-warn">{tasks.length + (needsDob ? 1 : 0)}</span></h2>
          {needsDob && (
            <div className="task"><div style={{ flex: 1 }}><b>Add your date of birth</b><div className="sm muted">You need it before you can register.</div></div><Link className="btn btn-primary btn-sm" href="/profile">Add it</Link></div>
          )}
          {tasks.map(({ reg, task }) => {
            const ed = editionOf(reg, editions);
            return (
              <div className="task" key={`${reg.id}-${task.code}`}>
                <div style={{ flex: 1 }}>
                  <b>{TASK_LABEL[task.code] ?? task.code}</b>
                  <div className="sm muted">{ed?.name ?? reg.reference} · {who[reg.personId]?.given ?? "Someone"}{task.blocking ? "" : " · optional"}</div>
                </div>
                {ed && <Link className={`btn btn-sm ${task.blocking ? "btn-primary" : "btn-secondary"}`} href={`/events/${ed.slug}/register`}>{task.blocking ? "Finish" : "Answer"}</Link>}
              </div>
            );
          })}
        </div>
      )}

      <div className="stack-2">
        <h2 className="h3">My registrations</h2>
        {regs.length === 0 && (
          <div className="empty"><h3>No registrations yet</h3><p className="muted sm">Pick an event to get started. You can register your children and yourself together.</p><Link className="btn btn-primary" href="/events">Browse events</Link></div>
        )}
        <div className="stack-4">
          {regs.map((r) => <RegistrationCard key={r.id} reg={r} who={who[r.personId]} edition={editionOf(r, editions)} review={reviews[r.id]} onChanged={reload} />)}
        </div>
      </div>
    </div>
  );
}

function RegistrationCard({ reg, who, edition, review, onChanged }: { reg: Registration; who?: Who; edition?: PublicEdition; review?: Review; onChanged: () => void }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const paid = edition?.capabilities.includes("PaidRegistration");

  async function cancel(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/registration/${reg.id}/cancel`, { reason: reason.trim() });
      onChanged();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <section className="card stack-4" aria-label={`${who?.name ?? "Registration"} ${edition?.name ?? ""}`}>
      <div className="row between">
        <div className="row">
          <Avatar>{initials(who?.given ?? "?")}</Avatar>
          <div>
            <b>{who?.name ?? "Registration"}</b>{who?.age != null && <span className="muted sm"> · {who.age}</span>}
            <div className="sm muted">{edition?.name ?? "Event"} · {MODE_LABEL[reg.participationMode]} · <span className="mono">{reg.reference}</span></div>
          </div>
        </div>
        {edition && isEditable(reg) && <Link className="btn btn-primary btn-sm" href={`/events/${edition.slug}/register`}>Continue</Link>}
      </div>
      <div className="axes">
        <div><b>Registration</b><StatusBadge state={reg.state} /></div>
        {paid && <div><b>Payment</b><span className="badge b-neutral">See event</span></div>}
        {review?.holdsPass && <div><b>Pass</b><span className="badge b-warn">⏱ Pending permission</span></div>}
      </div>
      {canCancel(reg) && !cancelling && <div><button className="btn btn-ghost btn-sm" onClick={() => setCancelling(true)}>Cancel registration</button></div>}
      {cancelling && (
        <form className="stack-4" onSubmit={cancel}>
          <FormError message={error} />
          <TextAreaField label="Why are you cancelling?" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="row">
            <button className="btn btn-danger btn-sm" disabled={busy || !reason.trim()}>{busy ? "Cancelling…" : "Cancel registration"}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelling(false)}>Keep it</button>
          </div>
        </form>
      )}
    </section>
  );
}
