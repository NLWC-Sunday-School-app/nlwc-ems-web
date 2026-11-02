"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { googleStartUrl } from "@/lib/googleErrors";

/** "Continue with Google". Shown only when the API says Google sign-in is switched on; it is a plain link because the
 * API runs the whole exchange and sets the same session cookie as a password login. */
export function GoogleButton({ next = "/dashboard" }: { next?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let live = true;
    api.get<{ google: boolean }>("/auth/providers").then((p) => live && setOn(p.google)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!on) return null;
  return (
    <>
      <div className="or"><span>Or</span></div>
      {/* A full navigation on purpose: the API redirects to Google and back. */}
      <a className="btn btn-secondary btn-block" href={googleStartUrl(next)}>
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.4 42.6 14.5 48 24 48z" />
        </svg>
        Continue with Google
      </a>
    </>
  );
}
