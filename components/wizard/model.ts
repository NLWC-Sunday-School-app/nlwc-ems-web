import { MIN_REGISTRATION_AGE, ageAllowed } from "../../lib/editions";
import type { ConsentKind, Dependant, ParticipationMode, PublicEdition, Registration } from "@/lib/types";

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
  /** The marker shown beside the name: the account holder's role towards the people they register, or "Child". */
  role?: string;
  hasDob: boolean;
  /** The dependant record behind a child, so their details can be edited in place. */
  dependant?: Dependant;
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

/** Every step in order. Only the ones that apply to the people chosen are shown: see {@link stepsFor}. */
export const ALL_STEPS = ["participants", "health", "pickup", "permissions", "review"] as const;
export type StepKey = (typeof ALL_STEPS)[number];

export const STEP_LABEL: Record<StepKey, string> = {
  participants: "Participants",
  health: "Health & care",
  pickup: "Pick-up persons",
  permissions: "Permissions",
  review: "Review",
};

export const isPhysical = (mode: ParticipationMode) => mode === "Day" || mode === "Camp";

/** How this entry takes part: what the saved registration says, else what is chosen on screen. */
const modeOf = (e: Entry): ParticipationMode => e.registration?.participationMode ?? e.mode;

/** The steps that apply to the people chosen. Health only for anyone attending in person; pick-up only for a child attending in person.
 * With nobody chosen yet, every step is shown so the family can see the whole journey. */
export function stepsFor(chosen: Entry[]): StepKey[] {
  if (chosen.length === 0) return [...ALL_STEPS];
  const inPerson = chosen.filter((e) => isPhysical(modeOf(e)));
  return ALL_STEPS.filter((k) => (k === "health" ? inPerson.length > 0 : k === "pickup" ? inPerson.some((e) => e.person.isChild) : true));
}

/** The step a saved draft points at. Older drafts stored the step's number (0–4); newer ones store its key. */
export function stepFromDraft(raw: unknown): StepKey {
  if (typeof raw === "number" && Number.isInteger(raw)) return ALL_STEPS[Math.max(0, Math.min(ALL_STEPS.length - 1, raw))];
  return typeof raw === "string" && (ALL_STEPS as readonly string[]).includes(raw) ? (raw as StepKey) : "participants";
}

/** The wanted step if it applies, else the next one that does (Review always applies). */
export function nearestStep(steps: StepKey[], wanted: StepKey): StepKey {
  const at = ALL_STEPS.indexOf(wanted);
  return steps.find((k) => ALL_STEPS.indexOf(k) >= at) ?? "review";
}

/** Whether children can take part at all: an event whose youngest age is 18 or more is for adults only. */
export const childrenWelcome = (e: PublicEdition): boolean => e.minAge == null || e.minAge < 18;

/** Whether the account holder can register themself. Under 18 they can't (a guardian must), and their age must fit the event.
 * "unknown" means there is no date of birth to tell. Someone who already has a registration here always counts as eligible. */
export function selfEligibility(e: PublicEdition, self: Person, hasRegistration = false): "eligible" | "ineligible" | "unknown" {
  if (hasRegistration) return "eligible";
  if (!self.hasDob || self.ageAtEvent == null) return "unknown";
  return self.ageAtEvent >= 18 && ageAllowed(e, self.ageAtEvent) ? "eligible" : "ineligible";
}

/** Whether this row can be ticked right now. */
export function canSelect(e: PublicEdition, entry: Entry): boolean {
  if (entry.registration) return true;
  const p = entry.person;
  if (p.isSelf) return selfEligibility(e, p) === "eligible";
  return childrenWelcome(e) && p.hasDob && ageAllowed(e, p.ageAtEvent);
}

/** "For ages 3–20 · Camp ages 10–16". */
export function ageRangeText(e: PublicEdition): string {
  const min = Math.max(e.minAge ?? 0, MIN_REGISTRATION_AGE);
  const main = e.maxAge != null ? `For ages ${min}–${e.maxAge}` : `For ages ${min} and over`;
  const camp = e.camp && (e.camp.minAge != null || e.camp.maxAge != null) ? ` · Camp ages ${e.camp.minAge ?? 0}${e.camp.maxAge != null ? `–${e.camp.maxAge}` : "+"}` : "";
  return main + camp;
}

/** "Tobi", "Tobi and Dara", "Tobi, Dara and Ife". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The registrations the rest of the wizard works on. */
export const active = (entries: Entry[]) => entries.filter((e) => e.selected && e.registration);

/** Which consents to ask for. Presentation only: the API rejects any that don't apply and decides what blocks submit. */
export const consentKinds = (p: Person): ConsentKind[] =>
  p.isChild ? ["Terms", "GuardianAuthorization", "MedicalEmergency", "Media"] : ["Terms"];

/** What the family has answered: registrationId → kind → yes/no. A missing kind is "not answered". */
export type ConsentAnswers = Record<string, Partial<Record<ConsentKind, boolean>>>;

/** True once every required consent has been given for everyone being registered, and a child's photos-and-videos question
 * has been answered either way (a "no" is fine, but it can't be left unanswered). The API still has the final say at submit. */
export function requiredConsentsGiven(entries: Entry[], answers: ConsentAnswers): boolean {
  return entries.length > 0 && entries.every((e) => {
    const given = answers[e.registration?.id ?? ""];
    return consentKinds(e.person).every((k) => (k === "Media" ? given?.[k] !== undefined : given?.[k] === true));
  });
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
  Media: "I consent to clear, individual pictures and videos of my child being used for event publicity. Saying no never stops registration. Saying no means no solo photos, but my child may still appear in group photos.",
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
export function stepForTask(code: string): StepKey {
  if (code === "health") return "health";
  if (code.startsWith("consent_")) return "permissions";
  return "review";
}

/** What to call the account holder when they register dependants: "Parent", "Guardian" or "Parent / guardian"; "Adult" with none. */
export function holderRole(relationships: string[]): string {
  if (relationships.length === 0) return "Adult";
  const parent = relationships.some((r) => r === "Parent");
  const other = relationships.some((r) => r !== "Parent");
  return parent && other ? "Parent / guardian" : parent ? "Parent" : "Guardian";
}
