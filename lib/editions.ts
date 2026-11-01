import { api } from "./api";
import { formatDateRange, formatTime } from "./format";
import type { PublicEdition } from "./types";

const REVALIDATE = { next: { revalidate: 30 } } as RequestInit;

export const listEditions = () => api.get<PublicEdition[]>("/public/edition", REVALIDATE);
export type ComingSoon = { code: string; name: string };
export const listComingSoon = () => api.get<ComingSoon[]>("/public/coming-soon", REVALIDATE);

/** The accent key the shared CSS styles events by (left border, tint). The edition code starts with the programme code. */
export function eventKey(code: string): "bootcamp" | "singlz" | "couples" | undefined {
  const c = code.toUpperCase();
  return c.startsWith("BB") ? "bootcamp" : c.startsWith("SS") ? "singlz" : c.startsWith("CP") ? "couples" : undefined;
}

/** Whole days from <paramref name="today"/> to the start date, or null once it has started. */
export function daysUntil(startsOn: string, today: Date = new Date()): number | null {
  const [y, m, d] = startsOn.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((start - now) / 86_400_000);
  return days > 0 ? days : null;
}

export const priceLabel = (e: PublicEdition): string =>
  e.price.state === "Free" ? "Free" : e.price.state === "Amount" ? "Paid event" : "Price to be confirmed";

/** The edition to feature: the soonest one that is open for registration, else the soonest upcoming one. */
export function featuredEdition(list: PublicEdition[]): PublicEdition | undefined {
  const upcoming = [...list].sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  return upcoming.find((e) => e.registrationWindow === "Open") ?? upcoming[0];
}

export const getEdition = (slug: string) => api.get<PublicEdition>(`/public/edition/${encodeURIComponent(slug)}`, REVALIDATE);

/** How the edition can be taken part in, from what the API says it offers. Online is always available. */
export function modesOf(e: PublicEdition): { mode: "Online" | "Day" | "Camp"; label: string; blurb: string; tag: string }[] {
  const out: { mode: "Online" | "Day" | "Camp"; label: string; blurb: string; tag: string }[] = [
    { mode: "Online", label: "Online", blurb: "Join the broadcast from home.", tag: "Everyone" },
    { mode: "Day", label: "Walk-in", blurb: "Attend in person and check in and out each day.", tag: "In person" },
  ];
  if (e.camp && (e.camp.minAge != null || e.camp.maxAge != null)) {
    out.push({
      mode: "Camp",
      label: "Camp",
      blurb: "Request it when you register. Our team reviews every request before a bed is offered.",
      tag: `Ages ${e.camp.minAge ?? 0}${e.camp.maxAge != null ? `–${e.camp.maxAge}` : "+"}`,
    });
  }
  return out;
}

export const campAges = (e: PublicEdition): string | null =>
  e.camp && (e.camp.minAge != null || e.camp.maxAge != null) ? `${e.camp.minAge ?? 0}${e.camp.maxAge != null ? `–${e.camp.maxAge}` : "+"}` : null;

export const pickupText = (e: PublicEdition): string | null =>
  e.pickupWindow ? `${formatTime(e.pickupWindow.start)} – ${formatTime(e.pickupWindow.end)} daily` : null;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The two lines of the date block on an event row: "21–23" and "Dec 2026" (the month of the last day). */
export function dateRangeParts(e: PublicEdition): { days: string; monthYear: string } {
  const a = Number(e.startsOn.slice(8));
  const b = Number(e.endsOn.slice(8));
  return { days: a === b ? `${a}` : `${a}–${b}`, monthYear: `${MONTHS[Number(e.endsOn.slice(5, 7)) - 1]} ${e.endsOn.slice(0, 4)}` };
}

export const dateText = (e: PublicEdition): string => formatDateRange(e.startsOn, e.endsOn);

export const isOpen = (e: PublicEdition): boolean => e.registrationWindow === "Open";

export function statusBadge(e: PublicEdition): { className: string; label: string } {
  if (e.registrationWindow === "Open") return { className: "b-ok", label: "✓ Registration open" };
  if (e.registrationWindow === "Closed") return { className: "b-neutral", label: "Registration closed" };
  return { className: "b-warn", label: "⏱ Coming soon" };
}

/** The edition code at the start of a reference such as <c>BB26-0412-A7</c>. A fallback for matching a registration to an
 * edition while the public edition API does not return an id. */
export function editionCodeOf(reference: string): string {
  const parts = reference.split("-");
  return parts.length > 2 ? parts.slice(0, -2).join("-") : reference;
}
