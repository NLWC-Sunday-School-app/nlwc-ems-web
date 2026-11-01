"use client";

import Link from "next/link";
import { useState } from "react";
import { dateRangeParts, eventKey, isOpen, modesOf, statusBadge, type ComingSoon } from "@/lib/editions";
import type { PublicEdition } from "@/lib/types";

type Filter = "all" | "open" | "soon";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open now" },
  { key: "soon", label: "Coming soon" },
];

/** The events list with its All / Open now / Coming soon filter. Programmes with no public edition yet are "coming soon". */
export function EventList({ editions, comingSoon }: { editions: PublicEdition[]; comingSoon: ComingSoon[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shownEditions = editions.filter((e) => filter === "all" || (filter === "open" ? isOpen(e) : !isOpen(e)));
  const shownSoon = filter === "open" ? [] : comingSoon;

  return (
    <>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div>
          <h2>Events</h2>
          <p className="muted sm" style={{ marginTop: 4 }}>Dates and prices appear only once NLWC has confirmed them.</p>
        </div>
        <div className="row" role="group" aria-label="Filter events">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`chip${filter === f.key ? " on" : ""}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ev-list">
        {shownEditions.map((e) => {
          const badge = statusBadge(e);
          const parts = dateRangeParts(e);
          return (
            <article className="ev-row" key={e.slug} data-event={eventKey(e.code)} data-status={isOpen(e) ? "open" : "soon"}>
              <div className="ev-date"><b>{parts.days}</b><span>{parts.monthYear}</span></div>
              <div className="ev-body">
                <div className="row"><h3>{e.name}</h3><span className={`badge ${badge.className}`}>{badge.label}</span></div>
                {e.venue && <p className="sm muted">{e.venue.name}{e.venue.address ? ` · ${e.venue.address}` : ""}</p>}
                <div className="row" style={{ gap: 6 }}>{modesOf(e).map((m) => <span className="tag" key={m.mode}>{m.label}</span>)}</div>
              </div>
              <div className="ev-cta"><Link className="btn btn-primary" href={`/events/${e.slug}`}>Preview</Link></div>
            </article>
          );
        })}
        {shownSoon.map((c) => (
          <article className="ev-row" key={c.code} data-event={eventKey(c.code)} data-status="soon">
            <div className="ev-date tba"><b>TBA</b><span>Dates soon</span></div>
            <div className="ev-body">
              <div className="row"><h3>{c.name}</h3><span className="badge b-warn">⏱ Coming soon</span></div>
            </div>
            <div className="ev-cta"><button type="button" className="btn btn-secondary" disabled aria-disabled="true" title="Not available yet">Preview</button></div>
          </article>
        ))}
        {shownEditions.length + shownSoon.length === 0 && (
          <div className="empty"><h3>Nothing here yet</h3><p className="muted sm">Try another filter, or check back soon.</p></div>
        )}
      </div>
    </>
  );
}
