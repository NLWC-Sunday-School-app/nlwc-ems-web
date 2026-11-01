"use client";

import { useState, type FormEvent } from "react";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { FormError, Loading, TextField } from "@/components/Form";
import { api, friendlyError } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import type { Collector, Contact, Created } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";

export function ChildEmergency({ childId }: { childId: string }) {
  const { data, loading } = useLoad(() => api.get<Contact | null>(`/dependant/${childId}/emergency-contact`), [childId]);
  if (loading && data === undefined) return <Loading />;
  return <EmergencyContactForm path={`/dependant/${childId}/emergency-contact`} initial={data} title="Emergency contact for this child" key={data?.phone ?? "none"} />;
}

export function Collectors({ childId }: { childId: string }) {
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
