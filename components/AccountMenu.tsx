"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const ICONS = {
  events: icon(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  profile: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>),
  payments: icon(<><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 10h19M6.5 15h4" /></>),
  privacy: icon(<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />),
  signout: icon(<><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M9 8l-4 4 4 4M5 12h11" /></>),
};

/** The signed-in person's menu: who they are, where they can go, and sign out. A button and a popover, closed by a click
 * outside, Escape, or choosing something; focus returns to the button. */
export function AccountMenu() {
  const { who, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const name = who ? `${who.givenName} ${who.familyName}`.trim() : "Your account";
  const badge = who ? initials(who.givenName, who.familyName) : "";
  const close = () => setOpen(false);
  const items = [
    { href: "/dashboard", label: "My events", icon: ICONS.events },
    { href: "/profile", label: "Profile and family", icon: ICONS.profile },
    { href: "/payments", label: "Payments", icon: ICONS.payments },
    { href: "/privacy", label: "Privacy and consents", icon: ICONS.privacy },
  ];

  return (
    <div className="acct" ref={root}>
      <button ref={button} type="button" className="acct-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="acct-av" aria-hidden="true">{badge || icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>)}</span>
        <span className="acct-name hide-m">{who?.givenName ?? "Account"}</span>
        <svg className="acct-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        <span className="sr-only">Account menu for {name}</span>
      </button>

      {open && (
        <div className="acct-pop" role="menu" aria-label="Account">
          <div className="acct-head">
            <span className="acct-av lg" aria-hidden="true">{badge}</span>
            <div style={{ minWidth: 0 }}>
              <b className="acct-who">{name}</b>
              {who && <div className="acct-mail">{who.email}</div>}
            </div>
          </div>
          <div className="acct-list">
            {items.map((i) => (
              <Link key={i.href} href={i.href} role="menuitem" className="acct-item" onClick={close}>
                {i.icon}
                {i.label}
              </Link>
            ))}
          </div>
          <div className="acct-list acct-foot">
            <button type="button" role="menuitem" className="acct-item danger" onClick={() => void logout()}>
              {ICONS.signout}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
