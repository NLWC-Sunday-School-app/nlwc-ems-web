"use client";

import { useEffect, useState, type FormEvent } from "react";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { Avatar, DateParts, FormError, FormNotice, Loading, SelectField, TextField } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { api, errorCode, friendlyError } from "@/lib/api";
import { ageOn, formatShortDate, initials, toIsoDate } from "@/lib/format";
import type { Gender, Profile } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileScreen />
    </RequireAuth>
  );
}

function ProfileScreen() {
  const { data: profile, loading, error, reload } = useLoad(() => api.get<Profile>("/profile"));
  const [f, setF] = useState({ given: "", middle: "", family: "", gender: "" as Gender | "", marital: "", country: "", city: "" });
  const [dob, setDob] = useState({ d: "", m: "", y: "" });
  const [dobError, setDobError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setF({ given: profile.givenName, middle: profile.middleName ?? "", family: profile.familyName, gender: profile.gender ?? "", marital: profile.maritalStatus ?? "", country: profile.country ?? "", city: profile.city ?? "" });
  }, [profile]);

  if (loading && !profile) return <div className="container page-pad"><Loading /></div>;
  if (!profile) return <div className="container page-pad"><FormError message={error ?? "We couldn't load your profile."} /></div>;

  const dobLocked = !!profile.dateOfBirth;

  async function save(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaved(null);
    setDobError(null);

    let dateOfBirth: string | null | undefined;
    if (!dobLocked && (dob.d || dob.m || dob.y)) {
      dateOfBirth = toIsoDate(dob.d, dob.m, dob.y);
      if (!dateOfBirth) {
        setDobError("Enter a real date, for example 14 / 03 / 1988.");
        return;
      }
    }

    setBusy(true);
    try {
      await api.put("/profile", {
        givenName: f.given.trim(),
        familyName: f.family.trim(),
        middleName: f.middle.trim() || null,
        gender: f.gender || null,
        maritalStatus: f.marital || null,
        country: f.country.trim() || null,
        city: f.city.trim() || null,
        // Sent only when it is being set for the first time; the API refuses a later change.
        dateOfBirth: dobLocked ? profile!.dateOfBirth : dateOfBirth,
      });
      setSaved("Your details are saved.");
      await reload();
    } catch (err) {
      if (errorCode(err) === "invalid_date_of_birth") setDobError(friendlyError(err));
      else setFormError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page-pad stack-6">
      <div>
        <h1>Profile</h1>
        <p className="muted sm" style={{ marginTop: 4 }}>Your own details. Your children are on the <a href="/children">Children</a> page.</p>
      </div>

      {profile.needsDateOfBirth && (
        <div className="alert warn" role="status">
          <div><b>Add your date of birth.</b>You need it before you can register for an event.</div>
        </div>
      )}

      <form className="card stack-4" onSubmit={save}>
        <div className="card-h">
          <div className="row">
            <Avatar>{initials(profile.givenName, profile.familyName)}</Avatar>
            <div>
              <h2>My details</h2>
              <div className="xs muted">
                {profile.email} {profile.emailVerified ? <span className="badge b-ok">✓ verified</span> : <span className="badge b-warn">⏱ not confirmed</span>}
              </div>
            </div>
          </div>
        </div>
        <FormError message={formError} />
        <FormNotice message={saved} />
        <div className="grid g2">
          <TextField label="First name" required maxLength={100} autoComplete="given-name" value={f.given} onChange={(e) => setF({ ...f, given: e.target.value })} />
          <TextField label="Other / middle names" maxLength={100} value={f.middle} onChange={(e) => setF({ ...f, middle: e.target.value })} />
          <TextField label="Last name" required maxLength={100} autoComplete="family-name" value={f.family} onChange={(e) => setF({ ...f, family: e.target.value })} />
          {dobLocked ? (
            <div className="field">
              <span className="lbl">Date of birth</span>
              <div className="row">
                <b>{formatShortDate(profile.dateOfBirth!)}</b>
                <span className="xs muted">· age {ageOn(profile.dateOfBirth!)}</span>
                <span className="badge b-neutral">🔒 locked</span>
              </div>
              <span className="hint">Your date of birth can only be set once because age bands and eligibility depend on it. To correct it, contact the team and we'll review it.</span>
            </div>
          ) : (
            <DateParts label="Date of birth" required hint="You can only set this once, so check it carefully." error={dobError} value={dob} onChange={setDob} />
          )}
          <SelectField label="Gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value as Gender })}>
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </SelectField>
          <SelectField label="Marital status" value={f.marital} onChange={(e) => setF({ ...f, marital: e.target.value })}>
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
          </SelectField>
          <TextField label="Country" maxLength={60} autoComplete="country-name" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
          <TextField label="City" maxLength={100} autoComplete="address-level2" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        </div>
        <div><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
      </form>

      <div className="card">
        <EmergencyContactForm path="/emergency-contact" initial={profile.emergencyContact} title="My emergency contact" />
      </div>
    </div>
  );
}
