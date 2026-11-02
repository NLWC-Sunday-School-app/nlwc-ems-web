import type { Envelope } from "./types";

/** A failed call. <c>code</c> is the API's stable machine-readable reason (dob_required, already_registered…), or null. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const PREFIX = "/api/v1";

/** Fired on <c>window</c> when the API says the session is no longer valid. */
export const SESSION_ENDED = "nlwc:session-ended";

/** Browser: same origin (the Next.js rewrite proxies to the API). Server components: straight to the API. */
function base(): string {
  return typeof window === "undefined" ? (process.env.API_URL ?? "http://localhost:4000") : "";
}

/** The CSRF token the API set in a readable cookie. State-changing calls echo it back in X-CSRF-Token (double-submit). */
export function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)nlwc_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const token = csrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  let response: Response;
  try {
    response = await fetch(`${base()}${PREFIX}${path}`, {
      ...init,
      method,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "network", "We couldn't reach the server. Check your connection and try again.");
  }

  const text = await response.text();
  let envelope: Envelope<T> | null = null;
  try {
    envelope = text ? (JSON.parse(text) as Envelope<T>) : null;
  } catch {
    // A 5xx from the proxy or a crash is not our envelope; never show raw text to a family.
  }

  // A 401 on anything but sign-in itself means the session ended (idle timeout, signed out elsewhere). Tell the app, so it
  // stops showing a signed-in page and sends the person to sign in rather than leaving them with a dead form.
  if (response.status === 401 && typeof window !== "undefined" && path !== "/auth/login" && path !== "/auth/me") {
    window.dispatchEvent(new Event(SESSION_ENDED));
  }

  if (!response.ok || (envelope && envelope.success === false)) {
    const fallback = response.status >= 500 ? "Something went wrong on our side. Please try again." : "That didn't work. Please try again.";
    throw new ApiError(response.status, envelope?.code ?? null, envelope?.message || fallback);
  }
  return envelope?.data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>("GET", path, undefined, init),
  post: <T = void>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T = void>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  del: <T = void>(path: string) => request<T>("DELETE", path),
};

/** The code of an ApiError, or null for anything else. */
export const errorCode = (e: unknown): string | null => (e instanceof ApiError ? e.code : null);

/** A message safe to show a person. */
export const errorMessage = (e: unknown): string => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

/** Plain-language replacements for the codes the registration flow can hit. Falls back to the API's own message. */
const FRIENDLY: Record<string, string> = {
  dob_required: "Add your date of birth in your profile before registering.",
  guardian_required: "A parent or guardian needs to register anyone under 18.",
  camp_age_ineligible: "Camp is for ages 10 to 16, so this person can only take part by day or online.",
  already_registered: "This person is already registered for this event.",
  registration_closed: "Registration for this event isn't open right now.",
  registration_incomplete: "A few steps are still open. Finish them and submit again.",
  registration_locked: "This registration has been submitted and can't be changed here.",
  too_old_for_dependant: "Only people under 18 can be added as a child. Adults manage their own profile.",
  adult_registers_themself: "This person is 18 or over at the time of the event, so they need to register themself.",
  dob_locked: "Your date of birth was already set. To change it, contact the team.",
  invalid_date_of_birth: "Enter a real date of birth.",
  invalid_phone: "Enter a valid phone number, for example 0803 123 4567.",
  unauthenticated: "Please sign in to continue.",
  bad_origin: "This request was blocked for your protection. Reload the page and try again.",
};

export function friendlyError(e: unknown): string {
  const code = errorCode(e);
  return (code && FRIENDLY[code]) || errorMessage(e);
}
