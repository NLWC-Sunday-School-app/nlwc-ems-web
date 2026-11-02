"use client";

import { useEffect, useState } from "react";

/** The "On this page" list beside the profile. Highlights the section being read and jumps to one on click. */
export function LocalNav({ items }: { items: { id: string; label: string; badge?: number | null }[] }) {
  const [on, setOn] = useState(items[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      // The last section whose top has passed just under the sticky header is the one being read.
      let current = items[0]?.id;
      for (const i of items) {
        const el = document.getElementById(i.id);
        if (el && el.getBoundingClientRect().top <= 140) current = i.id;
      }
      setOn(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <nav className="local-nav card" aria-label="On this page">
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className={on === i.id ? "on" : undefined} aria-current={on === i.id ? "true" : undefined}>
          {i.label}
          {i.badge ? <span className="badge b-neutral">{i.badge}</span> : null}
        </a>
      ))}
    </nav>
  );
}
