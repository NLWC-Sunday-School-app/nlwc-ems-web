"use client";

import { useState, type FormEvent } from "react";
import { api, friendlyError } from "@/lib/api";
import type { Contact } from "@/lib/types";
import { FormError, FormNotice, TextField } from "./Form";

/** One emergency contact for a person: yourself (<c>/emergency-contact</c>) or a child (<c>/dependant/{id}/emergency-contact</c>). */
export function EmergencyContactForm({ path, initial, onSaved, title = "Emergency contact" }: { path: string; initial?: Contact | null; onSaved?: (c: Contact) => void; title?: string }) {
  const [c, setC] = useState<Contact>({ fullName: initial?.fullName ?? "", relationship: initial?.relationship ?? "", phone: initial?.phone ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      await api.put(path, { fullName: c.fullName.trim(), relationship: c.relationship.trim(), phone: c.phone.trim() });
      setSaved("Emergency contact saved.");
      onSaved?.(c);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack-4" onSubmit={submit}>
      <div>
        <h3>{title}</h3>
        <p className="xs muted">Someone we can reach who is not at the venue.</p>
      </div>
      <FormError message={error} />
      <FormNotice message={saved} />
      <div className="grid g2">
        <TextField label="Full name" required maxLength={100} value={c.fullName} onChange={(e) => setC({ ...c, fullName: e.target.value })} />
        <TextField label="Relationship" required maxLength={100} placeholder="Aunt, neighbour…" value={c.relationship} onChange={(e) => setC({ ...c, relationship: e.target.value })} />
        <TextField label="Phone" type="tel" autoComplete="tel" required hint="For example 0803 123 4567." value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
      </div>
      <div><button className="btn btn-secondary btn-sm" disabled={busy}>{busy ? "Saving…" : initial ? "Update contact" : "Save contact"}</button></div>
    </form>
  );
}
