import { describe, expect, it } from "vitest";
import { consentKinds, holderRole, isPhysical, requiredConsentsGiven, stepForTask, type Entry, type Person } from "./model";

const person = (over: Partial<Person>): Person => ({ personId: "p", given: "A", family: "B", age: 9, ageAtEvent: 9, isSelf: false, isChild: true, hasDob: true, ...over });

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
    expect(stepForTask("consent_media")).toBe(3);
    expect(stepForTask("consent_terms")).toBe(3);
    expect(stepForTask("something_else")).toBe(4);
  });
});

describe("requiredConsentsGiven", () => {
  const entry = (id: string, over: Partial<Person> = {}): Entry => ({
    person: person({ personId: id, ...over }), selected: true, mode: "Day", studio: false,
    registration: { id: `reg-${id}` } as Entry["registration"],
  });
  const yes = { GuardianAuthorization: true, MedicalEmergency: true, Terms: true, Media: true } as const;

  it("is false until there is someone to register", () => {
    expect(requiredConsentsGiven([], {})).toBe(false);
  });
  it("needs parent consent, the pick-up notice and an answer on photos for a child", () => {
    const kid = entry("k");
    expect(requiredConsentsGiven([kid], {})).toBe(false);
    expect(requiredConsentsGiven([kid], { "reg-k": { GuardianAuthorization: true, MedicalEmergency: true } })).toBe(false); // pick-up not yet understood
    expect(requiredConsentsGiven([kid], { "reg-k": { Terms: true } })).toBe(false); // parent consent missing
    expect(requiredConsentsGiven([kid], { "reg-k": { ...yes } })).toBe(true);
    expect(requiredConsentsGiven([kid], { "reg-k": { ...yes, Media: false } })).toBe(true); // a "no" is an answer
    expect(requiredConsentsGiven([kid], { "reg-k": { GuardianAuthorization: true, MedicalEmergency: true, Terms: true } })).toBe(false); // photos unanswered
  });
  it("counts a declined required answer as not given", () => {
    expect(requiredConsentsGiven([entry("k")], { "reg-k": { ...yes, MedicalEmergency: false } })).toBe(false);
  });
  it("needs every child, and only the terms from an adult", () => {
    const kids = [entry("a"), entry("b")];
    expect(requiredConsentsGiven(kids, { "reg-a": { ...yes } })).toBe(false);
    expect(requiredConsentsGiven(kids, { "reg-a": { ...yes }, "reg-b": { ...yes } })).toBe(true);
    expect(requiredConsentsGiven([entry("me", { isChild: false, isSelf: true })], { "reg-me": { Terms: true } })).toBe(true);
  });
});


describe("holderRole", () => {
  it("names the account holder by how they relate to the people they register", () => {
    expect(holderRole([])).toBe("Adult");
    expect(holderRole(["Parent", "Parent"])).toBe("Parent");
    expect(holderRole(["LegalGuardian"])).toBe("Guardian");
    expect(holderRole(["Grandparent", "OtherRelative"])).toBe("Guardian");
    expect(holderRole(["Parent", "Grandparent"])).toBe("Parent / guardian");
  });
});
