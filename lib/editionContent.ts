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
  faq: { q: string; a: string }[];
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
    faq: [
      { q: "Will there be Bible Museum this year?", a: "No, there will not be Bible Museum this year." },
      { q: "Will there be Christmas party this year?", a: "No, there will not be Christmas party this year." },
      { q: "When is Boot Camp ending?", a: "Boot Camp is ending on 23rd December, 2026." },
      { q: "When can we start picking up campers?", a: "Campers can be picked up on 23rd December by 6PM latest." },
      { q: "Will there be interhouse sport at this year's Bible Boot Camp?", a: "No, there will not be Interhouse sport at this year's Bible Boot Camp." },
      { q: "Can children from age 17 and above camp?", a: "No. They can only come in as walk-in participants daily. Only children from age 10 to 16 are allowed to camp." },
      { q: "Can we know more about the ministry?", a: "Yes, you can visit nlwc.church for more info about the ministry." },
      { q: "Will there be parent interactive forum?", a: "No, there won't be a parent interactive forum this year, but parents can stream the training sessions for the virtual Boot Camp sessions." },
      { q: "Are adults allowed to come for Bible Boot Camp?", a: "No, Bible Boot Camp is majorly for children. However, there are sessions for adults at the virtual Boot Camp sessions." },
    ],
  },
};

export function contentFor(e: PublicEdition): EventContent | undefined {
  const key = eventKey(e.code);
  return key ? CONTENT[key] : undefined;
}
