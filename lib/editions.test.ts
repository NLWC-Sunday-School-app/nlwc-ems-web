import { describe, expect, it } from "vitest";
import { campAges, isOpen, modesOf, pickupText, statusBadge } from "./editions";
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
