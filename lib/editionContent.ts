import type { PublicEdition } from "./types";
import { eventKey } from "./editions";

export interface EventContent {
  intro: string;
  /** Everyone who can take part in person each day, e.g. "3–16". */
  walkInAges?: string;
  /** Extra rule shown under the pick-up window. */
  pickupRule?: string;
  /** What parents must do on the last day. */
  lastDayRule?: { text: string; emphasis: string };
  studio?: { intro: string; points: string[] };
}

/**
 * Editorial copy the public edition API does not carry yet (the prototype's wording, supplied by NLWC).
 * TODO(edition content API): replace this file with the edition's own content once that API exists.
 */
const CONTENT: Record<string, EventContent> = {
  bootcamp: {
    intro: "Three days of the Word for children aged 3–16. Everyone aged 17 and over is welcome at the daily programme.",
    walkInAges: "3–16",
    pickupRule: "A child not collected by 6:00pm may not take part the next day.",
    lastDayRule: { text: "Parents and guardians collect every child", emphasis: "in person before 6:00pm" },
    studio: {
      intro: "Children in the Kiddies class may be asked to join the studio sessions.",
      points: [
        "Drop-off by 8:30am every day. Late arrivals won't be considered.",
        "Based on year-round class attendance and participation.",
      ],
    },
  },
};

export function contentFor(e: PublicEdition): EventContent | undefined {
  const key = eventKey(e.code);
  return key ? CONTENT[key] : undefined;
}
