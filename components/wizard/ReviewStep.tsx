"use client";

import Link from "next/link";
import { Avatar, FormError, Loading } from "@/components/Form";
import { PriceLine } from "@/components/PriceLine";
import { MODE_LABEL, TASK_LABEL, initials } from "@/lib/format";
import { pickupText } from "@/lib/editions";
import type { PublicEdition, Registration, Review } from "@/lib/types";
import { stepForTask, type Entry, type StepIndex } from "./model";

export interface SubmitResult { ok: boolean; message?: string; state?: string }

export function ReviewStep({
  edition,
  entries,
  reviews,
  results,
  loading,
  onGoTo,
}: {
  edition: PublicEdition;
  entries: Entry[];
  reviews: Record<string, Review>;
  results: Record<string, SubmitResult>;
  loading: boolean;
  onGoTo: (step: StepIndex) => void;
}) {
  const pickup = pickupText(edition);
  const anyDay = entries.some((e) => e.registration?.participationMode === "Day" && e.person.isChild);
  const holding = entries.filter((e) => reviews[e.registration!.id]?.holdsPass);

  if (loading) return <Loading label="Checking what's left…" />;

  return (
    <div className="card stack-4">
      <h3>Review</h3>
      {entries.map((e) => {
        const reg = e.registration as Registration;
        const review = reviews[reg.id];
        const result = results[reg.id];
        const blocking = review?.openTasks.filter((t) => t.blocking) ?? [];
        const optional = review?.openTasks.filter((t) => !t.blocking) ?? [];
        return (
          <div className="person-pill stack-2" key={reg.id} style={{ display: "block" }}>
            <div className="row between">
              <div className="row">
                <Avatar>{initials(e.person.given)}</Avatar>
                <div>
                  <b>{e.person.given}{e.person.age != null ? ` · ${e.person.age}` : ""}</b>
                  <div className="xs muted">{MODE_LABEL[reg.participationMode]} · reference <span className="mono">{reg.reference}</span></div>
                </div>
              </div>
              {result?.ok ? (
                <span className="badge b-ok">✓ {result.state === "Confirmed" ? "Confirmed" : "Submitted"}</span>
              ) : review?.canSubmit ? (
                <span className="badge b-ok">✓ Ready</span>
              ) : (
                <span className="badge b-warn">{blocking.length} to do</span>
              )}
            </div>
            {!result?.ok && blocking.length > 0 && (
              <ul className="stack-2" style={{ listStyle: "none", padding: 0, margin: "var(--space-3) 0 0" }}>
                {blocking.map((t) => (
                  <li key={t.code} className="task">
                    <div style={{ flex: 1 }}>{TASK_LABEL[t.code] ?? t.code}</div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onGoTo(stepForTask(t.code))}>Fix</button>
                  </li>
                ))}
              </ul>
            )}
            {!result?.ok && optional.map((t) => (
              <div key={t.code} className="xs muted" style={{ marginTop: 6 }}>Optional: {TASK_LABEL[t.code] ?? t.code}</div>
            ))}
            {result && !result.ok && <div style={{ marginTop: "var(--space-3)" }}><FormError message={result.message} /></div>}
          </div>
        );
      })}

      <PriceLine state={edition.price.state} label={`Registration · ${entries.length} ${entries.length === 1 ? "person" : "people"}`} />

      {pickup && anyDay && (
        <div className="alert warn">
          <span aria-hidden="true">⏱</span>
          <div><b>Walk-in children are picked up {pickup.replace(" daily", "")} every day.</b>Remember who is on each child's pick-up list.</div>
        </div>
      )}
      {holding.length > 0 && (
        <div className="alert warn">
          <span aria-hidden="true">⏱</span>
          <div>
            <b>You can submit now.</b>
            {holding.map((e) => e.person.given).join(" and ")}'s pass stays "Pending" until the photo and video permission is answered.{" "}
            <button type="button" className="link-btn" onClick={() => onGoTo(3)}>Answer it now</button>
          </div>
        </div>
      )}
      <p className="xs muted">Need to come back later? Your answers are saved as a draft. Find it under <Link href="/dashboard">My events</Link>.</p>
    </div>
  );
}
