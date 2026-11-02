"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell, GoogleButton } from "@/components/AuthShell";
import { FormError, PasswordField, TextField } from "@/components/Form";
import { errorCode, friendlyError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { safeNext } from "@/lib/format";
import { googleErrorMessage } from "@/lib/googleErrors";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Google sends people back here with ?error=<code> when it could not sign them in.
  const [error, setError] = useState<string | null>(googleErrorMessage(params.get("error")));
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      const code = errorCode(err);
      setError(
        code === "invalid_credentials" ? "That email and password don't match. Check them and try again."
        : code === "locked" ? "Too many attempts. Wait a few minutes before trying again."
        : friendlyError(err),
      );
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome to NLWC Events" intro="Register, choose how you'll take part, and keep your family's details in one place.">
      <form className="stack-4" onSubmit={submit} noValidate={false}>
        <FormError message={error} />
        <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
      </form>
      <GoogleButton next={next} />
      <p className="center sm">
        Don't have an account? <Link className="bold" href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
      </p>
    </AuthShell>
  );
}
