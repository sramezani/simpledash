# SimpleDash V1 checklist

What's done and what's next, in plain words.

- **How to read it:** `[ ]` means to do. `[x]` means done, with the date it was finished.
- **The rule:** a sprint starts only when the previous sprint's **Done when** box is ticked.
- **Siamak's part:** these steps need Siamak's own accounts, money or decisions. Claude prepares exact instructions for each one.
- **The how** is in `docs/SPEC.md`. The **session log** is in `docs/STORY.md`.

## Sprint 0: project setup

- [x] Create the project files from Working rules: `CLAUDE.md`, `README.md`, `docs/SPEC.md`, `docs/CHECKLIST.md`, `docs/STORY.md`, `docs/DECISIONS.md` (2026-10-11)
- [ ] Initialise CodeGraph and confirm it indexes the repo
  - Done right after the Next.js scaffold, so there is code to index.
- [ ] Next.js, TypeScript, Tailwind, shadcn/ui, lint, format and unit-test setup
  - [ ] `npm run check` runs typecheck, lint and tests, with one passing test
- [ ] Theme and brand file (`src/config/theme.ts`): all colours, corner radius, shadows and brand facts in one place
  - [ ] Only theme colours can be used: Tailwind's default colours removed, lint blocks raw colours, and a test checks contrast
- [ ] Component base: folder layers with import rules, the first shadcn parts, `Logo` and `Container`, and a dev-only `/ui-kit` page that shows every token and component
  - [ ] `docs/ui.md`: how the theme file, tokens and components work
- [ ] Postgres on Supabase (plain Postgres via the ORM) and first migration (users)
  - [ ] Local Postgres in Docker for development. Supabase is for production only
  - [ ] Drizzle set up. The first migration creates Better Auth's tables, including `user`
- [ ] Environment variable template (`.env.example`) with every key documented
- [ ] Dockerfile (Next.js standalone output) and Docker Compose for local and server use
- [ ] Hetzner server with Coolify (or Compose), Cloudflare DNS and Full (strict) SSL, and a first deploy of a "hello" page
  - [ ] `docs/deploy.md`: step-by-step server, Coolify and Cloudflare setup
  - [ ] `/api/health` answers on the real domain over HTTPS
- [ ] Run Lighthouse on the hello page as the performance baseline (scores go in `docs/STORY.md`)
- [ ] **Done when:** the app runs locally and on the server at the real domain over HTTPS, tests pass, and the project files exist and are filled in.

**Siamak's part**

- [ ] Install Docker Desktop or OrbStack on the Mac, and Node 24 (`nvm install 24`)
- [ ] Supabase: create the project in Frankfurt (`eu-central-1`). Put the session-pooler connection string only in Coolify's env vars, never in chat or git
- [ ] Hetzner: create the server (EU, 2 vCPU, 4 GB) and install Coolify
- [ ] Cloudflare: add `simpledash.app`, point DNS at the server (proxied), set SSL to Full (strict), and create an Origin Certificate for the server
- [ ] Push the repo to GitHub and connect it in Coolify (git is Siamak's)
- [ ] Review `docs/SPEC.md` and `docs/DECISIONS.md`, and flag any default to change

## Sprint 1: connect Google

- [ ] Google sign-in with read-only Analytics scope and refresh token, stored encrypted
  - [ ] Also handle the case where Analytics access was unticked on Google's consent screen
- [ ] Automatic property choice after sign-in (only property, or most visitors in the last 7 days), plus a switcher at the top
- [ ] Sample-data dashboard with a "how to add GA4" banner for users with no GA4 property
- [ ] GA4 data layer: typed report functions, cache table, refresh-in-background, quota and error handling
  - [ ] Hourly `warm-cache` job, so dashboards open from cache
  - [ ] `docs/ga4.md` and `docs/auth.md` written
- [ ] States: no data yet, access revoked, quota reached
  - [ ] Also: lost access to the property
- [ ] **Done when:** Siamak signs in with a real Google account and lands on real numbers within seconds, without choosing anything.

**Siamak's part**

- [ ] Google Cloud: create the project and enable the Google Analytics Data API and Admin API
- [ ] OAuth consent screen (External) with:
  - [ ] App name SimpleDash and the dash logo
  - [ ] Support email
  - [ ] `simpledash.app` as an authorised domain
  - [ ] Scopes `openid`, `email`, `profile` and `analytics.readonly`
- [ ] OAuth Web client with the localhost and `simpledash.app` redirect URIs. Put the ID and secret in `.env.local` and Coolify
- [ ] Publish the app "In production" (unverified), so sign-ins don't expire every 7 days
- [ ] Sign in with your real Google account for the "Done when" check

## Sprint 2: core dashboard

- [ ] Date switch with comparison to the previous period
- [ ] Visitors, Page views, Avg. time and Signups cards with % change
- [ ] Signups empty state: "Which action means a signup?" with a key-event picker, or a how-to if none exist
- [ ] Visitors chart
  - [ ] Check that the hourly 7-day chart reads well on a small site; switch to daily if not
- [ ] Sources, Pages, Countries and Devices ranked lists
- [ ] Summary line built from the numbers
- [ ] Responsive layout, checked at 320, 375, 768, 1024 and 1440 px wide
- [ ] Accessible: keyboard navigation, visible focus, good contrast, and text alternatives for every chart
- [ ] **Done when:** the dashboard shows a real site correctly, and the numbers match GA4's own reports for the same range.

**Siamak's part**

- [ ] Compare the dashboard with GA4's own reports for the same dates. The list of which GA4 report to check for each card is in `docs/SPEC.md` section 11

## Sprint 3: the extras that make it special

- [ ] AI traffic card
  - [ ] Confirm GA4's exact "AI Assistant" channel name on a real site
- [ ] Actions card
- [ ] Live globe with top live pages, loaded lazily so it never slows the page
- [ ] Chart notes (add, edit, delete), with the empty hint
- [ ] CSV export on every card
- [ ] Landing page with a demo dashboard on sample data, statically generated
- [ ] Privacy policy and terms pages
- [ ] SEO basics: unique titles and descriptions, canonical URLs, Open Graph images, and structured data (`SoftwareApplication`) on the landing page
- [ ] `robots.txt`: allow the landing, legal and public pages; block the app, settings and API routes
- [ ] `sitemap.xml`: landing and legal pages (public stats pages are added in Sprint 4)
- [ ] `llms.txt`: a short plain-text summary of SimpleDash for AI assistants (what it is, features, price, key links)
- [ ] Lighthouse on landing and legal pages: 95 or more in all four categories, aiming for 100
- [ ] Submit the Google app for verification (Siamak records the demo video)
- [ ] **Done when:** a stranger can understand the landing page in 10 seconds, and the verification request is submitted.

**Siamak's part**

- [ ] Legal details for the privacy policy and terms: business name, address, country and contact email
- [ ] Decide whether the prices (€9 a month, €90 a year) include VAT
- [ ] Decide the refund rule for yearly plans (for the terms)
- [ ] Cloudflare Email Routing: `hello@simpledash.app` forwards to your inbox
- [ ] Verify ownership of `simpledash.app` in Google Search Console (needed for Google's app verification)
- [ ] Record the demo video and submit the app for verification

## Sprint 4: email, sharing, payment, launch

- [ ] Weekly Monday email, on by default, with an off switch in settings and an unsubscribe link
  - [ ] One-line notice in the dashboard that the email is on, with a way to turn it off
- [ ] Public page: turn on from its card or settings, choose slug and cards, "Powered by SimpleDash" link
- [ ] Public pages in `sitemap.xml`, with a "let search engines index this page" option (on by default)
- [ ] Stripe: 14-day trial without card, Starter plan at €9 a month or €90 a year, checkout with the Monthly / Yearly choice, portal (including switching between monthly and yearly), webhook, locked state after the trial
  - [ ] When the trial ends unpaid, the weekly email and the public page pause too, and all data is kept
- [ ] Pricing section on the landing page: a Monthly / Yearly switch that needs no JavaScript, Starter (€9 a month or €90 a year, "2 months free") and Growth (€19 a month, "Coming soon", no button)
  - [ ] Plans and prices come only from `src/config/plans.ts`, which also feeds the upgrade screens, structured data and `llms.txt`
- [ ] Settings: disconnect Google, delete account and all data
- [ ] Production hardening: nightly database backup to Cloudflare R2, uptime check, error tracking, basic usage counts (signups, connected sites, paying monthly and yearly)
  - [ ] Restore one backup into local Postgres to prove it works
- [ ] Final Lighthouse pass on landing, legal and a public page: 95 or more in all four categories
- [ ] Launch kit: Product Hunt page, Indie Hackers post, X thread, screenshots
- [ ] **Done when:** a new user can go from landing page to paying without help, and the launch posts are ready.

**Siamak's part**

- [ ] Stripe account. Apply for Managed Payments, then create:
  - [ ] The Starter product with two prices, €9 a month and €90 a year (SaaS tax code)
  - [ ] The webhook endpoint
  - [ ] The Customer Portal settings, allowing a switch between monthly and yearly
- [ ] Resend: add `simpledash.app` and its SPF, DKIM and DMARC records in Cloudflare
- [ ] Cloudflare R2: a bucket and API token for backups, with a 30-day delete rule
- [ ] Sentry: a project for the server, plus the uptime monitor on `/api/health`
- [ ] Coolify: add the scheduled tasks (Claude writes the exact commands)
- [ ] Review and publish the launch posts

## Ongoing (Siamak)

- [ ] Build in public on X, at least 3 posts a week from Sprint 0
