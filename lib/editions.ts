import { api } from "./api";
import { formatDateRange, formatTime } from "./format";
import type { PublicEdition } from "./types";

const REVALIDATE = { next: { revalidate: 30 } } as RequestInit;

export const listEditions = () => api.get<PublicEdition[]>("/public/edition", REVALIDATE);
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

export const dateText = (e: PublicEdition): string => formatDateRange(e.startsOn, e.endsOn);

export const isOpen = (e: PublicEdition): boolean => e.registrationWindow === "Open";

export function statusBadge(e: PublicEdition): { className: string; label: string } {
  if (e.registrationWindow === "Open") return { className: "b-ok", label: "✓ Registration open" };
  if (e.registrationWindow === "Closed") return { className: "b-neutral", label: "Registration closed" };
  return { className: "b-warn", label: "⏱ Coming soon" };
}
