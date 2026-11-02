/** What to tell someone when Google sign-in sends them back to the login page with <c>?error=</c>. */
const MESSAGES: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled. You can try again or log in with your email and password.",
  google_email_unverified: "Google hasn't verified that email address, so we can't use it. Verify it with Google, or sign up with your email and password.",
  google_link_needs_password: "An account with this email already exists. Log in with your password first, then you can use Google next time.",
  google_link_conflict: "This email is already linked to a different Google account.",
  google_failed: "We couldn't sign you in with Google. Please try again, or use your email and password.",
};

/** A friendly message for a Google error code, or null when the value isn't one of ours (so a crafted URL shows nothing). */
export function googleErrorMessage(code: string | null | undefined): string | null {
  if (!code || !code.startsWith("google_")) return null;
  return MESSAGES[code] ?? MESSAGES.google_failed;
}

/** The API route that starts Google sign-in. A full page navigation, never a fetch: the browser follows the redirects. */
export function googleStartUrl(next: string): string {
  return `/api/v1/auth/google/start?next=${encodeURIComponent(next)}`;
}
