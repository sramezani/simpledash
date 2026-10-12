# SimpleDash story

A dated log with one entry per session. **Newest entry first.**

It is written for future Claude sessions: read the latest entry before starting work. Ideas that fall outside the roadmap go here too (Working rule 5).

## 2026-10-12 · Session 4 · Sprint 4 built: V1 is complete in code

### Done

- **Billing:** the trial row for every new user, plan states (paid, trial, locked), the locked overlay with Monthly / Yearly and "Upgrade", Checkout with Managed Payments and `trial_end`, the Customer Portal, and the webhook (newest state wins, repeats skipped). Locked accounts read only cached numbers: no Google calls, no CSV or live data, no email, and the public page pauses. Test-mode product "SimpleDash Starter" with VAT-inclusive €9 and €90 prices (SaaS tax code). `docs/billing.md`.
- **Weekly email:** React Email template, the hourly job (Monday 13:00–17:59 local, claims in `email_send`, Resend batches, `List-Unsubscribe` one-click), the signed unsubscribe page and endpoint, the dashboard notice, the settings switch. `docs/email.md`.
- **Public page** `/p/<slug>`: cached data (`"use cache"`, tag `public:<slug>`), the chosen cards with the server-rendered chart, the Right now card fetching in the browser, "Powered by SimpleDash", the paused page, metadata and its own social image, `/api/p/<slug>/live`, sitemap entries, and `Cache-Control: s-maxage=600` (checked on the production build). The dashboard's "Share your stats publicly?" card turns it on in one click. `docs/public-page.md`.
- **Settings in full:** account, weekly email, public page form (address, cards, indexing, copy link), billing in plain words, disconnect Google, delete account. Split into `SettingsView` with dev previews `/ui-kit/settings` and `/ui-kit/public`.
- **Hardening:** Sentry on the server only (all data collection off, cron monitor on the weekly email), `/admin` usage counts, the backup container (`scripts/backup/`) with `docs/backup.md`.
- **Restore test:** dumped Supabase with `backup.sh --local` and restored it into a throwaway Postgres 17.11 (no Docker on this Mac): every table, index and migration came back.
- **Lighthouse** (local production build): landing mobile 96–99 / 100 / 100 / 100 and desktop 100s; privacy and terms 98 / 100 / 100 / 100 mobile, 100s desktop; the public page preview 97 / 100 / 100 mobile and 100 / 100 / 100 desktop (SEO 66 only because the preview is `noindex`). Settings, dashboard and the small pages: accessibility and best practices 100.
- **Launch kit:** `docs/launch.md` (Product Hunt page, Indie Hackers post, X thread) and 7 screenshots in `docs/launch/`.
- Checked at 375, 768 and 1440 px: settings (every state), the public page (all cards, default, paused), the dashboard with the notice and share card, unsubscribe, account deleted, sign-in after disconnect.
- 239 unit tests pass; typecheck and lint are clean.

### Reviews

- **Code review (15 findings, all fixed):** sign-out wrote cookie deletions without `Secure`, which browsers ignore for `__Secure-` cookies; the weekly email could send a cached copy of another week when Google couldn't be asked; a deploy during the send could lose a week's email (claims are now taken over after 30 minutes); the backup pipeline hid `pg_dump` failures (`pipefail`); a subscription paid after account deletion would keep charging (now cancelled and reported); the public Right now card jumped while loading; `SENTRY_DSN` was read outside `env.ts`; public live polls hit the database every time (60-second lookup cache); a failed Stripe check could still delete the account; double-click and slug races; an N+1 sitemap query; unknown-price alerts for unrelated products; unsubscribe for deleted accounts; the admin page's title; 12 count queries.
- **Security review (manual, as before: the command needs a git remote):** backups no longer contain session tokens (`session` and `verification` rows are left out); a malformed URL hash could crash the settings page. Everything else checked out: webhook signature first, prices chosen on the server, HMAC unsubscribe tokens with a confirm button, no private data on public pages, every action starts with `requireUser()`.

### Learned

- **Dates inside raw sql`` templates break with Drizzle's postgres.js setup:** the driver only converts a Date bound to a column. The billing upsert had `${stateAt}` in a raw template, so every update to an existing billing row would have failed in production. Unit tests used fakes and couldn't see it; running the new queries against the restored copy did. Use `lte()`, `gt()` and friends, never a raw Date.
- A page streamed inside Suspense can't change its status code, so an unknown public page is "Page not found" with `noindex` and status 200 (logged in DECISIONS).
- Lighthouse's simulated mobile score on the landing page moves between 96 and 99 with this Mac's load: the observed paint is 50 ms either way.
- Next.js keeps a `Cache-Control` header from `next.config.ts` on partially prerendered pages.
- In Sentry v11, `sendDefaultPii` is gone; `dataCollection` controls what is sent.

### Next (mostly Siamak's part, see the checklist)

1. Sign in once with your real Google account on localhost and check the dashboard, then the Monday email with `node scripts/run-job.mjs weekly-email` on a Monday afternoon (or ask Claude for a one-off test send).
2. Stripe live mode: Managed Payments, the product and prices, the webhook endpoint, and the Portal's "switch plans" setting (it's off in test mode too).
3. Resend domain, R2 bucket and token, Sentry project with the uptime monitor, the Coolify scheduled tasks (`docs/deploy.md` steps 6–10, `docs/backup.md`).
4. Rotate the Supabase password before launch (it was shared in a chat).
5. Fill in `src/config/legal.ts`, deploy, then Google's app verification.
6. Review and post the launch kit.

### Ideas (outside the roadmap, not built)

- A "Send me a test email" button in settings, so people can see the Monday email before Monday.
- Let the public page show a custom title instead of the domain.

## 2026-10-11 · Session 3 · Sprint 4 started (stopped at the usage limit)

### Done so far

- Schema and migration `0003_email_public_page_billing.sql`: `user_settings`, `public_page`, `billing` (with `state_at`, so older Stripe events can't overwrite newer ones), `email_send`, `stripe_event`. It ends with a backfill that gives existing users a 14-day trial and default settings.
- Installed (pinned): `stripe` 23.0.0 (API `2026-09-30.endive`; Managed Payments is `managed_payments: { enabled: true }` on the Checkout Session), `resend` 6.32.1, `@react-email/components` 1.0.12, `@sentry/nextjs` 11.6.0. These still need lines in DECISIONS (the plan already names them).
- The Stripe test account already has two unrelated products, "STANDARD" and "BASIC" (USD). They're left alone. The account is in NL with EUR as the default currency.

### Next (Sprint 4 plan)

1. Create the Starter product (tax code `txcd_10103001`) with two VAT-inclusive EUR prices (900 a month, 9000 a year). Put the IDs in `.env` as `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`, and add the Sprint 4 keys to `env.ts`.
2. Billing:
   - `getPlan` and the locked state (dashboard overlay with `BillingSwitch` + "Upgrade"; reports read from cache only).
   - `startCheckout`, the Customer Portal, and the webhook with tests.
3. Weekly email: the React Email template, the unsubscribe token (HMAC) with tests, the `weekly-email` job with the Resend batch API, the dashboard notice, and the switch in settings.
4. Public page `/p/[slug]`:
   - Cached data, `updateTag` on changes, the paused state, a per-page Open Graph image.
   - `/api/p/[slug]/live`, and public pages in the sitemap.
5. Settings in full: disconnect Google, delete account (type DELETE).
6. Hardening: Sentry (server only), the backup container and `docs/backup.md`, `/admin` usage counts.
7. Final Lighthouse pass, the launch kit, the reviews, the docs.

## 2026-10-11 · Session 3 · Sprint 3 built (the extras)

### Done

- **AI traffic card:** assistants and their landing pages. It counts GA4's "AI Assistant" channel or our domain list.
- **Actions card:** downloads, outbound clicks, form submits and signups. Zero rows are hidden, with an Enhanced Measurement how-to when everything is zero.
- **Live globe ("Right now"):**
  - Data: three Realtime API calls with a 60-second cache per property, then `/api/live`.
  - Rendering: a server-rendered list first; cobe loads only when the card is on screen and WebGL works.
  - Behaviour: it polls about every 45 seconds while the tab is visible, pauses off screen, doesn't spin with reduced motion, and the count is in a polite `aria-live` region.
  - **Place data switched from Natural Earth to GeoNames** (CC BY 4.0, via `all-the-cities`): about 14,000 cities and population-weighted country centres, in a 365 KB server-side table. The credit is in the privacy policy and the card's help.
- **Chart notes:** the `chart_note` table (migration 0002), add, edit and delete. A note opens from a click on a day, its marker, or the notes list. Empty hint: "Add a note, like 'Launched on Product Hunt'". Never on public pages.
- **CSV on every card:** `/api/csv/<card>?range=`, from the cache, RFC 4180, formula-safe.
- **Landing page:**
  - Hero exactly as in the roadmap.
  - A demo dashboard: the real cards on sample data, a new server-rendered SVG chart, and a tiny date-switch island. Its dates refresh daily via `"use cache"`.
  - How it works, a "why" row, the **pricing section** (built early: a CSS-only Monthly / Yearly switch from `plans.ts`), the FAQ (native `<details>`) and `SoftwareApplication` JSON-LD.
- **SEO:** unique titles, canonicals, an Open Graph image drawn from the theme, `robots.txt`, `sitemap.xml` and `llms.txt`.
- **Lighthouse** (local production build):

  | Page | Mobile (Perf / A11y / BP / SEO) | Desktop |
  | --- | --- | --- |
  | Landing | 99 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | Privacy | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | Terms | 98 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

  The landing page started at 95 on mobile. Two changes brought it to 99: dropping Geist Mono (25 KB preloaded everywhere) and `display: "optional"` for Geist (the hero text no longer waits for a font swap).
- `docs/google-verification.md`: the scope justification and a demo video script for Siamak.
- 201 unit tests pass.

### Reviews

- **Code review** found 8 things, all fixed:
  - The globe kept spinning off screen.
  - Icons weren't cached at the origin or Cloudflare.
  - The sitemap parsed a free-text date (now ISO).
  - The GeoNames switch wasn't logged and had no credit.
  - Duplicate "Unknown" live keys.
  - The live card ran for a site that had just been revoked.
  - The range window was computed twice.
  - An inconsistent prop name.
- **Found while testing:** Tailwind's reset removes the browser's popover centring (`margin: auto`). Restored in `globals.css`, which also fixes the help popovers in browsers without anchor positioning.
- **Security review** (by hand): new endpoints check the user and their own site; CSV file names are sanitised and cells formula-safe; notes are scoped by site; JSON-LD is escaped; the icon cache is capped. Nothing open.

### Learned

- **Lighthouse 13** has an "agentic browsing" category. Its `llms.txt` audit wants Markdown links (`[text](url)`).
- **Cache Components:** `"use cache"` plus `cacheLife("days")` is the way to use the time on a static page.
- **Dev mode:** after many hot reloads, a tab can stop hydrating Suspense content. A fresh tab fixes it, so test in a new tab before chasing a bug.
- **React 19's `onToggle`** passes `newState` for popovers.

### Problems

- **Still waiting on the migrations and a real sign-in,** for the AI channel name check and the "numbers match GA4" check.

### Test data in Supabase (delete before launch)

- None yet.

### Next

- Sprint 4: the weekly email, the public page, Stripe, settings (disconnect and delete), production hardening, the final Lighthouse pass and the launch kit.

## 2026-10-11 · Session 3 · Sprint 2 built (core dashboard)

### Done

- **Summary line** (`src/lib/summary/summary.ts`): rules 1–5 from SPEC section 11.1, with 20 tests. It never names an unknown source.
- **Visitors chart:**
  - Recharts through shadcn charts, loaded in its own chunk, with a placeholder of the same size.
  - Yesterday is dashed and labelled "Still updating"; dots when there are few points.
  - A screen-reader caption, and a CSS-only "View as table".
  - Data prep in `src/lib/charts/series.ts` (tested), so the static SVG chart can reuse it.
- **The hourly 7-day chart was checked on a small site and didn't read well** (a comb of 0s and 1s). **7 days is daily now.** SPEC section 8 and DECISIONS are updated, and the hourly code paths are gone.
- **Cards:** Sources (Sources | Channels, with site icons), Pages (Top pages | Landing pages), Countries (flags and share), Devices (share bars). All use the shared `RankedList` with a CSS-only "Show more".
- **Signups picker:** the property's key events (Admin API, kept 10 minutes), or a how-to. A pencil button changes it later. Saving checks the event against the live list.
- **New shared blocks:** `SegmentedRadio`, `ViewToggle`, `RankedList`, `Flag`, `SiteIcon`, `PopoverButton`. All are on `/ui-kit`.
- **Site icon proxy** `/api/icon/<domain>`: DuckDuckGo only, strict host check, no redirects, type allowlist, a 64 KB cap read while streaming, and cached for 30 days.
- **Flags:** 257 PNGs (48 × 36) made with sharp, about 106 KB in total, instead of SVGs of up to 177 KB.
- **Checked** on `/ui-kit/dashboard`:
  - At 320, 375, 768, 1024 and 1440 px: no horizontal scrolling, and the numbers and chart fit above the fold at 1440 × 900.
  - Keyboard: every control has a name, in a sensible order, with visible focus.
  - Lighthouse: Accessibility 100 and Best Practices 100, mobile and desktop.
- 170 unit tests pass.

### Reviews

- **Code review** found 12 things, all fixed:
  - DECISIONS didn't record the daily switch.
  - "mostly from Unknown".
  - The key-events lookup called Google for revoked sites.
  - Silent save failures.
  - The picker preselected a different event.
  - A malformed icon URL caused a 500.
  - The share column was hidden on phones.
  - The popover stayed open after saving.
  - Big flag SVGs.
  - Duplicate "Unknown" keys.
  - Direct was detected by its label.
  - The icon size cap was checked after a full download.
- **Security review** (by hand): GA4 data can be faked by outsiders (referrer spam, Measurement Protocol). It's rendered only as escaped text, and icon URLs only use strictly checked host names. Nothing new found.

### Learned

- **Touch targets versus narrow cards:** a 44 px button squeezes a 2-column grid at 320 px. An invisible `after:` overlay keeps the target size without taking layout space.
- **A native popover keeps its open state across a server action's refresh,** so the form closes it with `hidePopover()` after a save.
- **`next/image` serves local SVGs and PNGs as they are** (`unoptimized`), which is what we want for tiny icons.
- **Screenshots right after load can miss the lazy chart:** dev mode compiles the chunk on first use. Check the DOM before deciding it's broken.

### Problems

- **Still no real-data check:** the migrations aren't applied, and the "numbers match GA4" check is Siamak's (SPEC section 11 lists which GA4 report to compare for each card).

### Test data in Supabase (delete before launch)

- None yet.

### Next

- Sprint 3: AI traffic, Actions, the live globe, chart notes, CSV, the landing page, SEO files and Lighthouse.

## 2026-10-11 · Session 3 · Sprint 1 built (connect Google)

### Done

- **Better Auth** (`src/lib/auth/`):
  - Google only, with read-only Analytics and offline access, consent every time, and encrypted tokens.
  - 30-day database sessions with a 5-minute cookie cache. IP tracking is off.
  - Sign-in and sign-out are server actions (form posts, no JavaScript).
  - Only Google's callback is reachable over HTTP.
- **Google tokens:**
  - `getGoogleAccessToken` uses Better Auth's refresh. When that fails, we ask Google directly, so a revoke (`invalid_grant`) is told apart from a blip.
  - Tokens are reused per user for 10 minutes.
- **GA4 data layer** (`src/lib/ga4/`, all in `docs/ga4.md`):
  - ranges per time zone, the 11 report requests and parsers, labels, the AI list
  - error mapping, a per-property limiter and breaker
  - the report cache: stale shown at once and refreshed with `after()` under a lease, missing fetched now, failed batches don't discard good ones
  - the automatic property choice, the switcher, sample data, and the four numbers
- **Screens:**
  - `/signin`.
  - `/dashboard` with the top bar (switcher, date switch, settings), the 4 number cards, and every state: no property (sample data), no data, access not granted, revoked, lost access, quota, Google not answering.
  - A minimal `/settings` (account, sign out).
  - `/privacy` and `/terms`, written early because the links need them. Placeholders for the legal details are in `src/config/legal.ts`.
- **Jobs:**
  - `POST /api/internal/jobs/<job>` with the bearer secret.
  - `warm-cache` and `cleanup`.
  - `scripts/run-job.mjs` for Coolify.
- **Migration** `0001_sites_and_report_cache.sql`: `site` (one active per user, with a partial unique index) and `report_cache`.
- **Dev preview:** `/ui-kit/dashboard?state=…` shows the dashboard in every state on sample data. Checked at 375 px and desktop.
- `docs/ga4.md` and `docs/auth.md`. 140 unit tests pass.

### Reviews

- **Code review** found 13 things, all fixed:
  - A failed batch threw away the good batches.
  - The warm-cache subquery is now `inArray` (the SQL output was checked).
  - The limiter handoff let a 6th request through (test added).
  - Each batch looked up and refreshed the token on its own.
  - "Not enough history" showed for missing values.
  - `serviceLevel` was stored as an enum number.
  - The terms had an extra refund promise (removed).
  - Job names matched prototype keys.
  - The lost-access recheck ran on every view.
  - The concurrent-quota 429 caused an hourly block.
  - Duplicated types and header.
  - A failed decrypt sent ciphertext to Google.
- **Security review** (by hand, since the skill needs a git remote). Found and fixed:
  - **Better Auth's `/api/auth/refresh-token` would return the decrypted Google refresh token to the browser**, and `/get-access-token` the access token. Now only the callback path reaches Better Auth over HTTP; both answer 404 (checked).
  - Session IP addresses were stored. Tracking is now off, and the privacy policy mentions sessions.
  - Checked and fine: the job endpoint (constant-time bearer), the switcher (checks the property against the user's own list), SQL (parameterised), and output (React escapes; the only HTML injection is the theme CSS).

### Learned

- **Cache Components:**
  - `new Date()` during prerendering is an error. Components that use the time call `await connection()` first.
  - Passing a plain function to `<form action>` needs `"use server"`.
- **The `react-hooks/purity` lint** flags `Date.now()` in render, even in dev pages.
- **Better Auth 1.7:** `auth.api.getAccessToken` needs `{ userId, accountId }`, where `accountId` is the account row's ID. `disabledPaths` only applies to HTTP requests.
- **The GA4 REST transport:** errors carry a gRPC `code` and an `httpStatusCode`. The async pager warns about `autoPaginate`, so we page by hand.
- **Drizzle:** `inArray(col, subquery)` renders the parentheses. Raw `sql` interpolation is riskier.
- **rtk:** its Vitest parser sometimes can't read the output. `rtk proxy npx vitest run` shows the real result.

### Problems

- **The migrations still aren't applied** (Siamak's terminal, see Sprint 0). Until then, real sign-in can't be tested: the OAuth state lives in the `verification` table.
- **The real Google flow is untested:** sign-in, scope check, property choice and numbers against a real property. Siamak needs to sign in himself; Claude doesn't enter passwords.

### Test data in Supabase (delete before launch)

- None yet.

### Next

- **Siamak:**
  - Run `npm run db:migrate`.
  - Check that both redirect URIs are on the Google OAuth client, and that the Data and Admin APIs are enabled.
  - Sign in at http://localhost:3000/signin.
- **Claude:** Sprint 2, the core dashboard.

## 2026-10-11 · Session 3 · Sprint 0 built (project setup)

Siamak asked for all of V1 (Sprints 0–4) in one go, checking each sprint with typecheck, lint, tests, a code review and a security review. This entry covers Sprint 0.

### Done

- **Scaffold:** Next.js 16.4 (Cache Components, Partial Prefetching, typed routes, standalone output), React 19.3, TypeScript 6.0.3, Tailwind 4.3, ESLint 10, Prettier, Vitest 5. Written by hand: `npx create-next-app` was blocked by the permission check.
- **Theme file** `src/config/theme.ts`, `ThemeStyle`, the Tailwind mapping in `globals.css` and all four guards. The guard tests and a throwaway "bad" file show that each one fires.
- **Component base:** layer import rules in ESLint, shadcn parts (button, badge, card, separator, skeleton, input, label) moved onto tokens, `Logo` and `Container`, and `/ui-kit` (a 404 in production). How it works: `docs/ui.md`.
- **Database:** Drizzle with postgres.js, Better Auth's 4 tables generated with `npx auth generate`, and the first migration in `drizzle/`. TLS is forced for remote databases.
- **Env:** `.env.example` documents every key. In `.env`, `DATABASE_URL` is now the Supabase **session** pooler (port 5432, password percent-encoded). The direct and transaction URLs were removed. Generated `BETTER_AUTH_SECRET`, `CRON_SECRET` and `EMAIL_TOKEN_SECRET`, and added `APP_URL`, `EMAIL_FROM` and `ADMIN_EMAILS`.
- **Docker:** `Dockerfile` (3 stages, non-root, migrations at start, `HEALTHCHECK`) and `compose.yaml` (local Postgres on 127.0.0.1, and the app under the `app` profile).
- `/api/health`, the hello page, favicons drawn from the theme, `not-found` and `global-error`.
- `docs/deploy.md`: Supabase, Hetzner, Coolify (with the Cloudflare Origin Certificate), Cloudflare rules, scheduled tasks and the Google redirect URIs.
- CodeGraph initialised (37 files indexed).

### Lighthouse baseline (local production build, hello page)

| | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile | 98 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Mobile: FCP 0.8 s, LCP 2.3 s, TBT 10 ms, CLS 0. Run it again on the real domain after the first deploy.

### Reviews

- **Code review** found 11 things. All are fixed:
  - Env validation read the whole set on every read. The Docker build (which only has `APP_URL`) would have failed. Now each key is checked when read, and the whole set when the server starts. Tested with a build that had no `.env`, and a start without `DATABASE_URL` (it fails fast with the variable's name).
  - The Apple icon had transparent rounded corners, which iOS fills with black.
  - A stale Drizzle schema after hot reloads.
  - Card edges bypassed the `border` token.
  - The health-check timer was never cleared.
  - A `process.env` read outside `env.ts`.
  - Missing Proxy traps, the global-error font, the git-ignore for `.claude/settings.local.json`, drizzle-kit credentials, and missing DECISIONS lines.
- **Security review:** the `/security-review` skill needs a git remote (`origin/HEAD`), and this repo has none, so the review was done by hand. Found and fixed:
  - The Supabase pooler accepts plain-text connections, and postgres.js doesn't ask for TLS by default. TLS is now required for every non-local host (`src/lib/db/ssl.ts`, also in `scripts/migrate.mjs`).
  - Local Postgres was published on all interfaces with a dev password. It's now 127.0.0.1 only.
  - The Supabase password was shared in chat: change it before launch (`docs/deploy.md` step 1).

### Siamak's answers (this session)

- Use **Supabase as the dev database** until Docker is installed.
- **Prices include VAT.**
- **Yearly refunds:** in full within 14 days.
- **Legal pages:** marked placeholders for now.

### Learned

- **shadcn CLI 4** uses the "radix-nova" style and `@import "shadcn/tailwind.css"`. Without `baseUrl` in tsconfig, it wrote `import { cn } from "cn"` and **installed an unrelated npm package called `cn`**. Fixed by hand, and noted in `docs/ui.md`.
- **Tailwind's default `dark:`** follows the OS. It's now class-based, so the light-only theme stays light.
- **Next.js 16.4:** `cacheComponents` wants `partialPrefetching` set explicitly. The docs ship in `node_modules/next/dist/docs/`.
- **Better Auth 1.7:** the Drizzle adapter is the separate `@better-auth/drizzle-adapter`, pulled in by `better-auth/adapters/drizzle`.
- **The Supabase project is in eu-west-1 (Ireland)**, on Postgres 17.11.
- **zsh:** `echo ====` fails, because `=word` expands to a command path. Use `echo ---`.

### Problems

- **The permission check blocks writes to Supabase** (`npm run db:migrate`), even after Siamak's OK in chat. Siamak runs the migration himself, or allows `Bash(npm run db:migrate)` in `.claude/settings.local.json`.
- **No Docker,** so the image is untested in Docker itself.
- **Deploy** (Hetzner, Coolify, Cloudflare) is Siamak's part. The Sprint 0 "Done when" stays open until `/api/health` answers on simpledash.app.

### Test data in Supabase (delete before launch)

- None yet.

### Next

- Sprint 1: Google sign-in, automatic property choice, the GA4 data layer and cache, and the states.

## 2026-10-11 · Session 2 · Pricing, theme file and UI rules (Sprint 0, before code)

### Done

- **Pricing** (Siamak's request): the €9 plan is now called Starter and also comes yearly at €90 (2 months free). Growth (€19 a month) shows as "Coming soon" in the pricing section.
  - Written into SPEC sections 1, 5, 9, 12, 16, 17, 20 and 22–27.
  - Also in CHECKLIST Sprints 3–4, DECISIONS, README and CLAUDE.md.
- **One theme and brand file:** `src/config/theme.ts` holds every colour, radius, shadow and brand fact. Guards make sure the code only uses its tokens (SPEC section 18).
- **UI quality bar** and **code structure and reuse rules:** SPEC sections 18 and 4, plus new conventions in CLAUDE.md.
- **Sprint 0 checklist:** new tasks for the theme file and the component base, with a dev-only `/ui-kit` page.
- **No more section signs:** Siamak asked what the section sign was. Every one in the docs is now plain words ("section 16"), and CLAUDE.md has a rule against symbols like it.
- No app code, no installs, no git. `docs/ROADMAP.md` is untouched.

### Siamak's answers

- Pricing is a section on the landing page (`/#pricing`), not its own page.
- The €9/€90 plan is called **Starter**.
- A **Monthly / Yearly switch** on the pricing section. Growth always shows €19 a month.
- **Light theme only** in V1. Dark mode stays an idea, and the theme file is ready for it.
- **UI:** Siamak likes DataFast's UI because it is "perfect", not because of its looks, and doesn't want it copied. It sets the bar for polish.

### Learned

- Email clients and the Open Graph image renderer need plain hex colours. So the theme file uses hex, and the CSS variables are written from it.
- Next.js needs `next/font` calls in their own module, so fonts are the one thing outside the theme file (`src/lib/theme/fonts.ts`).
- **Versions on npm today:**
  - lucide-react 1.55
  - class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.7, tw-animate-css 1.4
  - server-only 0.0.1
  - shadcn 4.21.4, tailwindcss 4.3.3, next 16.4.0

### Problems

- **ugrep and `|`:** it treats `|` in a pattern as "or", so searching Markdown tables matches almost every line. Use Python for those searches.

### Ideas (outside the roadmap, for later)

- A yearly price for Growth when it launches.
- Dark mode that follows the system setting. It's still an idea, but now only one palette away.

### Next

- **Siamak:**
  - Review the new SPEC sections 4, 16, 17 and 18, and the new rows in `docs/DECISIONS.md`.
  - Before Sprint 3, decide whether the prices include VAT and the refund rule for yearly plans (SPEC section 27).
  - The Sprint 0 account setup from Session 1 still stands.
- **Claude, Sprint 0 (updated order):**
  1. Scaffold Next.js 16 with TypeScript 6.0, Tailwind 4 and shadcn/ui.
  2. Set up ESLint, Prettier and Vitest, with `npm run check`.
  3. Run `codegraph init -i`.
  4. Build the theme file, `ThemeStyle`, the Tailwind mapping and the guards (palette removed, lint rules, mapping and contrast tests).
  5. Build the component base:
     - the folder layers and their import rules
     - the first shadcn parts, moved onto tokens
     - `Logo` and `Container`
     - `/ui-kit`
     - `docs/ui.md`
  6. Set up Drizzle, local Postgres in Compose, and the first migration (Better Auth tables).
  7. Write `.env.example`, the Dockerfile and `compose.yaml`.
  8. Add `/api/health` and the "hello" page, using the theme.
  9. Write `docs/deploy.md`.
  10. Run the Lighthouse baseline.

## 2026-10-11 · Session 1 · Planning (start of Sprint 0)

### Done

- Read `docs/ROADMAP.md`.
- Checked every fact it marks "from memory, verify" against official docs and npm. Details and sources are in `docs/SPEC.md` section 25.
- Asked Siamak 4 questions. Answers:
  - Ranges are full days ending yesterday.
  - Better Auth instead of Auth.js.
  - Stripe Managed Payments for tax.
  - When a trial ends unpaid, the email and public page pause too.
- Wrote `CLAUDE.md`, `README.md`, `docs/SPEC.md`, `docs/CHECKLIST.md`, `docs/STORY.md` and `docs/DECISIONS.md`. Ticked the first Sprint 0 task.
- No app code, no installs, no git.

### Learned

- **AI channel:** GA4 now has a built-in **"AI Assistant"** channel (ChatGPT, Gemini, Deepseek, Copilot, Grok). It doesn't name Claude or Perplexity, so the AI card also matches our own domain list.
- **Realtime:** the API has **no page path**, only `unifiedScreenName` (the page title). Live pages will show titles.
- **Key events:** `keyEvents` only counts from when an event was marked as a key event, so Signups uses `eventCount` of the chosen event.
- **Quotas:** besides the token quotas, **10 server errors per hour per property** blocks our project for that property. Retry carefully.
- **Freshness:** standard properties' intraday data is 2–6 h behind. Daily data takes about 12 h, and "can take 24–48 hours". That's why the Monday email goes out at 13:00 local time.
- **Google OAuth:**
  - "Testing" status means refresh tokens expire after 7 days (confirmed).
  - Users can untick scopes on Google's consent screen, so we check the granted scopes.
- **Supabase free:** projects "may pause" after 7 days of low activity. Use the shared pooler in session mode, which works over IPv4. The direct connection is IPv6-only and won't work from Docker.
- **Resend free:** 3,000 emails a month but only 100 a day.
- **Sentry free:** includes 1 uptime monitor and 1 cron monitor. UptimeRobot's and Better Stack's free tiers are for hobby use.
- **Versions on npm today:**
  - next 16.4: `proxy.ts`, no `next lint`, Cache Components. With Cache Components, `export const revalidate` is gone; use `"use cache"`.
  - TypeScript latest is 7.0.2, but typescript-eslint needs < 6.1, so we pin 6.0.3.
  - The Better Auth CLI is now the `auth` package.
- **Next.js docs:** any page can be fetched as Markdown with the header `Accept: text/markdown`. There is an index at `nextjs.org/docs/llms.txt`.

### Problems

- **WebSearch and WebFetch** failed all session with a model-access error. Workaround: `curl` the official page, then strip it to text with a small inline Python filter.
- **`grep` is aliased to ugrep** here and rejects long regexes. Use Python for complex text searches.
- **Docker and pnpm aren't installed** on this Mac. Node is 22.22, and Node 24 is recommended. Siamak will install Docker Desktop or OrbStack.
- **CodeGraph isn't initialised** (there is no `.codegraph/` yet). Run `codegraph init -i` right after the Next.js scaffold. Until then, the codegraph tools answer "no project loaded".

### Ideas (outside the roadmap, for later)

- Dogfooding: put GA4 on simpledash.app and publish our own public page. This needs a consent banner and has to be weighed against the Lighthouse 100 target.
- Dark mode that follows the system setting.
- % change on each row of Sources and Pages.
- Automatically delete accounts that have been locked for 12+ months (data minimisation).
- CSV download on public pages.

### Next

- **Siamak:**
  - Review `docs/SPEC.md` and the "Claude" defaults in `docs/DECISIONS.md`.
  - Answer the 3 open questions in SPEC section 27 before Sprint 3.
  - Install Docker.
  - Start the Sprint 0 account setup: Supabase, Hetzner with Coolify, Cloudflare.
- **Claude, Sprint 0:**
  1. Scaffold Next.js 16 with TypeScript 6.0, Tailwind 4 and shadcn/ui.
  2. Set up ESLint, Prettier and Vitest, with `npm run check`.
  3. Run `codegraph init -i`.
  4. Set up Drizzle, local Postgres in Compose, and the first migration (Better Auth tables).
  5. Write `.env.example`, the Dockerfile and `compose.yaml`.
  6. Add `/api/health` and the "hello" page.
  7. Write `docs/deploy.md`.
  8. Run the Lighthouse baseline.
