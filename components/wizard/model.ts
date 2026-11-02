import type { ConsentKind, ParticipationMode, Registration } from "@/lib/types";

/** Someone who can be registered by the signed-in person: themself, or a child. */
export interface Person {
  personId: string;
  given: string;
  family: string;
  /** Display age today. The API decides the age that matters, on the edition's reference date. */
  age: number | null;
  /** Age on the day the edition starts, for the eligibility hints. The API still decides on its own reference date. */
  ageAtEvent: number | null;
  isSelf: boolean;
  /** Dependants are always children (0–12). Yourself is treated as an adult; the API refuses an under-18 self-registration. */
  isChild: boolean;
  hasDob: boolean;
}

/** One row of the first step, and the thread that carries a person through the rest. */
export interface Entry {
  person: Person;
  selected: boolean;
  mode: ParticipationMode;
  studio: boolean;
  registration?: Registration;
  /** Why this person couldn't be registered, in plain language. */
  error?: string;
}

export const STEPS = ["Participants", "Health & care", "Pick-up", "Permissions", "Review"] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4;

export const isPhysical = (mode: ParticipationMode) => mode === "Day" || mode === "Camp";

/** The registrations the rest of the wizard works on. */
export const active = (entries: Entry[]) => entries.filter((e) => e.selected && e.registration);

/** Which consents to ask for. Presentation only: the API rejects any that don't apply and decides what blocks submit. */
export const consentKinds = (p: Person): ConsentKind[] =>
  p.isChild ? ["Terms", "GuardianAuthorization", "MedicalEmergency", "Media"] : ["Terms"];

/** What the family has answered: registrationId → kind → yes/no. A missing kind is "not answered". */
export type ConsentAnswers = Record<string, Partial<Record<ConsentKind, boolean>>>;

/** True once every required consent has been given for everyone being registered. Photos and videos are optional, so a
 * missing or declined answer there never blocks. The API still has the final say at submit. */
export function requiredConsentsGiven(entries: Entry[], answers: ConsentAnswers): boolean {
  return entries.length > 0 && entries.every((e) => consentKinds(e.person).filter((k) => k !== "Media").every((k) => answers[e.registration?.id ?? ""]?.[k] === true));
}

export const CONSENT_TITLE: Record<ConsentKind, string> = {
  Terms: "Event terms",
  GuardianAuthorization: "Parent or guardian consent",
  MedicalEmergency: "Emergency medical treatment",
  Media: "Photos and videos",
};

/** Placeholder wording until NLWC approves the real text (open question Q9). It is shown as such, and the API records version 0. */
export const CONSENT_TEXT: Record<ConsentKind, string> = {
  Terms: "I accept the terms for taking part in this event.",
  GuardianAuthorization:
    "As the parent or legal guardian, I give my consent for my child to take part in this event, and I confirm they are fit to take part in the activities.",
  MedicalEmergency: "In an emergency, I authorise the event team to seek first-aid medical treatment for my child.",
  Media: "I consent to pictures and videos of my child being used in the publicity for this event. Saying no never stops registration.",
};

export const CONDITIONS: { value: string; label: string }[] = [
  { value: "asthma", label: "Asthma" },
  { value: "sickle_cell", label: "Sickle cell" },
  { value: "ulcer", label: "Ulcer" },
  { value: "fatigue", label: "Fatigue" },
  { value: "fever", label: "Fever" },
  { value: "dry_cough", label: "Dry cough" },
  { value: "headache", label: "Headache" },
  { value: "sore_throat", label: "Sore throat" },
  { value: "nausea", label: "Nausea" },
  { value: "breathing_difficulty", label: "Breathing difficulty" },
  { value: "blocked_nose", label: "Blocked or running nose" },
  { value: "loss_of_taste_smell", label: "Loss of taste or smell" },
  { value: "other", label: "Other" },
];

/** Where to send someone to fix an open task. */
export function stepForTask(code: string): StepIndex {
  if (code === "health") return 1;
  if (code === "emergency_contact") return 2;
  if (code.startsWith("consent_")) return 3;
  return 4;
}
