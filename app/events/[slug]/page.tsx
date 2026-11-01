import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { FaqList } from "@/components/FaqList";
import { PriceLine } from "@/components/PriceLine";
import { campAges, dateText, getEdition, isOpen, modesOf, pickupText, statusBadge } from "@/lib/editions";
import { contentFor } from "@/lib/editionContent";
import { formatDate } from "@/lib/format";
import { priceLine } from "@/lib/format";
import type { PublicEdition } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_WORDS: Record<number, string> = { 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven" };

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

function tagFor(m: { mode: string; tag: string }, walkInAges: string | undefined, free: boolean): string {
  const base = m.mode === "Day" && walkInAges ? `Ages ${walkInAges}` : m.tag;
  return free && m.mode !== "Online" ? `${base} · Free` : base;
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await load(slug);
  const badge = statusBadge(e);
  const price = priceLine(e.price.state);
  const camp = campAges(e);
  const pickup = pickupText(e);
  const content = contentFor(e);
  const year = e.startsOn.slice(0, 4);
  const programme = e.name.replace(new RegExp(`\\s*${year}$`), "");
  const lastDay = e.days.length > 1 ? formatDate(e.days[e.days.length - 1].day).split(" ").slice(0, 3).join(" ") : null;
  const mapQuery = e.venue ? encodeURIComponent([e.venue.name, e.venue.address].filter(Boolean).join(" ")) : null;

  return (
    <div data-event={e.code.toLowerCase()}>
      <div className="hero hero-event">
        <div className="in">
          <div className="crumbs"><Link href="/events">Events</Link> <span aria-hidden="true">/</span> {e.name}</div>
          <span className="eyebrow">{programme} · {year} edition</span>
          <h1>{e.name}</h1>
          {content && <p>{content.intro}</p>}
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
            {camp && <div><span>{content?.walkInAges ? "Ages" : "Camp ages"}</span><b>{content?.walkInAges ? `${content.walkInAges} · camp ${camp}` : camp}</b></div>}
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
                  <li key={m.mode}><div><b>{m.label}</b><p>{m.blurb}</p></div><span className="ev-tags">{tagFor(m, content?.walkInAges, price.tone === "free")}</span></li>
                ))}
              </ul>
            </section>

            {e.days.length > 0 && (
              <section className="ev-sec">
                <h2>{e.days.length > 1 && DAY_WORDS[e.days.length] ? `${DAY_WORDS[e.days.length]} days` : "Programme days"}{pickup ? ", one pick-up rule" : ""}</h2>
                <ol className="ev-days" aria-label="Programme days">
                  {e.days.map((d, i) => (
                    <li key={d.day} className={i === e.days.length - 1 ? "last" : undefined}>
                      <b>{Number(d.day.slice(8))}</b>
                      <span>{formatDate(d.day).split(" ").slice(0, 1)} · {formatDate(d.day).split(" ")[2]}{d.label ? ` · ${d.label}` : i === e.days.length - 1 && e.days.length > 1 ? " · Last day" : ""}</span>
                    </li>
                  ))}
                </ol>
                {pickup && (
                  <dl className="ev-pick">
                    <div><dt>Walk-in</dt><dd>Pick up between <b>{pickup.replace(" daily", "").replace(" – ", " and ")}</b> every day.{content?.pickupRule ? ` ${content.pickupRule}` : ""}</dd></div>
                    {content?.lastDayRule && lastDay && (
                      <div className="hl"><dt>{lastDay}</dt><dd>{content.lastDayRule.text} <b>{content.lastDayRule.emphasis}</b>.</dd></div>
                    )}
                  </dl>
                )}
              </section>
            )}

            <section className={`ev-sec${content?.studio ? " ev-two" : ""}`}>
              <div>
                <h2>Before you register</h2>
                <ul className="ev-list">
                  <li>Each child's date of birth</li>
                  <li>Names and phone numbers of adults who may pick them up</li>
                  <li>Any health or allergy information</li>
                  <li>Parental consent information</li>
                </ul>
              </div>
              {content?.studio && (
                <div>
                  <h2>Studio broadcast team</h2>
                  <p className="sm muted">{content.studio.intro}</p>
                  <ul className="ev-list">
                    {content.studio.points.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              )}
            </section>

            {content && content.faq.length > 0 && (
              <section className="ev-sec">
                <h2>Frequently asked questions</h2>
                <FaqList items={content.faq} />
              </section>
            )}

            {e.venue && mapQuery && (
              <section className="ev-sec ev-venue">
                <div><span className="xs muted lbl">Venue</span><h3>{e.venue.name}</h3>{e.venue.address && <p className="sm muted">{e.venue.address}</p>}</div>
                <a className="btn btn-secondary" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}>Open in Maps</a>
              </section>
            )}
          </div>

          <aside className="card cart reg-card">
            <span className={`badge ${badge.className}`}>{badge.label}</span>
            {price.tone === "free" ? (
              <div className="reg-price"><b>Free</b><span className="muted sm">{camp ? "Walk-in and camp" : "Walk-in"}</span></div>
            ) : (
              <PriceLine state={e.price.state} label="Registration" />
            )}
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
