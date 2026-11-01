"use client";

import { useState } from "react";

/** The questions as the prototype shows them: the first few, then a toggle for the rest. */
export function FaqList({ items, visible = 4 }: { items: { q: string; a: string }[]; visible?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, visible);
  const more = items.length - visible;
  return (
    <div className="faq card flush">
      {shown.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p className="sm muted">{f.a}</p>
        </details>
      ))}
      {more > 0 && (
        <button type="button" className="faq-toggle" aria-expanded={all} onClick={() => setAll((v) => !v)}>
          <span className="plus" aria-hidden="true">{all ? "−" : "+"}</span>
          <span>{all ? "Show fewer questions" : `Show ${more} more questions`}</span>
        </button>
      )}
    </div>
  );
}
