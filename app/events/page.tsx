import type { Metadata } from "next";
import Link from "next/link";
import { dateText, isOpen, listEditions, modesOf, statusBadge } from "@/lib/editions";
import type { PublicEdition } from "@/lib/types";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let editions: PublicEdition[] = [];
  let failed = false;
  try {
    editions = await listEditions();
  } catch {
    failed = true;
  }

  return (
    <>
      <div className="hero hero-home">
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
        </div>
      </div>

      <div className="container stack-8 page-pad" id="events">
        <div>
          <h2>Events</h2>
          <p className="muted sm" style={{ marginTop: 4 }}>Dates and prices appear only once NLWC has confirmed them.</p>
        </div>

        {failed && (
          <div className="alert warn" role="alert"><div><b>We couldn't load the events.</b>Please refresh the page in a moment.</div></div>
        )}
        {!failed && editions.length === 0 && (
          <div className="empty"><h3>No events are open yet</h3><p className="muted sm">Check back soon, or create an account so you're ready.</p></div>
        )}

        <div className="ev-list">
          {editions.map((e) => {
            const badge = statusBadge(e);
            return (
              <article className="ev-row" key={e.slug} data-event={e.code.toLowerCase()}>
                <div className="ev-date"><b>{dayRange(e)}</b><span>{monthYear(e)}</span></div>
                <div className="ev-body">
                  <div className="row"><h3>{e.name}</h3><span className={`badge ${badge.className}`}>{badge.label}</span></div>
                  {e.venue && <p className="sm muted">{e.venue.name}{e.venue.address ? ` · ${e.venue.address}` : ""}</p>}
                  <p className="sm muted">{dateText(e)}</p>
                  <div className="row" style={{ gap: 6 }}>{modesOf(e).map((m) => <span className="tag" key={m.mode}>{m.label}</span>)}</div>
                </div>
                <div className="ev-cta">
                  <Link className={`btn ${isOpen(e) ? "btn-primary" : "btn-secondary"}`} href={`/events/${e.slug}`}>{isOpen(e) ? "Register" : "Preview"}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayRange(e: PublicEdition) {
  const a = Number(e.startsOn.slice(8));
  const b = Number(e.endsOn.slice(8));
  return a === b ? `${a}` : `${a}–${b}`;
}
function monthYear(e: PublicEdition) {
  return `${MONTHS[Number(e.endsOn.slice(5, 7)) - 1]} ${e.endsOn.slice(0, 4)}`;
}
