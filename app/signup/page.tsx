"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell, GoogleButton } from "@/components/AuthShell";
import { FormError, PasswordField, SelectField, TextField } from "@/components/Form";
import { api, friendlyError } from "@/lib/api";
import { safeNext } from "@/lib/format";
import type { Gender } from "@/lib/types";

const MIN_PASSWORD = 10;

export default function SignUpPage() {
  const next = safeNext(useSearchParams().get("next"));
  const [f, setF] = useState({ email: "", given: "", family: "", gender: "" as Gender | "", pw: "", pw2: "", terms: false });
  const [errors, setErrors] = useState<Partial<Record<"pw" | "pw2" | "terms" | "gender", string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (!f.gender) found.gender = "Select your gender.";
    if (f.pw.length < MIN_PASSWORD) found.pw = `Use at least ${MIN_PASSWORD} characters. A few random words works well.`;
    if (f.pw2 !== f.pw) found.pw2 = "The passwords don't match.";
    if (!f.terms) found.terms = "Accept the Terms of Use to continue.";
    setErrors(found);
    setError(null);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await api.post("/auth/signup", { email: f.email.trim(), password: f.pw, givenName: f.given.trim(), familyName: f.family.trim(), gender: f.gender });
      setSentTo(f.email.trim());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo)
    return (
      <AuthShell title="Check your email">
        <div className="alert ok" role="status">
          <div>
            <b>We've sent a message to {sentTo}.</b>
            Open it and tap the link to confirm your address. If you already have an account with this email, the message will say so.
          </div>
        </div>
        <Link className="btn btn-primary btn-block" href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}>Go to log in</Link>
      </AuthShell>
    );

  return (
    <AuthShell title="Create an account">
      <form className="stack-4" onSubmit={submit}>
        <FormError message={error} />
        <TextField label="Email" type="email" autoComplete="email" required value={f.email} onChange={(e) => set("email", e.target.value)} />
        <div className="two">
          <TextField label="First name" autoComplete="given-name" required maxLength={100} value={f.given} onChange={(e) => set("given", e.target.value)} />
          <TextField label="Last name" autoComplete="family-name" required maxLength={100} value={f.family} onChange={(e) => set("family", e.target.value)} />
        </div>
        <SelectField label="Gender" required value={f.gender} error={errors.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
          <option value="" disabled>Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </SelectField>
        <PasswordField label="Password" autoComplete="new-password" required hint={`At least ${MIN_PASSWORD} characters.`} error={errors.pw} value={f.pw} onChange={(e) => set("pw", e.target.value)} />
        <PasswordField label="Confirm password" autoComplete="new-password" required error={errors.pw2} value={f.pw2} onChange={(e) => set("pw2", e.target.value)} />
        <div className="stack-2">
          <label className="check">
            <input type="checkbox" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} aria-invalid={errors.terms ? true : undefined} aria-describedby={errors.terms ? "terms-err" : undefined} />
            <span>I accept the Terms of Use and have read the Privacy Notice <span className="mono muted xs">(wording pending approval)</span></span>
          </label>
          {errors.terms && <span className="err" id="terms-err">{errors.terms}</span>}
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <GoogleButton />
      <p className="center sm">Already have an account? <Link className="bold" href="/login">Log in</Link></p>
    </AuthShell>
  );
}
