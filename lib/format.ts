import type { ParticipationMode, PriceState, RegistrationState } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Parses an API date (<c>yyyy-MM-dd</c>) without a timezone shift. */
function parts(date: string): { y: number; m: number; d: number; weekday: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** "Mon 21 Dec 2026" */
export function formatDate(date: string): string {
  const p = parts(date);
  return `${DAYS[p.weekday]} ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "21 Dec 2026", for birth dates. */
export function formatShortDate(date: string): string {
  const p = parts(date);
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

/** "Mon 21 – Wed 23 Dec 2026", or across months/years when they differ. */
export function formatDateRange(from: string, to: string): string {
  const a = parts(from);
  const b = parts(to);
  if (from === to) return formatDate(from);
  if (a.y === b.y && a.m === b.m) return `${DAYS[a.weekday]} ${a.d} – ${DAYS[b.weekday]} ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/** "16:00:00" → "4:00pm" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

/** Whole years on <c>on</c>. Display only: the API computes the age that decides eligibility. */
export function ageOn(dob: string, on: Date = new Date()): number {
  const b = parts(dob);
  let age = on.getFullYear() - b.y;
  if (on.getMonth() + 1 < b.m || (on.getMonth() + 1 === b.m && on.getDate() < b.d)) age -= 1;
  return age;
}

/** Digits and optional leading +, for a dd/mm/yyyy style entry boxes the form uses. Returns null when not a real date. */
export function toIsoDate(day: string, month: string, year: string): string | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || year.length !== 4) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const initials = (given: string, family = ""): string => `${given[0] ?? ""}${family[0] ?? ""}`.toUpperCase();

export const MODE_LABEL: Record<ParticipationMode, string> = { Online: "Online", Day: "Walk-in", Camp: "Camping" };

export const RELATIONSHIP_LABEL: Record<string, string> = {
  Parent: "Parent",
  LegalGuardian: "Legal guardian",
  Grandparent: "Grandparent",
  OtherRelative: "Other relative",
};

export interface BadgeSpec { className: string; label: string }

/** Typed-enum status badges, so a state can never render with an unrelated colour. */
export const REGISTRATION_BADGE: Record<RegistrationState, BadgeSpec> = {
  Draft: { className: "b-neutral", label: "Draft" },
  ProvisionalPendingClaim: { className: "b-warn", label: "⏱ Pending claim" },
  Submitted: { className: "b-info", label: "Submitted" },
  NeedsAction: { className: "b-warn", label: "⏱ Needs your action" },
  Confirmed: { className: "b-ok", label: "✓ Confirmed" },
  Completed: { className: "b-ok", label: "✓ Completed" },
  Cancelled: { className: "b-neutral", label: "Cancelled" },
  Rejected: { className: "b-bad", label: "Not accepted" },
  Expired: { className: "b-neutral", label: "Expired" },
};

export interface PriceLine { label: string; className: string; tone: "free" | "pending" | "amount" }

/** What the public sees of an edition's price. Only an explicit published Free rule reads as free. */
export function priceLine(state: PriceState): PriceLine {
  switch (state) {
    case "Free": return { label: "₦0 · Free", className: "free", tone: "free" };
    case "Amount": return { label: "See price on registration", className: "", tone: "amount" };
    default: return { label: "⏱ Price pending approval", className: "muted", tone: "pending" };
  }
}

/** Open tasks shown to a family, from the API's stable task codes. */
export const TASK_LABEL: Record<string, string> = {
  emergency_contact: "Add a pick-up person",
  health: "Answer the health questions",
  consent_terms: "Accept the event terms",
  consent_guardian_authorization: "Give parent or guardian consent",
  consent_medical_emergency: "Confirm emergency medical treatment",
  consent_media: "Answer the photo and video permission",
};

/** Only these are safe to follow after sign-in: a same-site path, never another site. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

/** "Wednesday 23 December" */
export function formatLongDay(date: string): string {
  const p = parts(date);
  return `${LONG_DAYS[p.weekday]} ${p.d} ${LONG_MONTHS[p.m - 1]}`;
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;

/** "21st to 23rd December 2026" (or "21st December 2026" for a single day, or across months when they differ). */
export function formatOrdinalRange(from: string, to: string): string {
  const a = parts(from);
  const b = parts(to);
  if (from === to) return `${ordinal(b.d)} ${LONG_MONTHS[b.m - 1]} ${b.y}`;
  const start = a.m === b.m && a.y === b.y ? ordinal(a.d) : `${ordinal(a.d)} ${LONG_MONTHS[a.m - 1]}${a.y === b.y ? "" : ` ${a.y}`}`;
  return `${start} to ${ordinal(b.d)} ${LONG_MONTHS[b.m - 1]} ${b.y}`;
}

