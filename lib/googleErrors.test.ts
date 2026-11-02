import { describe, expect, it } from "vitest";
import { googleErrorMessage, googleStartUrl } from "./googleErrors";

describe("googleErrorMessage", () => {
  it("explains each code the API sends", () => {
    for (const code of ["google_cancelled", "google_email_unverified", "google_link_needs_password", "google_link_conflict", "google_failed"]) {
      expect(googleErrorMessage(code)).toMatch(/\S/);
    }
  });
  it("falls back to the generic message for an unknown google_ code", () => {
    expect(googleErrorMessage("google_something_new")).toBe(googleErrorMessage("google_failed"));
  });
  it("shows nothing for a missing or foreign value, so a crafted URL cannot print arbitrary text", () => {
    expect(googleErrorMessage(null)).toBeNull();
    expect(googleErrorMessage("<script>")).toBeNull();
    expect(googleErrorMessage("invalid_credentials")).toBeNull();
  });
});

describe("googleStartUrl", () => {
  it("carries the page to return to, encoded", () => {
    expect(googleStartUrl("/events/bb-2026/register?x=1&y=2")).toBe("/api/v1/auth/google/start?next=%2Fevents%2Fbb-2026%2Fregister%3Fx%3D1%26y%3D2");
  });
});
