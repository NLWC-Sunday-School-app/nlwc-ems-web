# End-to-end walk-through

A real-browser run of the whole portal against a real API and Postgres. It is a script, not part of CI.

It covers: events list and event page, route guard, sign-up (field errors), email verification (including a reused link),
log-in with `next`, profile (date of birth set once, then locked), children (13+ refused, collectors on specific days),
the five-step wizard (camp refused for a 9-year-old, health "Yes needs a condition", consents start unanswered, review
lists what the API says is open, Save draft and resume, partial progress, submit), dashboard, privacy, 375px width, no
medical data in browser storage, sign-out. It writes screenshots to `e2e/out/`.

```bash
# 1. Postgres
docker run -d --name nlwc-web-pg -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=nlwc_web -p 5501:5432 postgres:16

# 2. The API (from the nlwc-ems-api repo). The public edition endpoint must return `id` (see README, "API gaps").
dotnet publish nlwc-ems.api -c Release -o /tmp/nlwc-web-api
export ConnectionStrings__EmsDatabase="Host=localhost;Port=5501;Database=nlwc_web;Username=postgres;Password=pw"
export Security__MasterKey="$(python3 -c "print('ab'*32)")"   # 64 hex characters
export Security__CookieSecure=false Cors__AllowedOrigins__0=http://localhost:3000
export ASPNETCORE_URLS=http://localhost:4010 ASPNETCORE_ENVIRONMENT=Development
(cd /tmp/nlwc-web-api && dotnet nlwc.ems.api.dll --no-launch-profile > /tmp/nlwc-web-api.log 2>&1 &)

# 3. Seed an open, free Bible Bootcamp 2026 (same env as step 2)
python3 e2e/seed.py

# 4. The portal
API_URL=http://localhost:4010 pnpm dev

# 5. The walk-through (Playwright lives outside this repo's dependencies)
mkdir -p /tmp/nlwc-e2e && cd /tmp/nlwc-e2e && npm init -y && npm i playwright && npx playwright install chromium
node /path/to/nlwc-ems-web/e2e/flow.mjs
```
