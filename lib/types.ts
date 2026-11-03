// Hand-written from the API's DTOs (nlwc-ems.api/Dtos). Enums are strings on the wire.

export type Gender = "Male" | "Female";
export type ParticipationMode = "Day" | "Camp" | "Online";
export type EditionStage = "Draft" | "Preview" | "RegistrationOpen" | "Closed" | "Live" | "Completed" | "Archived";
export type RegistrationWindow = "NotOpen" | "Open" | "Closed";
export type PriceState = "Pending" | "Free" | "Amount";
export type Capability = "Accommodation" | "DailyCheckin" | "CampReview" | "StudioRequests" | "ParentForum" | "PaidRegistration";
export type GuardianRelationship = "Parent" | "LegalGuardian" | "Grandparent" | "OtherRelative";
export type RegistrationState =
  | "Draft" | "ProvisionalPendingClaim" | "Submitted" | "NeedsAction" | "Confirmed" | "Completed" | "Cancelled" | "Rejected" | "Expired";
export type ConsentKind = "Terms" | "GuardianAuthorization" | "MedicalEmergency" | "Media";

export interface Envelope<T> {
  success: boolean;
  message?: string | null;
  code?: string | null;
  data?: T;
}

// ---- auth ----
export interface SignUpRequest { email: string; password: string; givenName: string; familyName: string; gender?: Gender }
export interface LoginResult { csrfToken: string; mfaVerified: boolean; emailVerified: boolean }
export interface Me { personId: string; surface: string; mfaVerified: boolean; emailVerified: boolean }

// ---- people ----
export interface Contact { fullName: string; relationship: string; phone: string }
export interface Profile {
  personId: string;
  givenName: string;
  familyName: string;
  middleName?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  maritalStatus?: string | null;
  country?: string | null;
  city?: string | null;
  email: string;
  emailVerified: boolean;
  needsDateOfBirth: boolean;
  emergencyContact?: Contact | null;
}
export interface UpdateProfile {
  givenName: string;
  familyName: string;
  middleName?: string | null;
  gender?: Gender | null;
  maritalStatus?: string | null;
  country?: string | null;
  city?: string | null;
  dateOfBirth?: string | null;
}
export interface Dependant {
  personId: string;
  givenName: string;
  familyName: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  relationship: string;
}
export interface AddDependant {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  gender?: Gender;
  relationship: GuardianRelationship;
}
export interface Collector { collectorId: string; fullName: string; relationship: string; phone: string; validDays?: string[] | null }
export interface AddCollector { fullName: string; relationship: string; phone: string; validDays?: string[] | null }

// ---- editions (public) ----
export interface PublicEdition {
  /** Needed to start a registration. The API does not return it yet (see README, "API gaps"). */
  id?: string;
  slug: string;
  code: string;
  name: string;
  timezone: string;
  startsOn: string;
  endsOn: string;
  venue?: { name: string; address?: string | null } | null;
  /** Oldest age (on the day the event starts) that may register, in any mode. Absent means no limit. */
  minAge?: number | null;
  maxAge?: number | null;
  camp?: { minAge?: number | null; maxAge?: number | null } | null;
  pickupWindow?: { start: string; end: string } | null;
  stage?: EditionStage | null;
  registrationWindow: RegistrationWindow;
  capabilities: Capability[];
  price: { state: PriceState };
  days: { day: string; label?: string | null }[];
}

// ---- registration ----
export interface Registration {
  id: string;
  reference: string;
  editionId: string;
  personId: string;
  state: RegistrationState;
  participationMode: ParticipationMode;
  ageOnReferenceDate?: number | null;
  ageBand?: string | null;
  draft: Record<string, unknown>;
  dateCreated: string;
}
export interface ReviewTask { code: string; blocking: boolean }
export interface Review { registrationId: string; state: RegistrationState; openTasks: ReviewTask[]; canSubmit: boolean; holdsPass: boolean }
export interface Health { none: boolean; conditions: string[]; allergies?: string | null; notes?: string | null }
export interface HealthInput { none: boolean; conditions?: string[]; allergies?: string; notes?: string }
export interface Consent { kind: ConsentKind; accepted: boolean; documentId: string; documentVersion: number; answeredAt: string }
export interface Created { id: string }
