// End-to-end walk through the portal against a real API. See e2e/README.md. Not part of CI.
import { chromium } from "playwright";
import fs from "node:fs";

const WEB = process.env.WEB_URL ?? "http://localhost:3000";
const API_LOG = process.env.API_LOG ?? "/tmp/nlwc-web-api.log"; // the dev mailer logs verification tokens here
const SHOTS = process.env.SHOTS ?? new URL("./out/", import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });
const email = `fam-${Date.now()}@example.com`;
const log = (...a) => console.log("•", ...a);
const fail = (m) => { console.error("✗ FAIL:", m); process.exitCode = 1; };
const check = (cond, m) => (cond ? log("ok:", m) : fail(m));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true });
const text = async (sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, " ");

// 1 events
await page.goto(`${WEB}/events`);
await page.getByRole("heading", { name: "Bible Bootcamp 2026" }).waitFor();
check((await text("main")).includes("Registration open"), "events list shows Registration open");
await page.getByRole("link", { name: "Register" }).first().click();
await page.waitForURL("**/events/bible-bootcamp-2026");
let body = await text("main");
check(body.includes("Free"), "event page says Free from the API price state");
check(body.includes("4:00pm – 6:00pm"), "event page shows the pick-up window");
check(body.includes("10–16"), "event page shows camp ages");
await shot("01-event");

// 2 guard: wizard redirects to login when signed out
await page.goto(`${WEB}/events/bible-bootcamp-2026/register`);
await page.waitForURL(/\/login\?next=/);
check(decodeURIComponent(page.url()).includes("next=/events/bible-bootcamp-2026/register"), "signed-out wizard redirects to login with next");

// 3 sign up
await page.goto(`${WEB}/signup`);
await page.getByLabel("Email").fill(email);
await page.getByLabel("First name").fill("Kelechi");
await page.getByLabel("Last name").fill("Egwu");
await page.getByLabel("Gender").selectOption("Male");
await page.getByLabel(/^Password/).fill("correct horse battery");
await page.getByLabel("Confirm password").fill("different horse battery");
await page.getByRole("button", { name: "Create account" }).click();
check((await text("main")).includes("passwords don't match"), "mismatched passwords are caught with a field error");
await page.getByLabel("Confirm password").fill("correct horse battery");
await page.getByRole("button", { name: "Create account" }).click();
check((await text("main")).includes("accept the Terms"), "terms must be accepted");
await page.getByLabel(/I accept the Terms/).check();
await page.getByRole("button", { name: "Create account" }).click();
await page.getByRole("heading", { name: "Check your email" }).waitFor();
log("signed up", email);

// 4 verify email using the token the dev mailer logged
await new Promise((r) => setTimeout(r, 500));
const logText = fs.readFileSync(API_LOG, "utf8");
const line = logText.split("\n").filter((l) => l.includes("[mail] verify_email") && l.includes(email)).pop();
const token = /"token": "([^"]+)"/.exec(line ?? "")?.[1];
check(!!token, "found verification token in the API log");
await page.goto(`${WEB}/verify-email?token=${encodeURIComponent(token)}`);
await page.getByText("Your email is confirmed").waitFor();
check(true, "email verified");
await page.goto(`${WEB}/verify-email?token=${encodeURIComponent(token)}`);
await page.getByText("isn't valid any more").waitFor();
check(true, "a used link is reported as no longer valid");

// 5 login (wrong then right)
await page.goto(`${WEB}/login?next=/events/bible-bootcamp-2026/register`);
await page.getByLabel("Email").fill(email);
await page.getByLabel(/^Password/).fill("wrong wrong wrong");
await page.getByRole("button", { name: "Log in" }).click();
await page.locator(".alert[role=alert]").waitFor();
check((await text(".alert[role=alert]")).includes("don't match"), "wrong password shows a plain message");
await page.getByLabel(/^Password/).fill("correct horse battery");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/events/bible-bootcamp-2026/register");
check(true, "login returns to the wizard (next honoured)");

// 6 wizard without a DOB and no children
await page.getByText("Date of birth needed").waitFor();
check(true, "wizard says the profile needs a date of birth");

// 7 profile: set DOB once
await page.goto(`${WEB}/profile`);
await page.getByRole("heading", { name: "My details" }).waitFor();
await page.getByLabel("Day").fill("14"); await page.getByLabel("Month").fill("03"); await page.getByLabel("Year").fill("1988");
await page.getByLabel("Marital status").selectOption("Married");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByText("Your details are saved").waitFor();
await page.getByText("locked").waitFor();
check(true, "DOB set and now locked");
await page.getByLabel("Full name").fill("Ngozi Egwu");
await page.getByLabel("Relationship").fill("Wife");
await page.getByLabel("Phone").fill("08051231180");
await page.getByRole("button", { name: /Save contact/ }).click();
await page.getByText("Pick-up person saved").waitFor();
check(true, "own emergency contact saved");
await shot("02-profile");

// 8 children
await page.goto(`${WEB}/children`);
async function addChild(first, y, m, d) {
  await page.getByRole("button", { name: "+ Add a child" }).click();
  await page.getByLabel("First name").fill(first);
  await page.getByLabel("Last name").fill("Egwu");
  await page.getByLabel("Day").fill(d); await page.getByLabel("Month").fill(m); await page.getByLabel("Year").fill(y);
  await page.getByRole("button", { name: "Save child" }).click();
  await page.getByText("I am this child's parent").waitFor();
  check((await text("main")).includes("confirm you may register"), "guardian confirmation is required");
  await page.getByLabel(/I am this child's parent/).check();
  await page.getByRole("button", { name: "Save child" }).click();
  await page.getByText(first, { exact: false }).first().waitFor();
}
// too old: 13+ is refused by the API with a plain message
await page.getByRole("button", { name: "+ Add a child" }).click();
await page.getByLabel("First name").fill("Teen"); await page.getByLabel("Last name").fill("Egwu");
await page.getByLabel("Day").fill("1"); await page.getByLabel("Month").fill("1"); await page.getByLabel("Year").fill("2010");
await page.getByLabel(/I am this child's parent/).check();
await page.getByRole("button", { name: "Save child" }).click();
await page.locator(".alert[role=alert]").waitFor();
check((await text(".alert[role=alert]")).includes("13 and over"), "a 13+ dependant is refused in plain language");
await page.getByRole("button", { name: "Cancel" }).click();
await addChild("Tobi", "2017", "05", "01");
await addChild("Chidi", "2021", "08", "02");
check((await text("main")).includes("age 9"), "Tobi shows as age 9");

// collector + emergency contact for Tobi
await page.getByRole("button", { name: "Pick-up and contacts" }).first().click();
await page.getByRole("button", { name: "+ Add a person" }).click();
await page.getByLabel("Full name").first().fill("Ade Egwu");
await page.getByLabel("Relationship").first().fill("Uncle");
await page.getByLabel("Phone").first().fill("08033334444");
await page.getByLabel("Only on specific days").check();
await page.getByLabel("Day 1").fill("2026-12-21");
await page.getByRole("button", { name: "Save person" }).click();
await page.getByText("Ade Egwu").waitFor();
check((await text("main")).includes("21 Dec 2026"), "collector saved with a specific day");
await shot("03-children");
await page.getByRole("button", { name: "Hide details" }).click();

// 9 wizard
await page.goto(`${WEB}/events/bible-bootcamp-2026/register`);
await page.getByRole("heading", { name: "Who is attending, and how?" }).waitFor();
check((await text(".stepper")).includes("Participants"), "stepper present");
// camp for a 9-year-old is refused by the API and shown on that person
await page.getByRole("checkbox", { name: /Tobi Egwu/ }).check();
await page.getByRole("group").first().waitFor().catch(() => {});
await page.locator("label.mp-opt", { hasText: "Camping" }).first().click();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByText("Camp is for ages 10 to 16").waitFor();
check(true, "camp_age_ineligible shown in plain language on Tobi");
await page.locator("label.mp-opt", { hasText: "Walk-in" }).first().click();
await page.getByRole("checkbox", { name: /Chidi Egwu/ }).check();
await page.getByRole("checkbox", { name: /Kelechi Egwu/ }).check();
await page.locator(".mp", { hasText: "Kelechi Egwu" }).locator("label.mp-opt", { hasText: "Online" }).click();
await shot("04-wizard-participants");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "Health and care", level: 3 }).first().waitFor();
check((await text(".stepper li.cur")).includes("Health"), "moved to Health & care");
check(!(await text("main")).includes("Kelechi"), "online adult has no health step");

// health: continue without answering -> blocked
await page.getByRole("button", { name: "Continue" }).click();
await page.getByText("Answer Yes or No").first().waitFor();
check(true, "health requires an answer");
await page.getByRole("radio", { name: /^No Nothing to report/ }).check();
await page.getByRole("button", { name: /Chidi/ }).click();
await page.getByRole("radio", { name: /^Yes/ }).check();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByText("Choose a condition").waitFor();
check(true, "Yes needs a condition or text");
await page.getByRole("checkbox", { name: "Asthma" }).check();
await page.getByLabel("Allergies").fill("peanuts");
await shot("05-wizard-health");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: /Who may pick up, and who/ }).waitFor();
check(true, "pick-up step");
await page.locator("section", { hasText: "Chidi Egwu" }).getByRole("heading", { name: "Emergency contact for this child" }).waitFor();
await page.locator("section", { hasText: "Tobi Egwu" }).getByLabel("Full name").last().fill("Ngozi Egwu");
await page.locator("section", { hasText: "Tobi Egwu" }).getByLabel("Relationship").last().fill("Mother");
await page.locator("section", { hasText: "Tobi Egwu" }).getByLabel("Phone").last().fill("08051231180");
await page.locator("section", { hasText: "Tobi Egwu" }).getByRole("button", { name: /Save contact/ }).click();
await page.getByText("Pick-up person saved").first().waitFor();
await shot("06-wizard-pickup");
await page.getByRole("button", { name: "Continue" }).click();

// review before permissions: go straight via the stepper? use Continue to permissions
await page.getByRole("heading", { name: "Permissions", level: 3 }).waitFor();
check((await text("main")).includes("0 of"), "permissions start unanswered");
check(await page.locator(".consent-row input:checked").count() === 0, "no consent radio is pre-selected");
await shot("07-wizard-permissions");
await page.getByRole("button", { name: "Continue" }).click();   // allowed: review explains what is left
await page.getByRole("heading", { name: "Review", level: 3 }).waitFor();
body = await text("main");
check(body.includes("Accept the event terms") && body.includes("Answer the health") === false, "review lists open consent tasks from the API");
check((await page.getByRole("button", { name: "Submit registration" }).isDisabled()), "submit is disabled while required tasks are open");
await shot("08-wizard-review-open");

// go back and answer permissions via the Fix link
await page.getByRole("button", { name: "Fix" }).first().click();
await page.getByRole("heading", { name: "Permissions", level: 3 }).waitFor();
for (const kind of ["Event terms", "Parent or guardian consent", "Emergency medical treatment"]) {
  for (const n of ["Tobi Egwu", "Chidi Egwu"]) await page.getByRole("radiogroup", { name: `${kind} for ${n}` }).getByLabel("I consent").check();
}
await page.getByRole("radiogroup", { name: "Event terms for Kelechi Egwu" }).getByLabel("I consent").check();
await page.getByRole("radiogroup", { name: "Photos and videos for Chidi Egwu" }).getByLabel("I do not consent").check();
await page.locator(".ph-row", { has: page.getByRole("radiogroup", { name: "Photos and videos for Chidi Egwu" }) }).locator(".st-no").waitFor({ state: "visible" });
await shot("09-wizard-permissions-done");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "Review", level: 3 }).waitFor();
await page.getByText("✓ Ready").first().waitFor();
body = await text("main");
check(body.includes("Tobi's pass stays") || body.includes("Tobi") && body.includes("stays \"Pending\""), "Tobi's pass is held until media is answered (Q20 default)");
check(body.includes("₦0 · Free"), "review shows the free price from the API");
check(!(await page.getByRole("button", { name: "Submit registration" }).isDisabled()), "submit enabled once required tasks are done (media unanswered doesn't block)");
await shot("10-wizard-review");

// Chidi has no emergency contact yet: the API says so and the review points at the fix
check(body.includes("Add a pick-up person"), "review lists Chidi's missing emergency contact from the API");

// save and exit, see the drafts on the dashboard, resume at the review step
await page.getByRole("button", { name: "Save draft and exit" }).click();
await page.waitForURL("**/dashboard");
await page.getByText("Tobi Egwu").first().waitFor();
await page.getByText("Add a pick-up person").first().waitFor();
body = await text("main");
check(body.includes("Hello, Kelechi") && body.includes("Draft"), "dashboard shows the drafts");
check(body.includes("Answer the photo and video permission"), "dashboard lists the optional media task");
check(body.includes("Add a pick-up person"), "dashboard lists Chidi's blocking task");
await shot("11-dashboard-drafts");
await page.getByRole("link", { name: "Finish" }).first().click();
await page.waitForURL("**/register");
await page.getByRole("heading", { name: "Review", level: 3 }).waitFor();
check(true, "resumed straight to the review step from the server-saved draft");

// fix Chidi's contact from the review
await page.locator(".person-pill", { hasText: "Chidi" }).getByRole("button", { name: "Fix" }).click();
await page.getByRole("heading", { name: /Who may pick up, and who/ }).waitFor();
const chidi = page.locator("section", { hasText: "Chidi Egwu" });
await chidi.getByLabel("Full name").last().fill("Ngozi Egwu");
await chidi.getByLabel("Relationship").last().fill("Mother");
await chidi.getByLabel("Phone").last().fill("08051231180");
await chidi.getByRole("button", { name: /Save contact/ }).click();
await page.getByText("Pick-up person saved").first().waitFor();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "Permissions", level: 3 }).waitFor();
await page.waitForFunction(() => document.querySelectorAll('.ph-row input[value="yes"]:checked').length >= 7, null, { timeout: 8000 }).catch(() => {});
check(await page.locator('.ph-row input[value="yes"]:checked').count() >= 7, "earlier consent answers were reloaded from the server");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "Review", level: 3 }).waitFor();
await page.getByText("✓ Ready").first().waitFor();
check((await page.getByText("✓ Ready").count()) === 3, "all three people are ready");
await page.getByRole("button", { name: "Submit registration" }).click();
await page.getByRole("heading", { name: "You're registered" }).waitFor();
body = await text("main");
check(/BB26-\d{4}-[A-Z]\d/.test(body), "success shows human-readable references");
check((body.match(/Confirmed/g) ?? []).length >= 3, "free edition confirms on submit");
await shot("12-registered");

await page.goto(`${WEB}/dashboard`);
await page.getByText("Confirmed").first().waitFor();
check((await page.getByText("Confirmed").count()) >= 3, "dashboard shows confirmed registrations");
await page.goto(`${WEB}/privacy`);
await page.getByText("Photos and videos").first().waitFor();
body = await text("main");
check(body.includes("Declined") && body.includes("BB26-media"), "privacy shows consent history with document ids");
await shot("13-privacy");

// phone width
await page.setViewportSize({ width: 375, height: 800 });
await page.goto(`${WEB}/events/bible-bootcamp-2026`);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check(!overflow, "no horizontal scroll at 375px (event page)");
await page.goto(`${WEB}/dashboard`);
check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)), "no horizontal scroll at 375px (dashboard)");
check(await page.locator(".tabbar").isVisible(), "tab bar visible on phone");
await shot("14-phone-dashboard");

// local storage holds no health data
const ls = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
check(!/asthma|peanut/i.test(ls), "no medical data in browser storage");

// logout
await page.setViewportSize({ width: 1100, height: 900 });
await page.getByText("Account", { exact: true }).click();
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL("**/events");
await page.goto(`${WEB}/dashboard`);
await page.waitForURL(/\/login/);
check(true, "after sign-out the dashboard redirects to login");

const real = consoleErrors.filter((e) => !/favicon|fonts\.g|Failed to load resource/i.test(e));
check(real.length === 0, `no console errors${real.length ? ": " + real.join(" | ") : ""}`);
await browser.close();
