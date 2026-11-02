import { describe, expect, it } from "vitest";
import { campAges, campAllows, dateRangeParts, daysUntil, eventKey, featuredEdition, isOpen, modesOf, pickupText, priceLabel, statusBadge } from "./editions";
import type { PublicEdition } from "./types";

const edition = (over: Partial<PublicEdition> = {}): PublicEdition => ({
  slug: "bb-2026", code: "BB26", name: "Bible Bootcamp 2026", timezone: "Africa/Lagos", startsOn: "2026-12-21", endsOn: "2026-12-23",
  camp: { minAge: 10, maxAge: 16 }, pickupWindow: { start: "16:00:00", end: "18:00:00" }, registrationWindow: "Open", capabilities: [],
  price: { state: "Free" }, days: [], ...over,
});

describe("edition helpers", () => {
  it("offers camp only when the edition has a camp age range", () => {
    expect(modesOf(edition()).map((m) => m.mode)).toEqual(["Online", "Day", "Camp"]);
    expect(modesOf(edition({ camp: null })).map((m) => m.mode)).toEqual(["Online", "Day"]);
  });
  it("describes camp ages and the pick-up window from the API's values", () => {
    expect(campAges(edition())).toBe("10–16");
    expect(campAges(edition({ camp: { minAge: 13, maxAge: null } }))).toBe("13+");
    expect(campAges(edition({ camp: null }))).toBeNull();
    expect(pickupText(edition())).toBe("4:00pm – 6:00pm daily");
    expect(pickupText(edition({ pickupWindow: null }))).toBeNull();
  });
  it("only calls an edition open when the registration window is open", () => {
    expect(isOpen(edition())).toBe(true);
    expect(isOpen(edition({ registrationWindow: "NotOpen" }))).toBe(false);
    expect(statusBadge(edition({ registrationWindow: "NotOpen" })).label).toMatch(/coming soon/i);
    expect(statusBadge(edition({ registrationWindow: "Closed" })).label).toMatch(/closed/i);
  });
});

import { editionCodeOf } from "./editions";

describe("editionCodeOf", () => {
  it("takes the edition code off the front of a reference", () => {
    expect(editionCodeOf("BB26-0412-A7")).toBe("BB26");
    expect(editionCodeOf("B1F3A-0001-K4")).toBe("B1F3A");
    expect(editionCodeOf("SS-26-0412-A7")).toBe("SS-26");
  });
});

describe("events page helpers", () => {
  it("counts whole days to the start and says nothing once it has started", () => {
    expect(daysUntil("2026-12-21", new Date(2026, 9, 31))).toBe(51);
    expect(daysUntil("2026-12-21", new Date(2026, 11, 20))).toBe(1);
    expect(daysUntil("2026-12-21", new Date(2026, 11, 21))).toBeNull();
    expect(daysUntil("2026-12-21", new Date(2027, 0, 5))).toBeNull();
  });
  it("splits the date block into days and month", () => {
    expect(dateRangeParts(edition())).toEqual({ days: "21–23", monthYear: "Dec 2026" });
    expect(dateRangeParts(edition({ startsOn: "2026-12-21", endsOn: "2026-12-21" })).days).toBe("21");
  });
  it("maps a programme code to its accent", () => {
    expect(eventKey("BB26")).toBe("bootcamp");
    expect(eventKey("ss27")).toBe("singlz");
    expect(eventKey("CP26")).toBe("couples");
    expect(eventKey("XX26")).toBeUndefined();
  });
  it("features the soonest open edition, else the soonest upcoming", () => {
    const open = edition({ slug: "open", startsOn: "2027-03-01", registrationWindow: "Open" });
    const early = edition({ slug: "early", startsOn: "2026-12-01", registrationWindow: "NotOpen" });
    expect(featuredEdition([early, open])?.slug).toBe("open");
    expect(featuredEdition([early])?.slug).toBe("early");
    expect(featuredEdition([])).toBeUndefined();
  });
  it("only says Free for an explicitly published free price", () => {
    expect(priceLabel(edition({ price: { state: "Free" } }))).toBe("Free");
    expect(priceLabel(edition({ price: { state: "Pending" } }))).toBe("Price to be confirmed");
    expect(priceLabel(edition({ price: { state: "Amount" } }))).toBe("Paid event");
  });
});

describe("campAllows", () => {
  it("lets only the camp ages ask for camp, judged on the age at the event", () => {
    const e = edition();
    expect([1, 9].map((a) => campAllows(e, a))).toEqual([false, false]);
    expect([10, 13, 16].map((a) => campAllows(e, a))).toEqual([true, true, true]);
    expect([17, 40].map((a) => campAllows(e, a))).toEqual([false, false]);
  });
  it("lets an unknown age through (the API decides) and refuses when the event has no camp", () => {
    expect(campAllows(edition(), null)).toBe(true);
    expect(campAllows(edition({ camp: null }), 12)).toBe(false);
  });
  it("treats an open-ended range as open", () => {
    expect(campAllows(edition({ camp: { minAge: 10, maxAge: null } }), 30)).toBe(true);
  });
});

describe("modesOf", () => {
  it("describes online as streaming", () => {
    expect(modesOf(edition()).find((m) => m.mode === "Online")?.blurb).toBe("Stream online.");
  });
});
