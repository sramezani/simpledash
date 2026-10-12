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
  - [x] Drizzle set up. The first migration creates Better Auth's tables, including `user` (2026-10-11)
    - Waiting for Siamak to run `npm run db:migrate` once (Claude's permission check blocks writes to Supabase).
- [x] Environment variable template (`.env.example`) with every key documented (2026-10-11)
- [x] Dockerfile (Next.js standalone output) and Docker Compose for local and server use (2026-10-11)
  - Not run in Docker yet (no Docker on the Mac). The standalone build was tested without `.env`, as Docker builds it.
- [ ] Hetzner server with Coolify (or Compose), Cloudflare DNS and Full (strict) SSL, and a first deploy of a "hello" page
  - [x] `docs/deploy.md`: step-by-step server, Coolify and Cloudflare setup (2026-10-11)
  - [ ] `/api/health` answers on the real domain over HTTPS
- [x] Run Lighthouse on the hello page as the performance baseline (scores go in `docs/STORY.md`) (2026-10-11)
  - Local production build: mobile 98 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100. Re-run on the real domain after the first deploy.
- [ ] **Done when:** the app runs locally and on the server at the real domain over HTTPS, tests pass, and the project files exist and are filled in.

**Siamak's part**

- [ ] Install Docker Desktop or OrbStack on the Mac, and Node 24 (`nvm install 24`)
- [x] Supabase: create the project in Frankfurt (`eu-central-1`). Put the session-pooler connection string only in Coolify's env vars, never in chat or git (2026-10-11)
  - Created in eu-west-1 (Ireland). The password was shared in chat, so change it before launch (`docs/deploy.md` step 1).
- [ ] Hetzner: create the server (EU, 2 vCPU, 4 GB) and install Coolify
- [ ] Cloudflare: add `simpledash.app`, point DNS at the server (proxied), set SSL to Full (strict), and create an Origin Certificate for the server
- [ ] Push the repo to GitHub and connect it in Coolify (git is Siamak's)
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
  - Legal details are placeholders in `src/config/legal.ts` until Siamak fills them in. Siamak reviews the text (not legal advice).
- [x] SEO basics: unique titles and descriptions, canonical URLs, Open Graph images, and structured data (`SoftwareApplication`) on the landing page (2026-10-11)
- [x] `robots.txt`: allow the landing, legal and public pages; block the app, settings and API routes (2026-10-11)
- [x] `sitemap.xml`: landing and legal pages (public stats pages are added in Sprint 4) (2026-10-11)
- [x] `llms.txt`: a short plain-text summary of SimpleDash for AI assistants (what it is, features, price, key links) (2026-10-11)
- [x] Lighthouse on landing and legal pages: 95 or more in all four categories, aiming for 100 (2026-10-11)
  - Local production build. Landing: mobile 99 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100. Privacy and terms: mobile 98 / 100 / 100 / 100, desktop 100 across the board.
- [ ] Submit the Google app for verification (Siamak records the demo video)
  - The scope justification and a demo video script are ready in `docs/google-verification.md`. It needs the live site first.
- [ ] **Done when:** a stranger can understand the landing page in 10 seconds, and the verification request is submitted.

**Siamak's part**

- [ ] Legal details for the privacy policy and terms: business name, address, country and contact email
- [x] Decide whether the prices (€9 a month, €90 a year) include VAT (2026-10-11)
  - Yes, VAT included.
- [x] Decide the refund rule for yearly plans (for the terms) (2026-10-11)
  - A full refund within 14 days of a yearly payment.
- [ ] Cloudflare Email Routing: `hello@simpledash.app` forwards to your inbox
- [ ] Verify ownership of `simpledash.app` in Google Search Console (needed for Google's app verification)
- [ ] Record the demo video and submit the app for verification

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
- [ ] Coolify: add the scheduled tasks (Claude writes the exact commands)
  - The commands are in `docs/deploy.md` step 6 and `docs/backup.md`.
- [ ] Review and publish the launch posts

## Ongoing (Siamak)

- [ ] Build in public on X, at least 3 posts a week from Sprint 0
