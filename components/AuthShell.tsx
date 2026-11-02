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

export { GoogleButton } from "./GoogleButton";
