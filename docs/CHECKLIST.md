# SimpleDash V1 checklist

What's done and what's next, in plain words.

- **How to read it:** `[ ]` means to do. `[x]` means done, with the date it was finished.
- **The rule:** a sprint starts only when the previous sprint's **Done when** box is ticked.
- **Siamak's part:** these steps need Siamak's own accounts, money or decisions. Claude prepares exact instructions for each one.
- **The how** is in `docs/SPEC.md`. The **session log** is in `docs/STORY.md`.

## Sprint 0: project setup

- [x] Create the project files from Working rules: `CLAUDE.md`, `README.md`, `docs/SPEC.md`, `docs/CHECKLIST.md`, `docs/STORY.md`, `docs/DECISIONS.md` (2026-10-11)
- [x] Initialise CodeGraph and confirm it indexes the repo (2026-10-11)
  - Done right after the Next.js scaffold, so there is code to index.
- [x] Next.js, TypeScript, Tailwind, shadcn/ui, lint, format and unit-test setup (2026-10-11)
  - [x] `npm run check` runs typecheck, lint and tests, with one passing test (2026-10-11)
- [x] Theme and brand file (`src/config/theme.ts`): all colours, corner radius, shadows and brand facts in one place (2026-10-11)
  - [x] Only theme colours can be used: Tailwind's default colours removed, lint blocks raw colours, and a test checks contrast (2026-10-11)
- [x] Component base: folder layers with import rules, the first shadcn parts, `Logo` and `Container`, and a dev-only `/ui-kit` page that shows every token and component (2026-10-11)
  - [x] `docs/ui.md`: how the theme file, tokens and components work (2026-10-11)
- [ ] Postgres on Supabase (plain Postgres via the ORM) and first migration (users)
  - [ ] Local Postgres in Docker for development. Supabase is for production only
    - `compose.yaml` is ready. Until Docker is installed, development uses Supabase (Siamak's call, 2026-10-11).
    - Since 14 Oct, production runs its own Postgres on the server (see "Hosting" below). Supabase stays for development only, until Docker is on the Mac.
  - [x] Drizzle set up. The first migration creates Better Auth's tables, including `user` (2026-10-11)
    - Waiting for Siamak to run `npm run db:migrate` once (Claude's permission check blocks writes to Supabase).
- [x] Environment variable template (`.env.example`) with every key documented (2026-10-11)
- [x] Dockerfile (Next.js standalone output) and Docker Compose for local and server use (2026-10-11)
  - Not run in Docker yet (no Docker on the Mac). The standalone build was tested without `.env`, as Docker builds it.
- [ ] A server with Docker Compose, Cloudflare DNS and Full (strict) SSL, and a first deploy
  - [x] `docs/deploy.md`: step-by-step server, Coolify and Cloudflare setup (2026-10-11)
  - [x] Replaced on 14 Oct by one command per server (`deploy/setup.sh`) and deploys from GitHub Actions (see "Hosting" below)
  - [ ] `/api/health` answers on the real domain over HTTPS
- [x] Run Lighthouse on the hello page as the performance baseline (scores go in `docs/STORY.md`) (2026-10-11)
  - Local production build: mobile 98 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100. Re-run on the real domain after the first deploy.
- [ ] **Done when:** the app runs locally and on the server at the real domain over HTTPS, tests pass, and the project files exist and are filled in.

**Siamak's part**

- [ ] Install Docker Desktop or OrbStack on the Mac, and Node 24 (`nvm install 24`)
- [x] Supabase: create the project in Frankfurt (`eu-central-1`). Put the session-pooler connection string only in Coolify's env vars, never in chat or git (2026-10-11)
  - Created in eu-west-1 (Ireland). Development only since 14 Oct; production runs its own Postgres.
- [ ] ~~Hetzner: create the server (EU, 2 vCPU, 4 GB) and install Coolify~~ Replaced by "Hosting" below (14 Oct)
- [ ] Cloudflare: add `simpledash.app`, point DNS at the server (proxied), set SSL to Full (strict), and create an Origin Certificate for the server
- [ ] Push the repo to GitHub (git is Siamak's). No Coolify: GitHub Actions deploys (see "Hosting" below)
- [ ] Review `docs/SPEC.md` and `docs/DECISIONS.md`, and flag any default to change

## Sprint 1: connect Google

- [x] Google sign-in with read-only Analytics scope and refresh token, stored encrypted (2026-10-11)
  - [x] Also handle the case where Analytics access was unticked on Google's consent screen (2026-10-11)
  - Built and unit-tested. Not yet tried with a real Google account: it needs the migrations applied and Siamak's own sign-in.
- [x] Automatic property choice after sign-in (only property, or most visitors in the last 7 days), plus a switcher at the top (2026-10-11)
- [x] Sample-data dashboard with a "how to add GA4" banner for users with no GA4 property (2026-10-11)
- [x] GA4 data layer: typed report functions, cache table, refresh-in-background, quota and error handling (2026-10-11)
  - [x] Hourly `warm-cache` job, so dashboards open from cache (2026-10-11)
  - [x] `docs/ga4.md` and `docs/auth.md` written (2026-10-11)
- [x] States: no data yet, access revoked, quota reached (2026-10-11)
  - [x] Also: lost access to the property (2026-10-11)
  - Every state can be seen without signing in on the dev-only `/ui-kit/dashboard` page.
- [ ] **Done when:** Siamak signs in with a real Google account and lands on real numbers within seconds, without choosing anything.

**Siamak's part**

- [ ] Google Cloud: create the project and enable the Google Analytics Data API and Admin API
- [ ] OAuth consent screen (External) with:
  - [ ] App name SimpleDash and the dash logo
  - [ ] Support email
  - [ ] `simpledash.app` as an authorised domain
  - [ ] Scopes `openid`, `email`, `profile` and `analytics.readonly`
- [ ] OAuth Web client with the localhost and `simpledash.app` redirect URIs. Put the ID and secret in `.env.local` and Coolify
  - The ID and secret are in `.env` (2026-10-11). Still to check: both redirect URIs are on the client (`docs/auth.md`).
- [ ] Publish the app "In production" (unverified), so sign-ins don't expire every 7 days
- [ ] Sign in with your real Google account for the "Done when" check

## Sprint 2: core dashboard

- [x] Date switch with comparison to the previous period (2026-10-11)
- [x] Visitors, Page views, Avg. time and Signups cards with % change (2026-10-11)
- [x] Signups empty state: "Which action means a signup?" with a key-event picker, or a how-to if none exist (2026-10-11)
- [x] Visitors chart (2026-10-11)
  - [x] Check that the hourly 7-day chart reads well on a small site; switch to daily if not (2026-10-11)
    - It didn't (a comb of 0s and 1s at about a visitor an hour), so 7 days is now daily. SPEC section 8 and DECISIONS updated.
- [x] Sources, Pages, Countries and Devices ranked lists (2026-10-11)
- [x] Summary line built from the numbers (2026-10-11)
- [x] Responsive layout, checked at 320, 375, 768, 1024 and 1440 px wide (2026-10-11)
  - Checked on `/ui-kit/dashboard` (sample data): no horizontal scrolling at any width; the numbers and chart fit above the fold at 1440 × 900.
- [x] Accessible: keyboard navigation, visible focus, good contrast, and text alternatives for every chart (2026-10-11)
  - Lighthouse on the dashboard preview: Accessibility 100 and Best Practices 100 (mobile and desktop). Every control has a name; the chart has a caption and a "View as table" switch.
- [ ] **Done when:** the dashboard shows a real site correctly, and the numbers match GA4's own reports for the same range.

**Siamak's part**

- [ ] Compare the dashboard with GA4's own reports for the same dates. The list of which GA4 report to check for each card is in `docs/SPEC.md` section 11

## Sprint 3: the extras that make it special

- [x] AI traffic card (2026-10-11)
  - [ ] Confirm GA4's exact "AI Assistant" channel name on a real site
    - Needs real data (Siamak's sign-in). The filter also matches our AI domain list, so a different name only loses the assistants the list doesn't cover.
- [x] Actions card (2026-10-11)
- [x] Live globe with top live pages, loaded lazily so it never slows the page (2026-10-11)
- [x] Chart notes (add, edit, delete), with the empty hint (2026-10-11)
- [x] CSV export on every card (2026-10-11)
- [x] Landing page with a demo dashboard on sample data, statically generated (2026-10-11)
- [x] Privacy policy and terms pages (2026-10-11)
  - Legal details are in `src/config/legal.ts` (SimpleDash, Amsterdam, the Netherlands since 18 Oct); a test fails on any `[...]` placeholder. Siamak reviews the text (not legal advice).
- [x] SEO basics: unique titles and descriptions, canonical URLs, Open Graph images, and structured data (`SoftwareApplication`) on the landing page (2026-10-11)
- [x] `robots.txt`: allow the landing, legal and public pages; block the app, settings and API routes (2026-10-11)
- [x] `sitemap.xml`: landing and legal pages (public stats pages are added in Sprint 4) (2026-10-11)
- [x] `llms.txt`: a short plain-text summary of SimpleDash for AI assistants (what it is, features, price, key links) (2026-10-11)
- [x] Lighthouse on landing and legal pages: 95 or more in all four categories, aiming for 100 (2026-10-11)
  - Local production build. Landing: mobile 99 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100. Privacy and terms: mobile 98 / 100 / 100 / 100, desktop 100 across the board.
- [x] Submit the Google app for verification (Siamak records the demo video) (19 Oct): branding verified; data access under review
  - The scope justification and a demo video script are ready in `docs/google-verification.md`. It needs the live site first.
- [ ] **Done when:** a stranger can understand the landing page in 10 seconds, and the verification request is submitted.

**Siamak's part**

- [x] Legal details for the privacy policy and terms: SimpleDash, Amsterdam, the Netherlands, hello@simpledash.app (18 Oct)
  - Terms strengthened: information not advice, third-party services, public pages, a claims clause, wider liability limits (cap, no indirect losses, one-year claims), ending the agreement, events outside our control, Dutch law and the court in Amsterdam. Privacy: legal bases, security, children, the Dutch authority.
- [ ] Siamak: when SimpleDash is registered (KvK) or has a street address, put the registered name and full address in `src/config/legal.ts`, and have a Dutch lawyer read both pages once before launch
- [x] Decide whether the prices (€9 a month, €90 a year) include VAT (2026-10-11)
  - Yes, VAT included.
- [x] Decide the refund rule for yearly plans (for the terms) (2026-10-11)
  - A full refund within 14 days of a yearly payment.
- [ ] Cloudflare Email Routing: `hello@simpledash.app` forwards to your inbox
- [x] Verify ownership of `simpledash.app` in Google Search Console (needed for Google's app verification) (19 Oct)
- [x] Record the demo video and submit the app for verification (19 Oct)
- [x] Google approves data access (`analytics.readonly`): then the "unverified app" warning disappears (27 Oct, Siamak's screenshot: "Your app's data access has been verified")

## Sprint 4: email, sharing, payment, launch

- [x] Weekly Monday email, on by default, with an off switch in settings and an unsubscribe link (2026-10-12)
  - [x] One-line notice in the dashboard that the email is on, with a way to turn it off (2026-10-12)
  - Sent Monday between 13:00 and 17:59 in the site's time zone, retried hourly in that window. Preview: `/ui-kit/email`. Real sending waits for Resend's domain check.
- [x] Public page: turn on from its card or settings, choose slug and cards, "Powered by SimpleDash" link (2026-10-12)
- [x] Public pages in `sitemap.xml`, with a "let search engines index this page" option (on by default) (2026-10-12)
- [x] Stripe: 14-day trial without card, Starter plan at €9 a month or €90 a year, checkout with the Monthly / Yearly choice, portal (including switching between monthly and yearly), webhook, locked state after the trial (2026-10-12)
  - Checked in test mode: Checkout with Managed Payments and `trial_end`. Switching between monthly and yearly in the Portal needs its "switch plans" setting (Siamak's part below).
  - [x] When the trial ends unpaid, the weekly email and the public page pause too, and all data is kept (2026-10-12)
- [x] Pricing section on the landing page: a Monthly / Yearly switch that needs no JavaScript, Starter (€9 a month or €90 a year, "2 months free") and Growth (€19 a month, "Coming soon", no button) (2026-10-11, built with the landing page in Sprint 3)
  - [x] Plans and prices come only from `src/config/plans.ts`, which also feeds the upgrade screens, structured data and `llms.txt` (2026-10-12)
- [x] Settings: disconnect Google, delete account and all data (2026-10-12)
- [x] Production hardening: nightly database backup to Cloudflare R2, uptime check, error tracking, basic usage counts (signups, connected sites, paying monthly and yearly) (2026-10-12)
  - Code and setup steps are done (`docs/backup.md`, `docs/deploy.md` steps 10 and 11, `/admin`). The R2 bucket and the Sentry project are Siamak's part.
  - [x] Restore one backup into local Postgres to prove it works (2026-10-12)
    - Dumped the Supabase database with `backup.sh --local` and restored it into a throwaway Postgres 17.11: all tables, indexes and migrations came back. Repeat with a file from R2 once it runs.
- [x] Final Lighthouse pass on landing, legal and a public page: 95 or more in all four categories (2026-10-12)
  - Local production build. Landing: mobile 96–99 / 100 / 100 / 100 (the simulated score moves with this Mac's load), desktop 100 across the board. Privacy and terms: mobile 98 / 100 / 100 / 100, desktop 100. Public page (the `/ui-kit/public` preview on sample data): mobile 97 / 100 / 100, desktop 100 / 100 / 100; its SEO score only drops because the preview is `noindex`.
- [x] Launch kit: Product Hunt page, Indie Hackers post, X thread, screenshots (2026-10-12)
  - Drafts in `docs/launch.md`, screenshots in `docs/launch/`. Siamak reviews and posts them.
- [ ] **Done when:** a new user can go from landing page to paying without help, and the launch posts are ready.
  - The posts are ready. The full path still needs a real run on the live site: Google sign-in with a real GA4 property, then Checkout with live keys.

**Siamak's part**

- [ ] Stripe account. Apply for Managed Payments, then create:
  - [ ] The Starter product with two prices, €9 a month and €90 a year (SaaS tax code)
    - Exists in test mode (Claude made it to test Checkout). Live mode is still needed.
  - [ ] The webhook endpoint
  - [ ] The Customer Portal settings, allowing a switch between monthly and yearly
- [ ] Resend: add `simpledash.app` and its SPF, DKIM and DMARC records in Cloudflare
- [ ] Cloudflare R2: a bucket and API token for backups, with a 30-day delete rule
- [ ] Sentry: a project for the server, plus the uptime monitor on `/api/health`
- [x] Scheduled tasks and the nightly backup: in `deploy/crontab`, installed by `deploy/setup.sh` and every deploy, so there's nothing to add by hand (14 Oct)
- [ ] Review and publish the launch posts

## UI polish (Siamak's list, 12 Oct)

- [x] The landing page shows a real dashboard: a live demo at `/demo`, set to `meetline-me` in `src/config/demo.ts` (12 Oct)
- [x] The demo sits in a Mac-style browser window with a fixed height, scrolling inside, with an "Interactive demo" note (12 Oct)
- [x] New overview: site chip and date menu (Today, Yesterday, 7 days, 30 days, 12 months) above one card holding the numbers and a smooth light-blue chart (12 Oct)
- [x] List cards have a fixed height, scroll inside after "Show more", and use the same soft blue (12 Oct)
- [x] Signed in, the landing page shows "Dashboard" instead of "Sign in" (12 Oct)
- [x] Segmented switches slide smoothly (12 Oct)
- [x] Pricing: "2 months free" note with an arrow, rolling prices, "Save €18 / €38 a year", Growth's yearly price (12 Oct)
- [x] Custom date range: "Custom…" in the date menu opens a two-month calendar (one month on phones) with Start/End fields, Clear and Apply; menu keys like DataFast (12 Oct)
- [x] No summary sentence on the pages; the period next to the date menu is smaller and lighter (12 Oct)
- [x] List boxes without titles or CSV buttons; "Details" opens the full list in a modal with search and CSV (12 Oct)
- [x] Devices: Browser | OS | Device tabs with icons; Countries: Country | City (12 Oct)
- [ ] Siamak: open the dashboard and check the Devices card's Browser and OS tabs with live data (not tried from Claude's browser, which isn't signed in)
- [ ] Siamak: add `/demo` to the Cloudflare cache rule, and change the demo slug in `src/config/demo.ts` when the real one is ready
- [ ] Lighthouse on the landing page, `/demo` and a public page after deploy (not run locally this session)

## V2: the Growth plan (planned 13 Oct; details in `docs/SPEC.md` section 28)

**Before starting (Siamak decides)**

- [x] Growth's site limit: 10 sites (13 Oct)
- [x] The trial is Starter only; Growth starts when paid for (13 Oct)
- [x] Revenue connection: a pasted restricted read-only Stripe key (13 Oct)
- [ ] Siamak: run `npm run db:migrate` once, for migrations `0004` (Growth and several sites), `0005` (Search Console) and `0006` (revenue and sales). Until then the app errors on the new columns, the running dev server included.

### Sprint 5: Growth plan and several sites

- [x] Growth in `plans.ts` (€19 / €190) with its new feature list, and the pricing card on sale (13 Oct)
- [x] Stripe: the Growth product and two prices, `billing.plan`, Checkout with `plan`, plan switching in the Portal (13 Oct)
  - Test mode: product and prices made by Claude; Checkout for Growth yearly checked (keeps the trial days). Plan switching for paying customers uses the Portal's confirm flow, which needs the Portal setting below.
- [x] Limits enforced on the server, and an "Upgrade to Growth" panel where Starter hits one (13 Oct)
- [x] `warm-cache` refreshes only sites opened in the last 24 hours (13 Oct)
- [x] Add sites (Growth), the site in the dashboard address, and the All sites page (`/sites`) (13 Oct)
  - Checked on a local copy of the database with a test account and cached sample numbers: site menu, switching, All sites, the picker (search, Added), Settings → Sites, Starter after Growth (paused sites, "Show … instead"). The picker's live Google list needs a real sign-in.
- [x] One public page per site (migration) (13 Oct)
  - Migration `0004_growth_and_sites.sql`, tested on a local Postgres with old rows. **Siamak runs `npm run db:migrate`** (until then the app errors on the new columns).
- [x] The Monday email with one block per site (13 Oct)
  - Preview: `/ui-kit/email?sites=3`.
- [x] ~~Siamak: create the Growth product and prices in Stripe (test and live)~~ Replaced by Pro on 14 Oct (see "Free and Pro" below)
  - The Growth test product isn't used any more and can be archived in Stripe.
- [ ] Siamak: Customer Portal → "Customers can switch plans" with Pro's two prices (test and live)
- [ ] **Done when:** a Growth test user pays in test mode, adds three sites, switches between them and sees all three on `/sites`; a Starter user sees the upgrade panel. (Since 15 Oct: Pro and Free, and the three sites show in the site menu, as `/sites` is gone.)

### Sprint 6: Google search insights

- [x] Connect Search Console from Settings (extra read-only scope, asked only then), matched to the site's domain (13 Oct)
  - Also from the dashboard's "Connect Search Console" card. The live connection needs a real sign-in and the API turned on (below).
- [x] Close to page 1, What changed, Your name vs new people, Seen but not clicked, Searches that lead to signups (13 Oct)
  - Checked on sample data at 1280 and 375 px (`/ui-kit/dashboard?state=growth`), and the data layer once against a local database with Google faked (12 calls, then all from cache).
- [x] Honest notes on screen: 2–3 days behind, rare searches hidden (13 Oct)
- [ ] Siamak: add `webmasters.readonly` to the Google consent screen and get it verified (start on day one)
  - The scope justification and the demo video addition are in `docs/google-verification.md`.
- [ ] Siamak: turn on the **Google Search Console API** in the Google Cloud project (APIs & Services → Library)
- [ ] **Done when:** a Growth test user connects Search Console on a real site and the five views match Search Console's own report for the same days.

### Sprint 7: revenue and sales by source

- [x] Stripe connection in Settings: paste a restricted read-only key (steps shown, checked before saving, write keys refused, stored encrypted), daily totals only (revenue, refunds, new customers, MRR) (13 Oct)
  - Checked once against the Stripe test account (the four reads, paging, the sync into a local database and reading it back). That account has no charges yet, so the totals were zero; the sums are covered by unit tests.
- [x] Revenue and Customers in the overview, revenue bars under the chart, visitors per customer (13 Oct)
- [x] "What counts as a sale?" in Settings, and sales and signups by source and landing page (13 Oct)
- [x] Revenue per source only from GA4 `purchase` values, never estimated (13 Oct)
- [x] The Stripe Checkout warning in Sources (every plan) (13 Oct)
  - Dashboard only; public pages never show it. Preview: `/ui-kit/dashboard?state=growth`.
- [x] The `revenue-sync` job runs hourly from `deploy/crontab`; setup installs it (14 Oct)
- [ ] **Done when:** Siamak's test Stripe account shows the same daily revenue as Stripe's dashboard, and a test purchase event in GA4 shows under its source.

## Hosting: one server, one command (Siamak's call, 14 Oct; `docs/deploy.md`, `docs/SPEC.md` section 21)

- [x] `deploy/compose.yaml`: the app, Postgres 17, Caddy with the Cloudflare Origin Certificate, and the backup helper (14 Oct)
- [x] `deploy/setup.sh`: one command on the Mac sets up a fresh Ubuntu or Debian server (updates, Docker, firewall, deploy user, files), restores the newest backup into an empty database, sets the GitHub secrets, runs the first deploy and, with a token, the Cloudflare DNS (14 Oct)
  - The first run creates `deploy/secrets/` from `.env.example` and stops; checked on a copy of the repo. The server part can only run on a real server.
- [x] `deploy/simpledash` on the server: status, logs, job, backup, restore, stop and start, plus setup and deploy for the tools (14 Oct)
- [x] `.github/workflows/deploy.yml`: checks every pull request; on `main` builds the image and sends it to the server, which goes back to the previous version if the new one isn't healthy (14 Oct)
  - `npm run check` passes in a clean copy without `.env`, as on GitHub's runner. The workflow itself runs for the first time on GitHub.
- [x] Moving servers: `deploy/setup.sh <new> --from <old>` stops the old app, backs it up and restores it on the new one (14 Oct)
- [x] `scripts/backup/restore.sh`: the newest R2 backup into the database; refuses to overwrite data unless asked (14 Oct)
  - Tested on a local Postgres with rclone replaced by a local folder (`docs/backup.md`, "Restore test").

**Siamak's part**

- [ ] Cloudflare: the Origin Certificate, saved as `deploy/secrets/origin.pem` and `origin-key.pem` (`docs/deploy.md` step 1)
- [ ] Cloudflare R2: the bucket and token, into `deploy/secrets/app.env` (`docs/backup.md`)
- [ ] Azure: open ports 80 and 443 in the VM's network security group
- [ ] Push to GitHub (with `.github/workflows/deploy.yml`), then run `deploy/setup.sh azureuser@<server-ip>` once: it asks for anything missing on the way
- [ ] Keep a copy of `deploy/secrets/` in a password manager
- [ ] Tell Claude the Azure region, for the privacy page (it now says "Microsoft Azure" without a place)
- [ ] **Done when:** `https://simpledash.app/api/health` answers over HTTPS, a merge to `main` deploys on its own, and `sudo simpledash backup` puts a file in R2.

## Free and Pro, and open source (Siamak's call, 14 Oct; `docs/SPEC.md` section 16)

- [x] Plans: Free (one site, the last 30 days, a public page with "Powered by SimpleDash") and Pro ($9 a month or $90 a year, tax included, everything). No trial (14 Oct)
  - `plans.ts`, `entitlements`, the webhook (Pro from the price) and checkout without a trial, all unit tested.
- [x] Nothing locks on Free: the locked overlay, the 402s for CSV and live data, and the jobs' "unlocked" filter are gone (14 Oct)
- [x] Free's 30 days: the date menu's Pro badge on 12 months, the calendar starting 30 days back, a note when an older range is asked for, and the same rule for CSV and public pages (14 Oct)
  - `rangeForPlan`, `fitsFreeHistory` and the menu are unit tested, including the site's own time zone.
- [x] The Monday email for Pro only; Settings says so on Free (14 Oct)
- [x] "Powered by SimpleDash" on Free owners' public pages only; the demo always has it (14 Oct)
- [x] Pricing section, hero, FAQ (with "Is it really free?" and "Is SimpleDash open source?"), terms (Free, launch price, 30 days' notice), privacy, `llms.txt` and structured data in dollars (14 Oct)
- [x] Settings → Billing, the "part of Pro" panels and the site menu say Free and Pro (14 Oct)
- [x] Migration `0007_pro_plan.sql`: paid rows become `pro`, `trial_ends_at` dropped (14 Oct)
- [x] Stripe test mode: "SimpleDash Pro" with $9 and $90 USD prices; Checkout with Managed Payments opens at both amounts (14 Oct)
- [x] Open source: README for outsiders with a "What SimpleDash stores" table, NOTICE (trademark and credits), CONTRIBUTING, SECURITY; the server IP and the old password note removed from the docs (14 Oct)
- [x] `LICENSE`: the official AGPL-3.0 text (Siamak added it on GitHub, 14 Oct)

**Siamak's part**

- [ ] Run `npm run db:migrate` (migration 0007, after 0004–0006)
- [ ] Stripe live: the "SimpleDash Pro" product with $9 and $90 tax-inclusive USD prices, their IDs in `deploy/secrets/app.env` (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`); the Portal's plan switching with both
- [ ] Update `docs/ROADMAP.md` (pricing, and the subheadline: "full history from day one" became "the history GA4 already has")
- [ ] Decide on contributor terms before outside pull requests (today: AGPL in, AGPL out, no CLA)
- [ ] Make the GitHub repo public (fresh history or not) before the site goes live: the FAQ and privacy page link to it
- [ ] **Done when:** a new account lands on Free with no card, 12 months shows the Pro badge, upgrading in test mode unlocks everything at once, and the repo is public with its LICENSE.

## Site menu and settings pages (Siamak's list, 15 Oct; `docs/SPEC.md` sections 5, 7 and 28.1)

- [x] Every link and button shows the pointer cursor (15 Oct)
- [x] One site menu for Free and Pro: every Google Analytics site in the Google account, opened with one click, no dialog or Switch button (15 Oct)
  - The opened site joins the user's sites. The menu's rows are unit tested (`src/lib/sites/menu.test.ts`).
- [x] A gear next to each of the user's sites in the menu opens that site's settings (15 Oct)
- [x] "Add a site", "Switch site", "All sites", the picker dialog and the `/sites` page removed, with their code (15 Oct)
- [x] Settings in pages with a menu on the left: Profile, Plan & billing, Monday email, then one page per site. Old `/settings?site=` and `#billing` / `#email` links still land on the right page (15 Oct)
  - Checked on the `/ui-kit` previews at 375 and 1440 px, with a keyboard-only pass of the site menu and the settings menu. The live Google list and opening a site need a real sign-in.
- [x] No site limit: Free and Pro both open every Google Analytics site, and the menu is the same on both ("n of 10 in use" and the Free footer gone). Paused sites, "Show … instead" and the "Several sites are part of Pro" panel removed, with their code. Pricing, hero, FAQ, terms and `llms.txt` updated (15 Oct)
  - Checked on the `/ui-kit` previews (Pro menu, Free menu at 375 px with the keyboard, Free with three sites in settings) and the landing page's pricing text.
- [ ] Siamak: update `docs/ROADMAP.md` (Free was one site, Pro up to 10 sites)
- [x] Ranges end today: Last 7 days, 30 days and 12 months include today so far (dashboard and public pages), compared with the period before; today is dashed and left off the chart until Google reports it. The Monday email keeps last Monday to Sunday (15 Oct)
  - Unit tested (`ranges`, `reports`, `cache`, `series`, email content).
- [ ] **Done when:** Siamak opens another site from the menu on Free and on Pro, and the gear opens that site's settings.

## Content: docs, guides and comparisons (15–16 Oct; `docs/CONTENT-PLAN.md`, `docs/SPEC.md` section 30)

- [x] Content plan written and approved (15 Oct); changelog skipped for now, one early comparison
- [x] Launch kit brought up to date: no trial, all sites on Free, today "still updating" (15 Oct)
- [x] Docs system with Fumadocs: menu, scroll-following "On this page", search, breadcrumbs, metadata, JSON-LD, social images, Markdown copies, `llms.txt` and `llms-full.txt`, sitemap (16 Oct)
- [x] All pages written: 23 docs, 46 guides, 14 glossary pages, 11 comparisons (16 Oct)
  - Every outside link opened and checked; the Framer, Carrd, Webflow, Squarespace, Wix, WordPress.com, Ghost, Stripe key and Next.js steps checked against their own help pages.
  - Content tests: frontmatter, links and anchors, menus, no typed prices, screenshot list.
  - Production build with an empty environment: every page, Markdown copy and social image prerendered. Checked at 375 px with a keyboard pass (skip link, search with Ctrl+K).
- [x] Landing page header and footer link the docs and guides; the app's help links for "no GA4 site", "no key events" and "no purchase values" go to our guides (16 Oct)
- [ ] Siamak: add the screenshots listed in `docs/CONTENT-IMAGES.md`: 11 of 31 are done (SimpleDash's own screens, taken from the previews with `npm run content:screenshots`, 18 Oct); the 20 left are Google, Stripe and site-builder screens
- [ ] Siamak: walk through the GA4 menus in the setup guides once on your own property (they're written from Google's current help pages; screens change)
- [ ] Siamak: Cloudflare → Security settings → Configure AI bot policies (Search and Agent allowed; Training your call)
- [ ] Siamak: Search Console domain property with the sitemap; Bing Webmaster Tools (import from Search Console); Cloudflare Crawler Hints on
- [ ] Lighthouse on `/docs` and a guide on the live site (not installed here)

## Why people pay: customers, changes and one search fix a week (17 Oct; `docs/SPEC.md` section 31)

- [x] Plan written and approved by Siamak: Free sees What changed for visitors; Mark as done remembers the page; What changed goes under the overview (17 Oct)
- [x] **What brings customers** (Pro): first visit next to last visit, paths, time from first visit and landing pages, for signups and sales, with up to two highlight lines (17 Oct)
  - New GA4 reports `first_goals`, `goal_paths`, `goal_days`, `first_purchase` and their thank-you page versions, loaded apart so one refusal hides nothing. Unit tested (`reports`, `counts`, `highlights`).
  - Checked on `/ui-kit/dashboard?state=pro` at 375 and 1440 px: switch, tabs and Details.
- [x] **What changed and where**: under the overview; Visitors on every plan, Signups and Sales on Pro, with landing pages and, for Google, Search Console's searches (17 Oct)
  - New GA4 reports `change_paths`, `change_goals`, `change_sale_page`. Unit tested (`breakdown`). Checked at 375 and 1440 px on Pro, Free and no history; rows open with the keyboard.
- [x] **Brings signups** tab (first when a signup event is set): pages with Google signups, their searches and a Slipping tag (17 Oct)
- [x] **This week** in the Google search card: one page to work on, picked weekly from 28 days, with facts, fixed steps and a guide link; Show another; Mark as done adds a chart note; a follow-up shows how the last page did (17 Oct)
  - Unit tested (`action`, `insights`). Checked on the preview, including the done state, at 375 and 1440 px.
- [x] **Monday email**: What moved, the 30-day customer line and this week's pick (17 Oct)
  - Unit tested (email content); read on `/ui-kit/email` as HTML and plain text.
- [x] Spec section 31, decisions, plans copy, `llms.txt`, README and the docs pages (17 Oct)
- [ ] Siamak, local only: run `npm run db:migrate` once for `0008_search_action_notes`. Production applies it on its own when the new version starts (`docs/deploy.md`); checked on a throwaway Postgres at 0007: "applied 1 new migration", then "nothing new" (17 Oct)
- [ ] Siamak: in GA4 → Explore → Free form, put First user source and Session source in rows and Event count (your signup event) in values. If GA4 allows it, the Paths tab will work; if it doesn't, the card hides that tab
- [ ] **Done when:** on Siamak's own property, What brings customers' First column adds up to the Signups number for the same range, a What changed line matches GA4's Traffic acquisition for the same days, and Mark as done shows on the chart

## Live count and live globe (Siamak's list, 22 Oct; `docs/SPEC.md` section 11.10)

- [x] "● 3 live" beside the date menu on the dashboard, public pages and the demo: one Realtime request every 20 seconds (22 Oct)
- [x] The "Right now" card is gone from the page; the count opens the live view instead (22 Oct)
- [x] Live view: a dialog about 90% of the screen (the whole screen on a phone) with the globe, faces per city, a card per marker, and a panel with the count, page views, signups, visitors per minute and Places, Pages, Devices and Actions tabs; picking a place flies the globe there (22 Oct)
- [x] New globe: MapLibre with SimpleDash's own map data (Natural Earth, `npm run globe:data`), replacing cobe; nothing loads from a map service (22 Oct)
- [x] Live numbers polled and cached for 20 seconds (22 Oct)
- [x] Checked at 1440 and 375 px, keyboard only (Enter opens, focus starts on Close, Esc returns to the count), with no console errors; MapLibre loads only when the view opens. Unit tested: parsing, the 180° fix, marker grouping (22 Oct)
- [x] Spec, decisions, README, `CLAUDE.md`, the docs pages, the privacy credits and a new docs screenshot (22 Oct)
- [ ] Siamak: open the live view on simpledash.app with real visitors and check the places and faces look right

### Live count in the overview (Siamak's list, 24 Oct)

- [x] The live count is the last number of the overview ("● Right now 3", "Open the globe →"), not beside the date menu; the whole tile opens the live view, with a hover background and a focus ring (24 Oct)
- [x] The numbers row wraps when it has no room (Pro with Stripe has 7 cells), and the live count lies flat when alone on a row (24 Oct)
- [x] The dashboard asks for the live count once more 5 seconds after it opens, for an answer at most 5 seconds old, so an owner sees themselves quickly (24 Oct)
- [x] The globe on `/demo` and the landing page: the sample demo now has the live count and globe (24 Oct)
- [x] A lighter night sky behind the globe; "Updates every 20 seconds, from Google Analytics" removed from the panel (24 Oct)
- [x] A proper desktop icon in Devices and the live view (the old one read "00") (24 Oct)
- [x] Checked at 375, 768, 1000 and 1440 px, keyboard only (Tab reaches the help, then the tile; Enter opens; Esc returns focus), the live view inside the landing page's demo frame, and the early ask's timing (5 s with `fresh=1`, then every 20 s, not again after closing the view). `npm run check` passes. Docs pages, 4 screenshots, spec, decisions and README updated (24 Oct)
- [ ] Lighthouse on the landing page, `/demo` and a public page after deploy (not installed here)
- [ ] Siamak: on simpledash.app, open the dashboard and check you show up in Right now within about 5 seconds

### Fix: a false "Google access ended" (26 Oct)

- [x] Google access tokens are kept until a minute before they run out (at most 10 minutes), and one with less than a minute left is swapped for a new one (26 Oct)
- [x] A 401 from GA4 (Data and Admin) or Search Console gets a new token and runs once more; only Google's token server refusing the grant shows "Google access ended" (26 Oct)
- [x] Unit tested (the token cache's lifetime and sharing, the retry, the error mapping, the cache's reconnect marking), and the wiring checked once with Better Auth and Google's token server mocked. `npm run check` passes (26 Oct)
- [ ] Siamak: after the next deploy, watch for the banner; Sentry now gets "GA4 request failed" if a 401 ever survives a new token

### The footer: the word is a chart (27 Oct; `docs/SPEC.md` section 17)

- [x] A brand-coloured footer on the landing and legal pages (first near-black, lightened at Siamak's ask): the tagline, "See my dashboard, free" and three link columns (Product, Learn, Company) (27 Oct)
- [x] A live band of SimpleDash's own live numbers (visitors in the last 30 minutes, countries with flags, pages, devices, "checked … ago"), CSS only, with a pause switch; still for reduced motion (27 Oct)
- [x] The name "SimpleDash" as a chart of the last 10 days: a bar from zero behind each letter, the letter cut out of it, the number and day on top, today lighter; each letter links to its day on the public page; hover or focus explains the day in a sentence (27 Oct)
- [x] The bars rise as the word scrolls into view (CSS scroll-driven, no layout shift); without numbers, the plain dim word at the same size (27 Oct)
- [x] Seven `footer-*` colour tokens with contrast tests, and a white `light` button (27 Oct)
- [x] Unit tested (`footer-data`, the day names); the server part checked once with mocks. `npm run check` passes (27 Oct)
- [x] Checked on `/ui-kit/footer` at 375 and 1440 px, keyboard only (links, pause switch, the 10 letters), reduced motion, and the production build: `/`, `/privacy` and `/terms` partly prerendered with the public `Cache-Control`, no layout shift while scrolling (27 Oct)
- [x] Glass bars and bigger letters (each as wide as in the name); a letter opens a frosted card with its day (odometer number, change from the day before, rank, a light streak), no link; "See all our numbers" removed; "Open source on GitHub" and "Made by Sia" pills; a soft glow (27 Oct)
- [x] The GitHub and X pills open in a new tab; "Pricing" in the top bar and footer glides to the pricing section, every click (27 Oct)
- [x] Footer letters soft by default, bright white on hover, focus or an open card (27 Oct)
- [x] How it works redesigned: a drawing per step (HTML, no images), "01–03", the three reasons in one card; a "Works with" band with "Verified by Google"; ids on every landing section (`#hero`, `#demo`, `#works-with`, `#how-it-works`, `#pricing`, `#faq`, `#footer`) (27 Oct)
- [x] The docs' "unverified app" note says Google has verified SimpleDash (27 Oct)
- [x] Pastel colour in How it works (violet, mint, sky per step and reason) and in the Works with icons (27 Oct)
- [x] The landing demo's address bar reads `simpledash.app/demo` and opens `/demo` in a new tab (27 Oct)
- [x] A public page's address comes from the site's domain (`/p/xyz-com`) and can't be edited in Settings (27 Oct)
- [x] The cookie banner is a full-width bar along the bottom (a sheet on phones), its content lined up with the page, sliding up; Decline and Accept still the same size (27 Oct)
- [ ] Siamak: on simpledash.app's settings page, turn on the public page with the address `simpledash-app` and the cards "Visitors over time" and "Right now" (Countries, Pages and Devices fill the live band). Until then the footer shows the plain word
- [ ] Lighthouse on the landing page and a legal page after deploy (not installed here)

## V3: later (postponed 13 Oct; `docs/SPEC.md` section 29)

- X mentions on the chart · Ask your data in plain English · Milestone images · Hacker News and Product Hunt markers · "Tracking looks broken" alert
- Not decided yet: traffic-drop alert, "new site linked to you", signup funnel

## Ongoing (Siamak)

- [ ] Build in public on X, at least 3 posts a week from Sprint 0
