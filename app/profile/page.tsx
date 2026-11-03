"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Dependants } from "@/components/Dependants";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { Avatar, DateParts, FormError, FormNotice, Loading, SelectField, TextField } from "@/components/Form";
import { LocalNav } from "@/components/LocalNav";
import { PlaceFields } from "@/components/PlaceFields";
import { RequireAuth } from "@/components/RequireAuth";
import { api, errorCode, friendlyError } from "@/lib/api";
import { ageOn, formatShortDate, initials, toIsoDate } from "@/lib/format";
import type { Dependant, Gender, Profile } from "@/lib/types";
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
  const [editing, setEditing] = useState(false);
  const kids = useLoad(() => api.get<Dependant[]>("/dependant"));

  const fromProfile = (p: Profile) => ({ given: p.givenName, middle: p.middleName ?? "", family: p.familyName, gender: p.gender ?? "", marital: p.maritalStatus ?? "", country: p.country ?? "", city: p.city ?? "" }) as typeof f;
  useEffect(() => {
    if (profile) setF(fromProfile(profile));
  }, [profile]);

  const sections = useMemo(
    () => [
      { id: "pf-details", label: "My details" },
      { id: "pf-emergency", label: "Emergency contact" },
      { id: "pf-kids", label: "Dependants", badge: kids.data?.length ?? null },
    ],
    [kids.data?.length],
  );

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
      setEditing(false);
      await reload();
    } catch (err) {
      if (errorCode(err) === "invalid_date_of_birth") setDobError(friendlyError(err));
      else setFormError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const cancel = () => {
    setF(fromProfile(profile!));
    setDob({ d: "", m: "", y: "" });
    setDobError(null);
    setFormError(null);
    setEditing(false);
  };
  const fullName = [profile.givenName, profile.middleName, profile.familyName].filter(Boolean).join(" ");
  const place = [profile.country, profile.city].filter(Boolean).join(" · ");
  const none = <span className="muted">Not added</span>;

  return (
    <div className="container page-pad stack-6">
      <div>
        <h1>Profile and family</h1>
        <p className="muted sm" style={{ marginTop: 4 }}>Your details and your children.</p>
      </div>

      {profile.needsDateOfBirth && (
        <div className="alert warn" role="status">
          <div><b>Add your date of birth.</b>You need it before you can register for an event.</div>
        </div>
      )}

      <div className="profile-layout">
        <LocalNav items={sections} />

        <div className="stack-6" style={{ minWidth: 0 }}>
          <form className="card" id="pf-details" onSubmit={save}>
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
              <div className="row">
                {editing ? (
                  <>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
                    <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
                  </>
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSaved(null); setEditing(true); }}>Edit details</button>
                )}
              </div>
            </div>

            <div className="stack-4">
              <FormError message={formError} />
              <FormNotice message={saved} />

              {!editing ? (
                <div className="detail-cols">
                  <dl className="kv">
                    <dt>Full name</dt><dd>{fullName}</dd>
                    <dt>Date of birth</dt>
                    <dd>
                      {profile.dateOfBirth ? <>{formatShortDate(profile.dateOfBirth)} <span className="xs muted">· age {ageOn(profile.dateOfBirth)}</span> <span className="badge b-neutral">🔒 locked</span></> : none}
                    </dd>
                    <dt>Gender</dt><dd>{profile.gender ?? none}</dd>
                    <dt>Marital status</dt><dd>{profile.maritalStatus ?? none}</dd>
                  </dl>
                  <dl className="kv">
                    <dt>Email</dt><dd>{profile.email}</dd>
                    <dt>Country / city</dt><dd>{place || none}</dd>
                  </dl>
                </div>
              ) : (
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
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </SelectField>
                  <SelectField label="Marital status" value={f.marital} onChange={(e) => setF({ ...f, marital: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </SelectField>
                  <PlaceFields country={f.country} city={f.city} onChange={(v) => setF({ ...f, ...v })} />
                </div>
              )}
            </div>
          </form>

          <div className="card" id="pf-emergency">
            <EmergencyContactForm path="/emergency-contact" initial={profile.emergencyContact} title="My emergency contact" optional />
          </div>

          <Dependants kids={kids.data ?? null} loading={kids.loading} error={kids.error} reload={kids.reload} />
        </div>
      </div>
    </div>
  );
}
