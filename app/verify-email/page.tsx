"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Loading } from "@/components/Form";
import { api, errorCode, friendlyError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token");
  const { refresh, status } = useAuth();
  const [state, setState] = useState<"working" | "done" | "invalid" | "failed">(token ? "working" : "invalid");
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // A link is single-use, so guard against the effect running twice in development.
    if (!token || started.current) return;
    started.current = true;
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        setState("done");
        await refresh();
      })
      .catch((e) => {
        setState(errorCode(e) === "invalid_token" ? "invalid" : "failed");
        setMessage(friendlyError(e));
      });
  }, [token, refresh]);

  return (
    <AuthShell title="Confirm your email">
      {state === "working" && <Loading label="Confirming your email…" />}
      {state === "done" && (
        <>
          <div className="alert ok" role="status"><div><b>Your email is confirmed.</b>You're all set.</div></div>
          <Link className="btn btn-primary btn-block" href={status === "authenticated" ? "/dashboard" : "/login"}>{status === "authenticated" ? "Go to my events" : "Log in"}</Link>
        </>
      )}
      {state === "invalid" && (
        <div className="alert warn" role="alert">
          <div><b>This link isn't valid any more.</b>It may have expired or already been used. If you've already confirmed your email you can simply <Link href="/login">log in</Link>.</div>
        </div>
      )}
      {state === "failed" && <div className="alert bad" role="alert"><div>{message}</div></div>}
    </AuthShell>
  );
}
