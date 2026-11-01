import Link from "next/link";
import { listComingSoon, listEditions } from "@/lib/editions";

/** The events column follows the API, so a new edition appears here without a code change. */
async function eventLinks(): Promise<{ key: string; name: string; href: string }[]> {
  try {
    const [editions, soon] = await Promise.all([listEditions(), listComingSoon()]);
    const live = editions.map((e) => ({ key: e.slug, name: e.name, href: `/events/${e.slug}` }));
    const seen = new Set(editions.map((e) => e.code.slice(0, 2).toUpperCase()));
    return [...live, ...soon.filter((c) => !seen.has(c.code.slice(0, 2).toUpperCase())).map((c) => ({ key: c.code, name: c.name, href: "/events" }))];
  } catch {
    return [];
  }
}

export async function Footer() {
  const events = await eventLinks();
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
        {events.length > 0 && (
          <nav aria-label="Events">
            <h4>Events</h4>
            {events.map((e) => <Link key={e.key} href={e.href}>{e.name}</Link>)}
          </nav>
        )}
        <nav aria-label="My account">
          <h4>My account</h4>
          <Link href="/login">Sign in</Link>
          <Link href="/dashboard">My events</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/payments">Payments</Link>
          <Link href="/privacy">Privacy and consents</Link>
        </nav>
        <nav aria-label="NLWC">
          <h4>NLWC</h4>
          <a href="https://nlwc.church/">nlwc.church</a>
          <a href="https://tyrannus.nlwc.church/">Tyrannus</a>
          <a href="https://nlwc.church/">Live streaming</a>
          <a href="https://nlwc.church/">Contact us</a>
        </nav>
      </div>
      <div className="foot-base">
        <span>© 2026 The New and Living Way Church</span>
        <span>Event times are shown in Africa/Lagos (WAT)</span>
        <span className="row" style={{ gap: "var(--space-4)" }}><Link href="/privacy">Privacy Policy</Link></span>
      </div>
    </footer>
  );
}
