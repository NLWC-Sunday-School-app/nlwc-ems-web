import Link from "next/link";
import type { ReactNode } from "react";

/** The narrow centred card the auth pages share. */
export function AuthShell({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="container page-pad">
      <div className="authx stack-4">
        <Link href="/events" className="authx-logo" aria-label="NLWC Events home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-light" src="/nlwc-logo-coloured.png" alt="The New & Living Way Church" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-dark" src="/nlwc-logo-white.png" alt="" aria-hidden="true" />
        </Link>
        <div>
          <h1>{title}</h1>
          {intro && <p className="muted" style={{ marginTop: 8 }}>{intro}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Google sign-in is not built on the API yet, so the button is shown disabled and says why. */
export function GoogleButton() {
  return (
    <>
      <div className="or"><span>Or</span></div>
      <button type="button" className="btn btn-secondary btn-block" disabled aria-disabled="true" title="Google sign-in is coming soon">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.4 42.6 14.5 48 24 48z" />
        </svg>
        Continue with Google <span className="muted xs">(coming soon)</span>
      </button>
    </>
  );
}
