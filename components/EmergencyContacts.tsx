"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FormError, Loading, TextField } from "@/components/Form";
import { api, friendlyError } from "@/lib/api";
import { useLoad } from "@/lib/useAsync";
import type { EmergencyContact } from "@/lib/types";

/** The most the API allows a family to name. */
export const MAX_EMERGENCY_CONTACTS = 5;

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/**
 * The family's emergency contacts: people to call about any of the children, not about one child in particular.
 * Used on the profile page and in the registration wizard. `onChange` reports the list each time it loads or changes.
 */
export function EmergencyContacts({ onChange, intro, heading = "h2" }: { onChange?: (contacts: EmergencyContact[]) => void; intro?: string; heading?: "h2" | "h3" }) {
  const contacts = useLoad(() => api.get<EmergencyContact[]>("/emergency-contacts"));
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const list = contacts.data ?? [];
  const Title = heading;

  useEffect(() => {
    if (contacts.data) onChange?.(contacts.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.data]);

  async function remove(c: EmergencyContact) {
    setError(null);
    try {
      await api.del(`/emergency-contacts/${c.id}`);
      setRemoving(null);
      await contacts.reload();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const full = list.length >= MAX_EMERGENCY_CONTACTS;

  return (
    <div className="card" id="pf-emergency">
      <div className="card-h">
        <div>
          <Title>Family emergency contacts</Title>
          <div className="xs muted">{intro ?? "People we can call about any of your children. They apply to your whole family."}</div>
        </div>
        {!adding && !full && <button type="button" className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setEditing(null); }}>+ Add contact</button>}
      </div>

      {adding && <ContactForm onDone={async () => { setAdding(false); await contacts.reload(); }} onCancel={() => setAdding(false)} />}

      <FormError message={error ?? contacts.error} />
      {contacts.loading && !contacts.data && <Loading />}
      {contacts.data && list.length === 0 && !adding && <p className="muted sm">No emergency contacts yet. Add at least one to register.</p>}
      {full && <p className="xs muted">A family can name up to {MAX_EMERGENCY_CONTACTS} contacts. Remove one to add another.</p>}

      <div className="stack-4">
        {list.map((c, i) => (
          <div key={c.id} className="stack-4">
            {i > 0 && <hr className="divider" />}
            <section className="dep stack-4" aria-label={c.fullName}>
              <div className="row between">
                <div>
                  <b>{c.fullName}</b>
                  <div className="xs muted">{c.relationship} · {c.phone}</div>
                </div>
                <div className="row">
                  <button type="button" className="btn btn-ghost btn-sm" aria-label={`Edit ${c.fullName}`} title="Edit" aria-expanded={editing === c.id} onClick={() => { setEditing(editing === c.id ? null : c.id); setRemoving(null); setAdding(false); }}>
                    <svg {...ICON}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger, #b42318)" }} aria-label={`Remove ${c.fullName}`} title="Remove" aria-expanded={removing === c.id} onClick={() => { setRemoving(removing === c.id ? null : c.id); setEditing(null); }}>
                    <svg {...ICON}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                  </button>
                </div>
              </div>
              {editing === c.id && <ContactForm contact={c} onDone={async () => { setEditing(null); await contacts.reload(); }} onCancel={() => setEditing(null)} />}
              {removing === c.id && (
                <div className="stack-4">
                  <p className="sm muted">Remove {c.fullName} from your family's emergency contacts?{list.length === 1 && " You'll need to add another before you can register."}</p>
                  <div className="row">
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(c)}>Remove {c.fullName}</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRemoving(null)}>Keep</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactForm({ contact, onDone, onCancel }: { contact?: EmergencyContact; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ fullName: contact?.fullName ?? "", relationship: contact?.relationship ?? "", phone: contact?.phone ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = { fullName: f.fullName.trim(), relationship: f.relationship.trim(), phone: f.phone.trim() };
    try {
      if (contact) await api.put(`/emergency-contacts/${contact.id}`, body);
      else await api.post("/emergency-contacts", body);
      onDone();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <form className="card stack-4" onSubmit={submit} style={{ background: "var(--surface-sunken)", boxShadow: "none", marginBottom: "var(--space-4)" }}>
      <h3>{contact ? `Edit ${contact.fullName}` : "Add an emergency contact"}</h3>
      <FormError message={error} />
      <div className="grid g2">
        <TextField label="Full name" required maxLength={100} autoComplete="off" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
        <TextField label="Relationship to your family" required maxLength={100} hint="For example aunt, grandfather or family friend." autoComplete="off" value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })} />
        <TextField label="Phone number" required type="tel" inputMode="tel" autoComplete="off" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <div className="row">
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : contact ? "Save changes" : "Save contact"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
