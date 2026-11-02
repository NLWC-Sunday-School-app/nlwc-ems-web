import { describe, expect, it } from "vitest";
import { ageOn, formatLongDay, formatOrdinalRange, formatDate, formatDateRange, formatShortDate, formatTime, priceLine, safeNext, toIsoDate, REGISTRATION_BADGE } from "./format";

describe("dates", () => {
  it("formats API dates without a timezone shift", () => {
    expect(formatDate("2026-12-21")).toBe("Mon 21 Dec 2026");
    expect(formatShortDate("2017-05-01")).toBe("1 May 2017");
  });
  it("collapses a range within one month and spells out one across months", () => {
    expect(formatDateRange("2026-12-21", "2026-12-23")).toBe("Mon 21 – Wed 23 Dec 2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("Wed 30 Dec 2026 – Sat 2 Jan 2027");
    expect(formatDateRange("2026-12-21", "2026-12-21")).toBe("Mon 21 Dec 2026");
  });
  it("formats the pick-up window", () => {
    expect(formatTime("16:00:00")).toBe("4:00pm");
    expect(formatTime("00:30:00")).toBe("12:30am");
    expect(formatTime("12:00:00")).toBe("12:00pm");
  });
  it("computes display age on a given day", () => {
    expect(ageOn("2017-05-01", new Date(2026, 11, 21))).toBe(9);
    expect(ageOn("2017-12-22", new Date(2026, 11, 21))).toBe(8);
    expect(ageOn("2017-12-21", new Date(2026, 11, 21))).toBe(9);
  });
  it("builds an ISO date only from a real calendar date", () => {
    expect(toIsoDate("1", "5", "2017")).toBe("2017-05-01");
    expect(toIsoDate("29", "2", "2024")).toBe("2024-02-29");
    expect(toIsoDate("29", "2", "2025")).toBeNull();
    expect(toIsoDate("31", "4", "2020")).toBeNull();
    expect(toIsoDate("1", "5", "17")).toBeNull();
    expect(toIsoDate("", "5", "2017")).toBeNull();
  });
});

describe("price and status", () => {
  it("shows Free only for an explicit Free state and never guesses a missing price", () => {
    expect(priceLine("Free").label).toBe("₦0 · Free");
    expect(priceLine("Pending").tone).toBe("pending");
    expect(priceLine("Pending").label).toMatch(/pending/i);
    expect(priceLine("Amount").tone).toBe("amount");
  });
  it("has a badge for every registration state", () => {
    for (const s of ["Draft", "ProvisionalPendingClaim", "Submitted", "NeedsAction", "Confirmed", "Completed", "Cancelled", "Rejected", "Expired"] as const)
      expect(REGISTRATION_BADGE[s].label.length).toBeGreaterThan(0);
  });
});

describe("safeNext", () => {
  it("only follows same-site paths after sign-in", () => {
    expect(safeNext("/events/bb-2026/register")).toBe("/events/bb-2026/register");
    expect(safeNext("https://evil.example")).toBe("/dashboard");
    expect(safeNext("//evil.example")).toBe("/dashboard");
    expect(safeNext("/\\evil.example")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});

describe("long dates for the consent wording", () => {
  it("spells out the day for the last-day notice", () => {
    expect(formatLongDay("2026-12-23")).toBe("Wednesday 23 December");
  });
  it("writes ordinal ranges, including 11th–13th, across months and for one day", () => {
    expect(formatOrdinalRange("2026-12-21", "2026-12-23")).toBe("21st to 23rd December 2026");
    expect(formatOrdinalRange("2026-08-11", "2026-08-13")).toBe("11th to 13th August 2026");
    expect(formatOrdinalRange("2026-08-30", "2026-09-02")).toBe("30th August to 2nd September 2026");
    expect(formatOrdinalRange("2026-12-22", "2026-12-22")).toBe("22nd December 2026");
  });
});

