"use client";

import { useState, type FormEvent } from "react";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { Avatar, DateParts, FormError, FormNotice, Loading, SelectField, TextAreaField, TextField } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { api, friendlyError } from "@/lib/api";
import { RELATIONSHIP_LABEL, ageOn, formatShortDate, initials, toIsoDate } from "@/lib/format";
import type { AddDependant, Collector, Contact, Created, Dependant, Gender, GuardianRelationship } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";

export default function ChildrenPage() {
  return (
    <RequireAuth>
      <ChildrenScreen />
    </RequireAuth>
  );
}

function ChildrenScreen() {
  const { data: kids, loading, error, reload } = useLoad(() => api.get<Dependant[]>("/dependant"));
  const [adding, setAdding] = useState(false);

  return (
    <div className="container page-pad stack-6">
      <div className="row between">
        <div>
          <h1>Children</h1>
          <p className="muted sm" style={{ marginTop: 4 }}>Children aged 0–12 you are a parent or guardian of. From 13 they have their own profile.</p>
        </div>
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add a child</button>}
      </div>

      {adding && (
        <AddChildForm
          onDone={async () => {
            setAdding(false);
            await reload();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <FormError message={error} />
      {loading && !kids && <Loading />}
      {kids && kids.length === 0 && !adding && (
        <div className="empty">
          <h3>No children added yet</h3>
          <p className="muted sm">Add a child to register them for an event.</p>
        </div>
      )}
      <div className="stack-4">
        {kids?.map((k) => <ChildCard key={k.personId} child={k} onRemoved={reload} />)}
      </div>
    </div>
  );
}

function AddChildForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ given: "", family: "", gender: "" as Gender | "", relationship: "Parent" as GuardianRelationship, confirm: false });
  const [dob, setDob] = useState({ d: "", m: "", y: "" });
  const [errors, setErrors] = useState<{ dob?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const iso = toIsoDate(dob.d, dob.m, dob.y);
    const found: typeof errors = {};
    if (!iso) found.dob = "Enter a real date, for example 14 / 03 / 2017.";
    if (!f.confirm) found.confirm = "Please confirm you may register this child.";
    setErrors(found);
    setError(null);
    if (!iso || found.confirm) return;

    const body: AddDependant = { givenName: f.given.trim(), familyName: f.family.trim(), dateOfBirth: iso, gender: f.gender || undefined, relationship: f.relationship };
    setBusy(true);
    try {
      await api.post<Created>("/dependant", body);
      onDone();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <form className="card stack-4" onSubmit={submit} style={{ background: "var(--surface-sunken)" }}>
      <h2>Add a child</h2>
      <FormError message={error} />
      <div className="grid g2">
        <TextField label="First name" required maxLength={100} value={f.given} onChange={(e) => setF({ ...f, given: e.target.value })} />
        <TextField label="Last name" required maxLength={100} value={f.family} onChange={(e) => setF({ ...f, family: e.target.value })} />
        <DateParts label="Date of birth" required hint="Children must be 12 or under. It can't be changed later without a review." error={errors.dob} value={dob} onChange={setDob} />
        <SelectField label="Your relationship" value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value as GuardianRelationship })}>
          {Object.entries(RELATIONSHIP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
        <SelectField label="Gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value as Gender })}>
          <option value="">Prefer not to say</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </SelectField>
      </div>
      <div className="stack-2">
        <label className="opt">
          <input type="checkbox" checked={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.checked })} aria-describedby={errors.confirm ? "confirm-err" : undefined} />
          <span className="sm">I am this child's parent or legal guardian and may register them for events.</span>
        </label>
        {errors.confirm && <span className="err" id="confirm-err">{errors.confirm}</span>}
      </div>
      <div className="row">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save child"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ChildCard({ child, onRemoved }: { child: Dependant; onRemoved: () => void }) {
  const [open, setOpen] = useState(false);
  const age = child.dateOfBirth ? ageOn(child.dateOfBirth) : null;
  const panel = `child-${child.personId}`;

  return (
    <section className="card stack-4" aria-label={`${child.givenName} ${child.familyName}`}>
      <div className="row between">
        <div className="row">
          <Avatar>{initials(child.givenName)}</Avatar>
          <div>
            <b>{child.givenName} {child.familyName}</b>
            <div className="xs muted">
              {child.dateOfBirth && <>Born {formatShortDate(child.dateOfBirth)} · age {age}</>}
              {child.gender && <> · {child.gender}</>} · {RELATIONSHIP_LABEL[child.relationship] ?? child.relationship}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
          {open ? "Hide details" : "Pick-up and contacts"}
        </button>
      </div>
      {open && (
        <div id={panel} className="stack-6">
          <hr className="divider" />
          <Collectors childId={child.personId} />
          <hr className="divider" />
          <ChildEmergency childId={child.personId} />
          <hr className="divider" />
          <RemoveChild child={child} onRemoved={onRemoved} />
        </div>
      )}
    </section>
  );
}

function ChildEmergency({ childId }: { childId: string }) {
  const { data, loading } = useLoad(() => api.get<Contact | null>(`/dependant/${childId}/emergency-contact`), [childId]);
  if (loading && data === undefined) return <Loading />;
  return <EmergencyContactForm path={`/dependant/${childId}/emergency-contact`} initial={data} title="Emergency contact for this child" key={data?.phone ?? "none"} />;
}

function Collectors({ childId }: { childId: string }) {
  const { data: collectors, loading, error, reload } = useLoad(() => api.get<Collector[]>(`/dependant/${childId}/collector`), [childId]);
  const [adding, setAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function remove(id: string) {
    setRemoveError(null);
    try {
      await api.del(`/dependant/${childId}/collector/${id}`);
      await reload();
    } catch (e) {
      setRemoveError(friendlyError(e));
    }
  }

  return (
    <div className="stack-4">
      <div className="row between">
        <div>
          <h3>Who may pick up</h3>
          <p className="xs muted">A pass alone never releases a child. Only people on this list can collect them.</p>
        </div>
        {!adding && <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>+ Add a person</button>}
      </div>
      <FormError message={error ?? removeError} />
      {loading && !collectors && <Loading />}
      {collectors?.length === 0 && !adding && <p className="sm muted">Nobody added yet.</p>}
      {collectors?.map((c) => (
        <div className="opt" key={c.collectorId} style={{ cursor: "default" }}>
          <div style={{ flex: 1 }}>
            <b>{c.fullName}</b> · {c.relationship}
            <div className="xs muted">{c.phone} · {c.validDays?.length ? c.validDays.map(formatShortDate).join(", ") : "Every day"}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => remove(c.collectorId)} aria-label={`Remove ${c.fullName}`}>Remove</button>
        </div>
      ))}
      {adding && (
        <AddCollector
          childId={childId}
          onDone={async () => {
            setAdding(false);
            await reload();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function AddCollector({ childId, onDone, onCancel }: { childId: string; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: "", relationship: "", phone: "", specific: false });
  const [days, setDays] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const picked = [...new Set(days.filter(Boolean))].sort();
    if (f.specific && picked.length === 0) {
      setError("Choose at least one day, or switch to every day.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post<Created>(`/dependant/${childId}/collector`, { fullName: f.name.trim(), relationship: f.relationship.trim(), phone: f.phone.trim(), validDays: f.specific ? picked : null });
      onDone();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <form className="card stack-4" onSubmit={submit} style={{ background: "var(--surface-sunken)", boxShadow: "none" }}>
      <h4>Add a person</h4>
      <FormError message={error} />
      <div className="grid g2">
        <TextField label="Full name" required maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <TextField label="Relationship" required maxLength={100} placeholder="Mother, uncle…" value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })} />
        <TextField label="Phone" type="tel" required hint="For example 0805 123 1180." value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <fieldset className="hc-q" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="lbl">When can they collect?</legend>
        <div className="stack-2">
          <label className="opt"><input type="radio" name={`when-${childId}`} checked={!f.specific} onChange={() => setF({ ...f, specific: false })} /><span>Every day</span></label>
          <label className="opt"><input type="radio" name={`when-${childId}`} checked={f.specific} onChange={() => setF({ ...f, specific: true })} /><span>Only on specific days</span></label>
        </div>
      </fieldset>
      {f.specific && (
        <div className="stack-2">
          {days.map((d, i) => (
            <div className="row" key={i}>
              <input className="input" type="date" aria-label={`Day ${i + 1}`} value={d} onChange={(e) => setDays(days.map((x, j) => (j === i ? e.target.value : x)))} style={{ maxWidth: 220 }} />
              {days.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDays(days.filter((_, j) => j !== i))}>Remove day</button>}
            </div>
          ))}
          <div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setDays([...days, ""])}>+ Add another day</button></div>
        </div>
      )}
      <div className="row">
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save person"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function RemoveChild({ child, onRemoved }: { child: Dependant; onRemoved: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/dependant/${child.personId}/remove`, { reason: reason.trim() });
      setNotice(`${child.givenName} was removed from your list.`);
      onRemoved();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (notice) return <FormNotice message={notice} />;
  if (!confirming)
    return <div><button className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>Remove {child.givenName}</button></div>;
  return (
    <form className="stack-4" onSubmit={submit}>
      <h3>Remove {child.givenName}?</h3>
      <p className="sm muted">This ends your guardianship record for {child.givenName}. The record itself is kept for safeguarding. Tell us why.</p>
      <FormError message={error} />
      <TextAreaField label="Reason" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="row">
        <button className="btn btn-danger btn-sm" disabled={busy || !reason.trim()}>{busy ? "Removing…" : `Remove ${child.givenName}`}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Keep</button>
      </div>
    </form>
  );
}
