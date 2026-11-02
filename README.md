# nlwc-ems-web

The family-facing portal for NLWC events: Next.js 15 (App Router), React 19, TypeScript, pnpm. It renders what the API says and never decides eligibility, age bands or price itself.

## Screens

| Route | What it does |
|---|---|
| `/events`, `/events/[slug]` | Public editions from `GET /public/edition`: dates, venue, modes, programme days, pick-up window, price state (Free only from an explicit published rule), registration status. Server-rendered. |
| `/signup`, `/verify-email`, `/login` | Email + password. Sign-up never reveals whether an email exists. Google is shown disabled ("coming soon"). `?next=` is honoured, same-site paths only. |
| `/profile` | Name, gender, marital status, country and city, a date of birth you can set once (then shown locked), your emergency contact. |
| `/children` | Dependants aged 0–12, collectors (every day or specific days), per-child emergency contact, removal with a reason. |
| `/events/[slug]/register` | The wizard: Participants, Health & care, Pick-up, Permissions, Review. Drafts are saved on the server, so a family resumes on another device. |
| `/dashboard` | Needs-attention tasks (computed by the API), registrations with status badges, cancel with a reason. |
| `/privacy` | Consent history with document id and version. |

## Run it

```bash
pnpm install
cp .env.example .env.local        # API_URL, default http://localhost:4000
pnpm dev                          # http://localhost:3000
pnpm typecheck && pnpm test && pnpm build
```

The browser only talks to this origin. `next.config.mjs` rewrites `/api/v1/*` to `API_URL`, so the session cookie is first-party and the CSRF double-submit (`nlwc_csrf` cookie echoed in `X-CSRF-Token`) works without CORS. The API must list the portal's origin in `Cors__AllowedOrigins`, and for local HTTP run it with `Security__CookieSecure=false`. `API_URL` is read at build time for `next start`, so set it when you build. See [`e2e/README.md`](e2e/README.md) for a full local stack and a browser walk-through.

## How it is built

- `lib/api.ts`: typed fetch wrapper for the `{success, message, code, data}` envelope. Failures throw `ApiError(status, code, message)`; `friendlyError` maps the registration codes (`dob_required`, `guardian_required`, `camp_age_ineligible`, `already_registered`, `registration_closed`, `registration_incomplete`, `registration_locked`…) to plain language and never shows a raw 5xx body.
- `lib/types.ts`: hand-written from the API's DTOs.
- `lib/auth.tsx`: `AuthProvider` over `GET /auth/me`; `components/RequireAuth.tsx` redirects to `/login?next=…`. Sign-out is a full navigation, so nothing stays in memory.
- `components/wizard/*`: one file per step. Health answers live in memory and on the server only, never in browser storage.
- Styling is the shared `@nlwc/ui` package plus a few lines in `app/portal.css`.

## Stubbed or waiting on the API

- **Google sign-in**: disabled button. **Forgot password / resend verification link**: no endpoints yet, so no UI.
- **Optional communication preferences, "Download my data", "Request correction"**: shown disabled with a note (no API).
- **Edition FAQ, studio and last-day pick-up copy**: marked `TODO` on the event page until an edition content API exists.
- **Consent wording** is placeholder text, labelled as such, until NLWC approves it (Q9). The API records version 0.
- **Studio interest** is saved in the draft only; the API has no studio request yet.
- **Teens 13–16** can't register (API limitation).

## API gaps found while building this

1. **`GET /public/edition` returns no `id`**, but `POST /registration` needs `editionId`, so the wizard can't start a registration from a slug. The portal uses `edition.id` when present. Fix: add `Id` to `PublicEditionDto` and `Id = e.Id` in `EditionService.ToPublicAsync`. Until then registrations are matched to editions by the code at the start of the reference, as a fallback.
2. **`validation_failed` carries no field names** (one joined message), so forms show a form-level error plus client-side checks. Returning `errors: { field: message }` would allow field-level messages.
3. A registration's participation mode **can't be changed** after creation, so the wizard offers "start this registration again" (cancels the draft).
4. No endpoint to **resend the email verification link**, and none for **password reset**.
5. Swagger is only served in Development, so typed clients can't be generated from a deployed API; the types here are hand-written.

## Production deployment

The production workflow builds pull requests targeting `main` without deploying. Pushes to `main` and manual runs on `main` publish a commit-tagged GHCR image and deploy it to the `prod` environment. Configure any required environment approval rules in GitHub.

Set `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_KEY`, and `GHCR_PAT` as secrets in the web repository’s `prod` environment. Set `SERVER_KEY_PASSPHRASE` only if the private key is encrypted. The server account must accept the matching SSH public key, and the PAT must be able to read the GHCR package. Install Docker Compose on the server and allow the Actions token to publish packages.

The web app publishes port `3002` for the reverse proxy; verify that it is free and restrict direct access using the server firewall. Its API proxy is built for `http://host.docker.internal:8082`, using Docker’s host gateway to reach the production API. The API must be deployed on the same host and reachable on that port; Docker and firewall settings must permit the connection. Configure the public domain in the reverse proxy.
