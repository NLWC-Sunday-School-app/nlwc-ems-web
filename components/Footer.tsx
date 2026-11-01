import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-foot">
      <div className="foot-in">
        <div className="foot-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-light" src="/nlwc-logo-coloured.png" alt="The New & Living Way Church" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-dark" src="/nlwc-logo-white.png" alt="" aria-hidden="true" />
          <p className="sm muted">Events Management &amp; Registration system for the New and Living Way Church</p>
        </div>
        <nav aria-label="My account">
          <h4>My account</h4>
          <Link href="/login">Sign in</Link>
          <Link href="/dashboard">My events</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/privacy">Privacy and consents</Link>
        </nav>
        <nav aria-label="NLWC">
          <h4>NLWC</h4>
          <a href="https://nlwc.church/">nlwc.church</a>
        </nav>
      </div>
      <div className="foot-base">
        <span>© 2026 The New and Living Way Church</span>
        <span>Event times are shown in Africa/Lagos (WAT)</span>
      </div>
    </footer>
  );
}
