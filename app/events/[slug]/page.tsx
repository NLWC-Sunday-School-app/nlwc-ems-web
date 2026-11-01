import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { PriceLine } from "@/components/PriceLine";
import { campAges, dateText, getEdition, isOpen, modesOf, pickupText, statusBadge } from "@/lib/editions";
import { formatDate } from "@/lib/format";
import { priceLine } from "@/lib/format";
import type { PublicEdition } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(slug: string): Promise<PublicEdition> {
  try {
    return await getEdition(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    return { title: (await getEdition(slug)).name };
  } catch {
    return { title: "Event" };
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await load(slug);
  const badge = statusBadge(e);
  const price = priceLine(e.price.state);
  const camp = campAges(e);
  const pickup = pickupText(e);
  const mapQuery = e.venue ? encodeURIComponent([e.venue.name, e.venue.address].filter(Boolean).join(" ")) : null;

  return (
    <div data-event={e.code.toLowerCase()}>
      <div className="hero hero-event">
        <div className="in">
          <div className="crumbs"><Link href="/events">Events</Link> <span aria-hidden="true">/</span> {e.name}</div>
          <h1>{e.name}</h1>
          <div className="row" style={{ marginTop: "var(--space-6)" }}>
            {isOpen(e) ? (
              <Link className="btn btn-brand" href={`/events/${e.slug}/register`}>Register now</Link>
            ) : (
              <span className={`badge ${badge.className}`}>{badge.label}</span>
            )}
          </div>
          <div className="keyinfo keyinfo-hero" aria-label="Key information">
            <div><span>Dates</span><b>{dateText(e)}</b></div>
            {e.venue && <div><span>Venue</span><b>{[e.venue.name, e.venue.address].filter(Boolean).join(", ")}</b></div>}
            <div><span>Cost</span><b>{price.tone === "free" ? "Free" : price.tone === "pending" ? "To be confirmed" : "See registration"}</b></div>
            {camp && <div><span>Camp ages</span><b>{camp}</b></div>}
            {pickup && <div><span>Walk-in pick-up</span><b>{pickup}</b></div>}
          </div>
        </div>
      </div>

      <div className="container page-pad">
        <div className="event-layout">
          <div className="ev-main" style={{ minWidth: 0 }}>
            <section className="ev-sec">
              <h2>How you can take part</h2>
              <ul className="ev-opts">
                {modesOf(e).map((m) => (
                  <li key={m.mode}><div><b>{m.label}</b><p>{m.blurb}</p></div><span className="ev-tags">{m.tag}</span></li>
                ))}
              </ul>
            </section>

            {e.days.length > 0 && (
              <section className="ev-sec">
                <h2>Programme days</h2>
                <ol className="ev-days" aria-label="Programme days">
                  {e.days.map((d, i) => (
                    <li key={d.day} className={i === e.days.length - 1 ? "last" : undefined}>
                      <b>{Number(d.day.slice(8))}</b>
                      <span>{formatDate(d.day).split(" ").slice(0, 1)} · {formatDate(d.day).split(" ")[2]}{d.label ? ` · ${d.label}` : ""}</span>
                    </li>
                  ))}
                </ol>
                {pickup && (
                  <dl className="ev-pick">
                    <div><dt>Walk-in</dt><dd>Pick up between <b>{pickup.replace(" daily", "")}</b> every day.</dd></div>
                  </dl>
                )}
              </section>
            )}

            <section className="ev-sec">
              <h2>Before you register</h2>
              <ul className="ev-list">
                <li>A profile with your date of birth</li>
                <li>Each child's date of birth</li>
                <li>Names and phone numbers of adults who may pick them up</li>
                <li>Any health or allergy information</li>
              </ul>
              {/* TODO(edition content API): FAQ, studio and last-day pick-up copy come from the edition's content once that API exists. */}
            </section>

            {e.venue && mapQuery && (
              <section className="ev-sec ev-venue">
                <div><span className="xs muted lbl">Venue</span><h3>{e.venue.name}</h3>{e.venue.address && <p className="sm muted">{e.venue.address}</p>}</div>
                <a className="btn btn-secondary" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}>Open in Maps</a>
              </section>
            )}
          </div>

          <aside className="card cart reg-card">
            <span className={`badge ${badge.className}`}>{badge.label}</span>
            <PriceLine state={e.price.state} label="Registration" />
            {isOpen(e) ? (
              <Link className="btn btn-primary btn-block" href={`/events/${e.slug}/register`}>Start registration</Link>
            ) : (
              <button className="btn btn-secondary btn-block" disabled aria-disabled="true">Registration isn't open yet</button>
            )}
            <p className="xs muted">Register one or more children in a single go. Each child gets their own pass.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
