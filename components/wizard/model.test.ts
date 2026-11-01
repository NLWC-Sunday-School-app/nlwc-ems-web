import { describe, expect, it } from "vitest";
import { consentKinds, isPhysical, stepForTask, type Person } from "./model";

const person = (over: Partial<Person>): Person => ({ personId: "p", given: "A", family: "B", age: 9, isSelf: false, isChild: true, hasDob: true, ...over });

describe("wizard model", () => {
  it("asks a child's guardian for all four answers and an adult only for the terms", () => {
    expect(consentKinds(person({}))).toEqual(["Terms", "GuardianAuthorization", "MedicalEmergency", "Media"]);
    expect(consentKinds(person({ isChild: false, isSelf: true }))).toEqual(["Terms"]);
  });
  it("treats day and camp as physical and online as not", () => {
    expect(isPhysical("Day")).toBe(true);
    expect(isPhysical("Camp")).toBe(true);
    expect(isPhysical("Online")).toBe(false);
  });
  it("sends each open task to the step that fixes it", () => {
    expect(stepForTask("health")).toBe(1);
    expect(stepForTask("emergency_contact")).toBe(2);
    expect(stepForTask("consent_media")).toBe(3);
    expect(stepForTask("consent_terms")).toBe(3);
    expect(stepForTask("something_else")).toBe(4);
  });
});
