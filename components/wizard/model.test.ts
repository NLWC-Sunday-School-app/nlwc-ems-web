import { describe, expect, it } from "vitest";
import { ageRangeText, canSelect, consentKinds, holderRole, isPhysical, joinNames, nearestStep, requiredConsentsGiven, selfEligibility, stepForTask, stepFromDraft, stepsFor, type Entry, type Person } from "./model";
import type { PublicEdition } from "@/lib/types";

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
    expect(stepForTask("health")).toBe("health");
    expect(stepForTask("consent_media")).toBe("permissions");
    expect(stepForTask("consent_terms")).toBe("permissions");
    expect(stepForTask("something_else")).toBe("review");
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

const bootcamp = { name: "Bible Bootcamp", minAge: null, maxAge: 20, camp: { minAge: 10, maxAge: 16 } } as unknown as PublicEdition;
const adultsOnly = { name: "Singlz Summit", minAge: 18, maxAge: null, camp: null } as unknown as PublicEdition;
const me = (over: Partial<Person> = {}) => person({ personId: "me", isSelf: true, isChild: false, age: 40, ageAtEvent: 40, ...over });
const row = (p: Person, over: Partial<Entry> = {}): Entry => ({ person: p, selected: true, mode: "Day", studio: false, ...over });

describe("selfEligibility", () => {
  it("is unknown without a date of birth", () => {
    expect(selfEligibility(bootcamp, me({ hasDob: false, age: null, ageAtEvent: null }))).toBe("unknown");
  });
  it("keeps a parent outside a children's event's ages off the list", () => {
    expect(selfEligibility(bootcamp, me())).toBe("ineligible");
  });
  it("lets an adult within the ages register", () => {
    expect(selfEligibility(bootcamp, me({ age: 19, ageAtEvent: 19 }))).toBe("eligible");
    expect(selfEligibility(adultsOnly, me())).toBe("eligible");
  });
  it("lets a teenager within the ages register themself", () => {
    expect(selfEligibility(bootcamp, me({ age: 15, ageAtEvent: 15 }))).toBe("eligible");
    expect(selfEligibility(bootcamp, me({ age: 2, ageAtEvent: 2 }))).toBe("ineligible");
  });
  it("always shows someone who already has a registration", () => {
    expect(selfEligibility(bootcamp, me(), true)).toBe("eligible");
  });
});

describe("canSelect", () => {
  it("refuses children under 3, without a date of birth, or on an adults-only event", () => {
    expect(canSelect(bootcamp, row(person({ age: 6, ageAtEvent: 6 })))).toBe(true);
    expect(canSelect(bootcamp, row(person({ age: 0, ageAtEvent: 0 })))).toBe(false);
    expect(canSelect(bootcamp, row(person({ hasDob: false, age: null, ageAtEvent: null })))).toBe(false);
    expect(canSelect(adultsOnly, row(person({})))).toBe(false);
  });
});

describe("stepsFor", () => {
  it("shows every step while nobody is chosen", () => {
    expect(stepsFor([])).toEqual(["participants", "health", "pickup", "permissions", "review"]);
  });
  it("skips health and pick-up when everyone is online", () => {
    expect(stepsFor([row(person({}), { mode: "Online" })])).toEqual(["participants", "permissions", "review"]);
  });
  it("skips pick-up for an adult attending in person", () => {
    expect(stepsFor([row(me())])).toEqual(["participants", "health", "permissions", "review"]);
  });
  it("uses the saved registration's mode over the one on screen", () => {
    const saved = row(person({}), { mode: "Online", registration: { participationMode: "Day" } as Entry["registration"] });
    expect(stepsFor([saved])).toContain("pickup");
  });
});

describe("drafts", () => {
  it("reads old numbered drafts and new keyed ones", () => {
    expect(stepFromDraft(0)).toBe("participants");
    expect(stepFromDraft(3)).toBe("permissions");
    expect(stepFromDraft("health")).toBe("health");
    expect(stepFromDraft(undefined)).toBe("participants");
    expect(stepFromDraft("nonsense")).toBe("participants");
  });
  it("moves on to the next step that applies", () => {
    expect(nearestStep(["participants", "permissions", "review"], "health")).toBe("permissions");
    expect(nearestStep(["participants", "health", "pickup", "permissions", "review"], "pickup")).toBe("pickup");
  });
});

describe("wording", () => {
  it("states the ages, with camp when there is one", () => {
    expect(ageRangeText(bootcamp)).toBe("For ages 3–20 · Camp ages 10–16");
    expect(ageRangeText(adultsOnly)).toBe("For ages 18 and over");
  });
  it("joins names naturally", () => {
    expect(joinNames(["Tobi"])).toBe("Tobi");
    expect(joinNames(["Tobi", "Dara"])).toBe("Tobi and Dara");
    expect(joinNames(["Tobi", "Dara", "Ife"])).toBe("Tobi, Dara and Ife");
  });
});
