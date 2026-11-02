"use client";

import { useState, type FormEvent } from "react";
import { ChildEmergency, Collectors } from "@/components/ChildContacts";
import { Avatar, DateParts, FormError, FormNotice, Loading, SelectField, TextAreaField, TextField } from "@/components/Form";
import { api, friendlyError } from "@/lib/api";
import { RELATIONSHIP_LABEL, ageOn, formatShortDate, initials, toIsoDate } from "@/lib/format";
import type { AddDependant, Created, Dependant, Gender, GuardianRelationship } from "@/lib/types";

/** The Dependants card on the profile page: the children and teenagers under 18 this person is a parent or guardian of. */
export function Dependants({ kids, loading, error, reload }: { kids: Dependant[] | null; loading: boolean; error: string | null; reload: () => Promise<void> | void }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="card" id="pf-kids">
      <div className="card-h">
        <div>
          <h2>Dependants</h2>
          <div className="xs muted">Children and teenagers under 18 you are a parent or guardian of</div>
        </div>
        {!adding && <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>+ Add dependant</button>}
      </div>

      {adding && (
        <AddDependantForm
          onDone={async () => {
            setAdding(false);
            await reload();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <FormError message={error} />
      {loading && !kids && <Loading />}
      {kids && kids.length === 0 && !adding && <p className="muted sm">No dependants added yet. Add a child to register them for an event.</p>}
      <div className="stack-4">
        {kids?.map((k, i) => (
          <div key={k.personId} className="stack-4">
            {i > 0 && <hr className="divider" />}
            <DependantRow child={k} onRemoved={reload} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddDependantForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
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
    <form className="card stack-4" onSubmit={submit} style={{ background: "var(--surface-sunken)", boxShadow: "none", marginBottom: "var(--space-4)" }}>
      <h3>Add a dependant</h3>
      <FormError message={error} />
      <div className="grid g2">
        <TextField label="First name" required maxLength={100} value={f.given} onChange={(e) => setF({ ...f, given: e.target.value })} />
        <TextField label="Last name" required maxLength={100} value={f.family} onChange={(e) => setF({ ...f, family: e.target.value })} />
        <DateParts label="Date of birth" required hint="They must be under 18. It can't be changed later without a review." error={errors.dob} value={dob} onChange={setDob} />
        <SelectField label="Your relationship" value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value as GuardianRelationship })}>
          {Object.entries(RELATIONSHIP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
        <SelectField label="Gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value as Gender })}>
          <option value="">Select</option>
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
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save dependant"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function DependantRow({ child, onRemoved }: { child: Dependant; onRemoved: () => void }) {
  const [panel, setPanel] = useState<"contacts" | "remove" | null>(null);
  const age = child.dateOfBirth ? ageOn(child.dateOfBirth) : null;
  const panelId = `child-${child.personId}`;
  const toggle = (p: "contacts" | "remove") => setPanel((cur) => (cur === p ? null : p));

  return (
    <section className="dep stack-4" aria-label={`${child.givenName} ${child.familyName}`}>
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
        <div className="row">
          <button type="button" className="btn btn-secondary btn-sm" aria-expanded={panel === "contacts"} aria-controls={panelId} onClick={() => toggle("contacts")}>
            Pick-up and contacts
          </button>
          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={panel === "remove"} aria-controls={panelId} onClick={() => toggle("remove")}>
            Remove
          </button>
        </div>
      </div>
      {panel && (
        <div id={panelId} className="stack-6">
          {panel === "contacts" ? (
            <>
              <Collectors childId={child.personId} />
              <hr className="divider" />
              <ChildEmergency childId={child.personId} />
            </>
          ) : (
            <RemoveDependant child={child} onRemoved={onRemoved} onCancel={() => setPanel(null)} />
          )}
        </div>
      )}
    </section>
  );
}

function RemoveDependant({ child, onRemoved, onCancel }: { child: Dependant; onRemoved: () => void; onCancel: () => void }) {
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
  return (
    <form className="stack-4" onSubmit={submit}>
      <h3>Remove {child.givenName}?</h3>
      <p className="sm muted">This ends your guardianship record for {child.givenName}. The record itself is kept for safeguarding. Tell us why.</p>
      <FormError message={error} />
      <TextAreaField label="Reason" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="row">
        <button className="btn btn-danger btn-sm" disabled={busy || !reason.trim()}>{busy ? "Removing…" : `Remove ${child.givenName}`}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Keep</button>
      </div>
    </form>
  );
}
