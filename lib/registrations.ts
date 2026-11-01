import { editionCodeOf } from "./editions";
import type { Dependant, Profile, PublicEdition, Registration } from "./types";

export interface Who { name: string; given: string; age: number | null; isSelf: boolean }

/** Maps person ids to names for the registrations on screen: yourself and your children. */
export function whoMap(profile: Profile, kids: Dependant[], ageOn: (dob: string) => number): Record<string, Who> {
  const map: Record<string, Who> = {
    [profile.personId]: { name: `${profile.givenName} ${profile.familyName}`, given: profile.givenName, age: profile.dateOfBirth ? ageOn(profile.dateOfBirth) : null, isSelf: true },
  };
  for (const k of kids) map[k.personId] = { name: `${k.givenName} ${k.familyName}`, given: k.givenName, age: k.dateOfBirth ? ageOn(k.dateOfBirth) : null, isSelf: false };
  return map;
}

/** The edition a registration belongs to: by id when the API returns one, else by the code in the reference. */
export function editionOf(reg: Registration, editions: PublicEdition[]): PublicEdition | undefined {
  return editions.find((e) => (e.id ? e.id === reg.editionId : e.code === editionCodeOf(reg.reference)));
}

export const isEditable = (reg: Registration) => reg.state === "Draft" || reg.state === "NeedsAction";
export const isLive = (reg: Registration) => !["Cancelled", "Rejected", "Expired"].includes(reg.state);
export const canCancel = (reg: Registration) => ["Draft", "ProvisionalPendingClaim", "Submitted", "NeedsAction", "Confirmed"].includes(reg.state);
