"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.hasAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches));
  }, []);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("nlwc-theme", next);
    } catch {
      /* private mode: the choice just doesn't persist */
    }
    setDark(!dark);
  };
  return (
    <button type="button" className="theme-toggle btn btn-ghost" onClick={toggle} aria-pressed={dark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> : <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </svg>
    </button>
  );
}

export function Header() {
  const { status, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const on = (prefix: string) => (pathname === prefix || pathname.startsWith(`${prefix}/`) ? "on" : undefined);

  return (
    <header className="site-head">
      <div className="in">
        <Link href="/events" aria-label="NLWC Events home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-light" src="/nlwc-logo-coloured.png" alt="The New & Living Way Church, events home" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-dark" src="/nlwc-logo-white.png" alt="" aria-hidden="true" />
        </Link>
        <button type="button" className={`menu-btn${open ? " open" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mainNav" onClick={() => setOpen((v) => !v)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
        <nav aria-label="Main" id="mainNav" className={open ? "open" : undefined}>
          <Link href="/events" className={`hide-m ${on("/events") ?? ""}`}>Events</Link>
          {status === "authenticated" && (
            <>
              <Link href="/profile" className={`hide-m ${on("/profile") ?? ""}`}>Profile</Link>
              <Link href="/children" className={`hide-m ${on("/children") ?? ""}`}>Children</Link>
            </>
          )}
          <ThemeToggle />
          {status === "authenticated" ? (
            <details className="acct">
              <summary className="btn btn-secondary btn-sm">Account</summary>
              <div className="acct-menu card stack-2">
                <Link href="/dashboard">My events</Link>
                <Link href="/profile">Profile</Link>
                <Link href="/children">Children</Link>
                <Link href="/privacy">Privacy and consents</Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void logout()}
                >
                  Sign out
                </button>
              </div>
            </details>
          ) : status === "anonymous" ? (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-brand btn-sm">Sign in</Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
