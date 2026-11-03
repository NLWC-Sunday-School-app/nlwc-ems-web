import { describe, expect, it } from "vitest";
import { canCancel, editionOf, isEditable, isLive } from "./registrations";
import type { PublicEdition, Registration } from "./types";

const reg = (over: Partial<Registration>): Registration => ({
  id: "r", reference: "BB26-0001-A1", editionId: "e1", personId: "p", state: "Draft", participationMode: "Day", draft: {}, dateCreated: "2026-11-01T00:00:00Z", ...over,
});
const ed = (over: Partial<PublicEdition>): PublicEdition => ({
  slug: "bb", code: "BB26", name: "BB", timezone: "Africa/Lagos", startsOn: "2026-12-21", endsOn: "2026-12-23", registrationWindow: "Open", capabilities: [], price: { state: "Free" }, days: [], ...over,
});

describe("registration helpers", () => {
  it("matches an edition by id when the API returns one, else by the code in the reference", () => {
    expect(editionOf(reg({}), [ed({ id: "e1" })])?.slug).toBe("bb");
    expect(editionOf(reg({ editionId: "other" }), [ed({ id: "e1" })])).toBeUndefined();
    expect(editionOf(reg({}), [ed({})])?.slug).toBe("bb");
    expect(editionOf(reg({ reference: "SS26-0001-A1" }), [ed({})])).toBeUndefined();
  });
  it("knows which states can still be edited, are live, or can be cancelled", () => {
    expect(isEditable(reg({ state: "NeedsAction" }))).toBe(true);
    expect(isEditable(reg({ state: "Confirmed" }))).toBe(false);
    expect(isLive(reg({ state: "Cancelled" }))).toBe(false);
    expect(canCancel(reg({ state: "Confirmed" }))).toBe(false);
    expect(canCancel(reg({ state: "Completed" }))).toBe(false);
  });
});
