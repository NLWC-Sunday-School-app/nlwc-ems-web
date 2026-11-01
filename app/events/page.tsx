import type { Metadata } from "next";
import Link from "next/link";
import { EventList } from "@/components/EventList";
import { HeroArt } from "@/components/HeroArt";
import { daysUntil, eventKey, featuredEdition, listComingSoon, listEditions, priceLabel, statusBadge, type ComingSoon } from "@/lib/editions";
import type { PublicEdition } from "@/lib/types";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function EventsPage() {
  let editions: PublicEdition[] = [];
  let comingSoon: ComingSoon[] = [];
  let failed = false;
  try {
    [editions, comingSoon] = await Promise.all([listEditions(), listComingSoon()]);
  } catch {
    failed = true;
  }
  const next = featuredEdition(editions);

  return (
    <>
      <div className="hero hero-home">
        <HeroArt />
        <div className="in hero-grid">
          <div>
            <span className="eyebrow">NLWC Events</span>
            <h1>Experience the life behind the veil.</h1>
            <p>
              Having boldness to enter the Holiest by the blood of Jesus, <b>by a new and living way</b> which He consecrated for us, through the veil… (
              <a href="https://www.biblegateway.com/passage/?search=Hebrews+10%3A19-20&version=NKJV" target="_blank" rel="noopener">Hebrews 10:19–20</a>)
            </p>
            <div className="row" style={{ marginTop: "var(--space-6)" }}>
              <a className="btn btn-brand" href="#events">Browse events</a>
              <Link className="btn btn-hero-ghost" href="/signup">Create an account</Link>
            </div>
          </div>
          {next && <FeaturedEvent edition={next} />}
        </div>
      </div>

      <div className="container stack-8" id="events">
        {failed && (
          <div className="alert warn" role="alert"><div><b>We couldn't load the events.</b>Please refresh the page in a moment.</div></div>
        )}
        {!failed && editions.length === 0 && comingSoon.length === 0 && (
          <div className="empty"><h3>No events are open yet</h3><p className="muted sm">Check back soon, or create an account so you're ready.</p></div>
        )}
        {!failed && <EventList editions={editions} comingSoon={comingSoon} />}

        <div>
          <h2>How it works</h2>
          <ol className="steps">
            <li><span className="n">1</span><div><b>Create your profile</b><p className="sm muted">Sign up with your email and confirm it.</p></div></li>
            <li><span className="n">2</span><div><b>Add your family</b><p className="sm muted">Add your children and link your spouse, once.</p></div></li>
            <li><span className="n">3</span><div><b>Register and get passes</b><p className="sm muted">Each person gets their own pass.</p></div></li>
          </ol>
        </div>
      </div>
    </>
  );
}

/** The "Next event" card in the hero. Everything on it comes from the edition. */
function FeaturedEvent({ edition: e }: { edition: PublicEdition }) {
  const days = daysUntil(e.startsOn);
  const a = Number(e.startsOn.slice(8));
  const b = Number(e.endsOn.slice(8));
  const status = statusBadge(e).label.replace(/^[^A-Za-z]+/, "");
  return (
    <article className="hero-feature" data-event={eventKey(e.code)} aria-label="Featured event">
      <div className="hf-top"><span className="hf-label">Next event</span>{days !== null && <span className="hf-soon">In {days} {days === 1 ? "day" : "days"}</span>}</div>
      <div className="hf-body">
        <div className="hf-date" aria-label={`${a === b ? a : `${a} to ${b}`} ${MONTHS[Number(e.endsOn.slice(5, 7)) - 1]}`}>
          <b>{a === b ? a : `${a}–${b}`}</b><span>{MONTHS[Number(e.endsOn.slice(5, 7)) - 1]}</span>
        </div>
        <div className="hf-info">
          <h2>{e.name}</h2>
          <p className="hf-meta"><span className="hf-dot" aria-hidden="true" />{status} · {priceLabel(e)}</p>
        </div>
      </div>
      <div className="hf-actions"><Link className="btn btn-primary btn-sm" href={`/events/${e.slug}`}>Register</Link></div>
    </article>
  );
}
