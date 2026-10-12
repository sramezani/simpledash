# SimpleDash V1 technical spec

Oct 11, 2026 · Written by Claude Code from `docs/ROADMAP.md` · Status: approved plan, before any Sprint 0 code

**Updated Oct 11, 2026 (session 2):** a yearly price and Growth shown as "coming soon" (sections 16 and 17), one theme and brand file and a UI quality bar (section 18), and code structure and reuse rules (section 4).

**Updated Oct 12, 2026 (session 6):** custom date ranges with a calendar, and keys in the date menu (sections 8 and 15).

**Updated Oct 12, 2026 (session 5):** Today and Yesterday ranges with hourly charts (section 8), the overview card and toolbar, fixed-height lists (section 11), the live demo in a browser frame at `/demo` and the signed-in landing page (section 17), the pricing switch's animations and Growth's yearly price (section 17), and the motion rules (section 18).

The roadmap says **what** to build and **why**. This spec says **how**.

- To build something differently, change this file first and add a line to `docs/DECISIONS.md`.
- References like "section 16" point to the numbered sections of this file.

## 1. Scope

V1 is Sprints 0–4 of the roadmap: 7 screens, the weekly email and billing.

The 7 screens:

- landing
- sign in
- dashboard
- public page
- settings
- legal
- SEO files

Out of scope:

- V2 (Sprints 5–8)
- "Not planned, only if users ask"
- "Will not build"

Siamak's decisions on Oct 11, 2026 (also in `docs/DECISIONS.md`):

- **Date ranges** are made of full days ending yesterday. 12 months means the last 12 full months (section 8).
- **Better Auth** handles Google sign-in instead of Auth.js (section 6).
- **Stripe Managed Payments** handles VAT and sales tax, with Stripe as the merchant of record (section 16).
- **When a trial ends unpaid**, the dashboard locks and the weekly email and public page pause too. All data is kept (section 16).

Added later the same day:

- **Pricing:** one plan, **Starter**, at €9 a month or €90 a year (2 months free). **Growth** (€19 a month or €190 a year) shows as "Coming soon". Pricing is a section on the landing page with a Monthly / Yearly switch (sections 16 and 17). This replaces the roadmap's "one plan at €9 a month" for V1.
- **Theme and brand in one file:** `src/config/theme.ts`, and the code only uses its tokens (section 18).
- **Light theme only** in V1, confirmed (section 18).
- **UI bar:** the polish of the best tools in this space (Siamak named DataFast), with our own design (section 18).

## 2. Architecture

```
                Cloudflare: DNS · proxy · SSL Full (strict) · cache for static files, landing, legal, /p/*
                                                   │
                      Hetzner server (EU) · Coolify · Docker
                      ┌────────────────────────────────────────────────┐
  browser ──────────► │ Next.js 16 app (standalone image, one process) │
                      │   pages · route handlers · server actions      │
                      │   src/lib/ga4      data layer + report cache   │──► GA4 Data API + Admin API
                      │   src/lib/auth     Better Auth                 │──► Google OAuth
                      │   src/lib/email    React Email                 │──► Resend
                      │   src/lib/billing  Checkout, Portal, webhook   │◄─► Stripe (Managed Payments)
                      │   Sentry (server only)                         │──► Sentry
                      └──────────────────────┬─────────────────────────┘
   Coolify scheduled tasks (hourly, daily) ──┤  call /api/internal/jobs/*
   backup container (nightly) ───────────────┤──► Cloudflare R2
                                             ▼
                      Postgres on Supabase (free tier, Frankfurt): plain Postgres via Drizzle
```

**The pipeline:**

1. The user signs in with Google.
2. A property is chosen automatically.
3. The GA4 data layer fetches reports and stores them in `report_cache`. There is one shared entry per property, report and range.
4. The dashboard, the weekly email and the public page all read from that cache.

**The setup** is one app, one container and one database. There is no queue, no Redis and no separate worker. Background work runs in one of two ways:

- right after a response is sent (`after()` from `next/server`)
- from scheduled jobs

## 3. Stack

Versions were checked on npm on Oct 11, 2026. Pin exact versions in `package.json` and upgrade on purpose.

| Part | Choice | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js LTS | 24.x | Docker base `node:24-alpine`. Local `.nvmrc` = 24 (this Mac has 22 today) |
| Framework | Next.js App Router, `output: "standalone"`, Cache Components on | 16.4 | Turbopack by default. `proxy.ts` replaces `middleware.ts`. `next lint` is gone |
| UI library | React | 19.3 | |
| Styling | Tailwind CSS | 4.3 | CSS-first config |
| Components | shadcn/ui (CLI `shadcn`) on Radix | CLI 4.21 | Copied into `src/components/ui`. Brings its helpers: `class-variance-authority` 0.7, `clsx` 2.1, `tailwind-merge` 3.7, `tw-animate-css` 1.4 |
| Icons | lucide-react (shadcn's default set) | 1.55 | One icon set, tree-shaken |
| Theme and brand | `src/config/theme.ts`, written into each page as CSS variables by `ThemeStyle` | — | One file for colours, radius, shadows and brand facts (section 18) |
| Charts | shadcn/ui charts (Recharts), **dashboard only** | recharts 3.10 | Landing and public pages use server-rendered SVG (sections 15 and 17) |
| Globe | cobe | 2.0 | About 5 KB, loaded lazily |
| Language | TypeScript, strict | 6.0.3, pinned | typescript-eslint needs < 6.1. TypeScript 7 comes later |
| Database | Postgres on Supabase free tier, plain Postgres | Supabase default (17) | Shared pooler in session mode (section 21) |
| ORM | Drizzle ORM and drizzle-kit, with the postgres.js driver | 0.45 / 0.31 / postgres 3.4 | SQL migrations in `drizzle/` |
| Auth | Better Auth: Google provider, Drizzle adapter | 1.7 | Replaces Auth.js (section 6) |
| Google APIs | `@google-analytics/data`, `@google-analytics/admin` (both v1beta), `google-auth-library` | 7.2 / 10.1 / 11.2 | Official clients |
| Validation | Zod | 4.x | Env vars and inputs |
| Server-only guard | `server-only` | 0.0.1 | The build fails if browser code imports a server module (section 4) |
| Email | Resend, React Email (`@react-email/components`) | resend 6.x | |
| Payments | Stripe Checkout, Customer Portal and webhooks, with Managed Payments | stripe 23 | |
| Errors and uptime | Sentry (`@sentry/nextjs`), server only | 11.x | Free Developer plan |
| Tests | Vitest | 5.x | Unit tests only |
| Lint and format | ESLint 10 flat config (`eslint-config-next` core-web-vitals and typescript) and Prettier 3 (with the Tailwind plugin) | | |
| Font | Geist via `next/font` (self-hosted at build time) | | Loaded in `src/lib/theme/fonts.ts` (section 18) |
| Package manager | npm | | Already installed |

**Changes from the roadmap's suggested defaults** (the roadmap allows these with a one-line reason):

- **Auth: Better Auth instead of Auth.js.** Auth.js v5 is still in beta (5.0.0-beta.32) and its maintainers moved to Better Auth. Better Auth is stable and has Google token encryption and refresh built in. Approved by Siamak.
- **Email: Resend, not Postmark.** It supports React Email natively, and its free tier (3,000 a month) is bigger than Postmark's (100 a month).
- **Uptime check: Sentry's free uptime monitor.** The free tiers of UptimeRobot and Better Stack are for hobby and personal use only.

## 4. Repository layout

```
.
├── CLAUDE.md · README.md · .env.example · .nvmrc
├── Dockerfile · compose.yaml · .dockerignore
├── next.config.ts · drizzle.config.ts · vitest.config.ts · eslint.config.mjs · .prettierrc
├── drizzle/                         SQL migrations (generated, committed)
├── public/                          flags/ (SVG), images
├── scripts/
│   ├── migrate.mjs                  runs migrations when the container starts
│   ├── run-job.mjs                  used by Coolify scheduled tasks
│   └── backup/                      Dockerfile + backup.sh (pg_dump → R2)
├── docs/                            ROADMAP, SPEC, CHECKLIST, STORY, DECISIONS, <area>.md
└── src/
    ├── proxy.ts                     sends signed-out visitors from /dashboard and /settings to /signin
    ├── config/                      product data: plain values, no imports from app code (rules below)
    │   ├── theme.ts                 THE theme and brand file: colours, radius, shadows, name, tagline (section 18)
    │   ├── plans.ts                 plans, prices and features (section 16)
    │   └── cards.ts                 the card list: id, title, help text, CSV, public-page default (section 11)
    ├── app/
    │   ├── layout.tsx · global-error.tsx · globals.css
    │   ├── icon.tsx · apple-icon.tsx · opengraph-image.tsx   drawn from the theme file and Logo
    │   ├── (marketing)/             page.tsx (landing, with the #pricing section) · privacy/ · terms/
    │   ├── (app)/                   dashboard/ · settings/          (signed in)
    │   ├── (dev)/ui-kit/            every token and shared block on one page (404 in production)
    │   ├── signin/
    │   ├── admin/                   usage counts (ADMIN_EMAILS only)
    │   ├── p/[slug]/                public page + opengraph-image.tsx
    │   ├── email/unsubscribe/
    │   ├── robots.ts · sitemap.ts · llms.txt/route.ts
    │   └── api/
    │       ├── auth/[...all]/       Better Auth handler
    │       ├── live/                realtime for the signed-in user
    │       ├── p/[slug]/live/       realtime for a public page with the Live card
    │       ├── csv/[card]/
    │       ├── icon/[domain]/
    │       ├── stripe/webhook/
    │       ├── internal/jobs/[job]/
    │       └── health/
    ├── components/
    │   ├── ui/                      shadcn parts, added with the CLI and styled only through tokens
    │   ├── shared/                  our building blocks: Container, Logo, CardShell, StatTile, Delta,
    │   │                            RankedList, EmptyState, Notice, SegmentedControl, BillingSwitch…
    │   ├── cards/                   one file per card, built from shared blocks
    │   ├── charts/                  VisitorsChart (Recharts) · StaticLineChart (SVG, no JS)
    │   ├── globe/                   LiveGlobe (lazy)
    │   ├── marketing/               Hero · HowItWorks · Pricing · Faq · Footer
    │   └── settings/                the settings sections
    └── lib/
        ├── env.ts                   Zod-checked env; the only place that reads process.env
        ├── utils.ts                 cn() for merging classes (shadcn)
        ├── theme/                   css.ts (theme → CSS variables) · theme-style.tsx · fonts.ts · contrast.ts
        ├── db/                      client.ts · schema.ts
        ├── auth/                    auth.ts (Better Auth) · session.ts (requireUser, requireSite) · google.ts
        ├── ga4/                     clients · ranges · reports · cache · errors · properties ·
        │                            realtime · labels · ai-sources · geo/ · sample/
        ├── summary/                 summary.ts
        ├── billing/                 stripe.ts · plan.ts · checkout.ts · webhook.ts
        ├── email/                   weekly-email.tsx · send.ts · unsubscribe.ts
        ├── csv.ts
        └── format.ts                numbers, durations, % change, dates and prices
```

Tests sit next to the code they test (`*.test.ts`).

### Code structure and reuse

More features come in V2 (several sites, alerts, revenue), so the code is built in layers, and every piece has one home.

**Layers.** Each layer imports only from its own folder and the layers above it. ESLint `no-restricted-imports` rules per folder enforce this.

| Layer | Folder | What goes in | May import |
| --- | --- | --- | --- |
| 1. Product data | `src/config/` | `theme.ts`, `plans.ts`, `cards.ts`: plain values, no logic | Nothing from the app |
| 2. Primitives | `src/components/ui/` | shadcn parts, added with its CLI and styled only through tokens | `lib/utils` |
| 3. Building blocks | `src/components/shared/` | Our reusable blocks. Props in, UI out, no data fetching | Layers 1–2, `lib/utils`, `lib/format` |
| 4. Features | `src/components/` `cards/`, `charts/`, `globe/`, `marketing/`, `settings/` | One feature each, built from blocks | Layers 1–3 and `src/lib` |
| 5. Routes | `src/app/` | Thin pages and handlers: access check, params, then features | Everything above |

`src/lib/` holds the helpers and the data access (GA4, database, auth, billing, email). Only features and routes use its data modules.

**Rules:**

- **Look before writing.** Search CodeGraph, `components/ui`, `components/shared` and `src/lib` first. Add shadcn parts with its CLI instead of writing them.
- **Extend, don't copy.** A new look is a prop or a `cva` variant on the existing component, never a copy of it. Shared code is pulled out the second time it is needed.
- **One home per helper.** Formatting (numbers, durations, %, dates, prices) lives only in `src/lib/format.ts`. Class merging lives only in `cn()` (`src/lib/utils.ts`).
- **Platform first.** Use `Intl`, `URL`, `AbortSignal.timeout`, `crypto.randomUUID` and the packages we already have before adding one. No lodash and no date library.
- **Server code stays on the server.** Modules that touch secrets, the database or Google start with `import "server-only"`, so the build fails if browser code imports them.
- **Typed links.** `typedRoutes: true` in `next.config.ts`, so a broken internal link fails the typecheck.
- **One card list.** `src/config/cards.ts` feeds the dashboard, the public page, the card picker in settings and the CSV route. No other list of cards exists.
- **One plan list.** Plan names, prices and features come only from `src/config/plans.ts` (section 16).
- **Every shared block shows on `/ui-kit`**, a dev-only page with every token and block (404 in production). It is where a theme change or a new block gets checked.

## 5. Routes and screens

| Route | Purpose | Who | Rendering |
| --- | --- | --- | --- |
| `/` | **Landing**: headline, the live demo in a browser frame, how it works in 3 steps, pricing section (`#pricing`, section 17), FAQ, sign-in or Dashboard button | public | static |
| `/demo` | **Live demo** (section 17): a real public stats page, framed on the landing page with `?embed=1` | public | partly prerendered, cached about 10 minutes, plus Cloudflare |
| `/signin` | **Sign in**: one screen saying what we read (read-only), then "Continue with Google" | public | static |
| `/dashboard` | **Dashboard**: the cards (section 11) | signed in | dynamic, streamed per card, cache-first |
| `/settings` | **Settings**: account, weekly email, public page, billing, disconnect Google, delete account | signed in | dynamic |
| `/p/[slug]` | **Public page** (section 15) | public | cached about 10 minutes, plus Cloudflare |
| `/privacy`, `/terms` | **Legal** | public | static |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | **SEO files** (section 17) | public | static or cached |
| `/admin` | Usage counts (section 20) | `ADMIN_EMAILS` | dynamic |
| `/email/unsubscribe` | One-click unsubscribe (section 14) | signed token | dynamic |
| `/ui-kit` | Every theme token and shared block on one page (sections 4 and 18) | development only; 404 in production | static |
| `/api/auth/*` | Better Auth (sign-in, callback, sign-out) | — | — |
| `/api/live` | Realtime data for the dashboard | signed in | 60 s memory cache |
| `/api/p/[slug]/live` | Realtime data for a public page with Live turned on | public | 60 s memory cache |
| `/api/csv/[card]` | CSV download (section 13) | signed in | — |
| `/api/icon/[domain]` | Site icon proxy (section 19) | public | cached 30 days |
| `/api/stripe/webhook` | Stripe events (section 16) | Stripe signature | — |
| `/api/internal/jobs/[job]` | Scheduled jobs (section 20) | Bearer `CRON_SECRET` | — |
| `/api/health` | Health check with a database ping | public | not cached |

## 6. Sign-in and Google access

### Better Auth setup (`src/lib/auth/auth.ts`)

- **Database:** `drizzleAdapter(db, { provider: "pg" })`.
- **Google provider** (`socialProviders.google`):
  - `clientId` and `clientSecret`.
  - `scope: ["https://www.googleapis.com/auth/analytics.readonly"]`. This is added to the default `openid`, `email` and `profile`.
  - `accessType: "offline"`.
  - `prompt: "select_account consent"`. Google only sends a refresh token on a consent screen, so asking every time guarantees a fresh one.
- **Token storage:**
  - `account.encryptOAuthTokens: true` encrypts Google tokens at rest with `BETTER_AUTH_SECRET`. If that secret is rotated, the stored tokens can't be read and users have to reconnect.
  - `account.updateAccountOnSignIn: true` means the newest tokens replace the old ones at every sign-in.
- **Sessions:** stored in the database, with a 30-day expiry renewed daily. A 5-minute cookie cache means most requests skip the session query.
- **Base URL:** taken from `APP_URL`.
- **Sign-in methods:** Google only. No email and password, no other providers.

### Flow

1. On `/signin`, "Continue with Google" opens Google's consent screen. That one screen covers sign-in and read-only Analytics access. Google sends the user back to `/api/auth/callback/google`, then on to `/dashboard`.
2. **Scope check:** Google lets people untick scopes on the consent screen. If the Google `account.scope` lacks `analytics.readonly`, show the **Analytics access not granted** state (section 12). Its "Allow read-only access" button starts the Google flow again.
3. **First visit:** if the user has no site yet, run the automatic property choice (section 7). While it runs, the dashboard shows "Finding your Google Analytics site…". Then it shows real numbers.

### Access tokens on the server

`getGoogleAuth(userId)` in `src/lib/auth/google.ts`:

- Calls `auth.api.getAccessToken({ body: { providerId: "google", accountId, userId } })`. Better Auth returns a valid access token and uses the stored refresh token when it has expired.
- Wraps the token in an `OAuth2Client` from `google-auth-library`. The GA4 clients receive it as `authClient`.
- Jobs call the same function with the site owner's user ID.

### Refresh failures

When a refresh fails with `invalid_grant`, set `site.status = 'needs_reconnect'`. The user sees the **Google access revoked** state. Typical causes:

- The user revoked access.
- The token went unused for 6 months.
- Time-limited access expired.
- The app was still in "Testing" status, where tokens last 7 days.

### Disconnect Google (settings)

1. Revoke the token at `https://oauth2.googleapis.com/revoke`.
2. Clear the tokens on the `account` row.
3. Delete `report_cache` rows for the user's properties that no other site uses.
4. Sign the user out.

Settings, notes, the signup event and the public page's slug are kept, so signing in again restores everything. The weekly email and public page pause on their own until Google is reconnected (sections 14 and 15).

### Delete account (settings, confirmed by typing DELETE)

1. Cancel any Stripe subscription immediately.
2. Revoke the Google token.
3. Delete the `user` row. This cascades to every table in section 9.
4. Delete caches no other site uses.
5. Sign the user out and show "Your account and data were deleted."

Stripe keeps its own payment records, because it is the merchant of record.

### Security musts

- `requireUser()` and `requireSite()` (`src/lib/auth/session.ts`) run at the top of every signed-in page, route handler and server action. They return the signed-in user's own active site.
- **No route accepts a property ID from the browser**, with one exception. The switcher's server action checks the ID against the user's own account-summary list, fetched with their token, before saving it.
- Tokens never leave the server and are never logged.

## 7. Automatic property choice and the switcher

`chooseProperty(userId)` in `src/lib/ga4/properties.ts`:

1. **List properties:** call `listAccountSummaries` (Admin API v1beta, page size 200, following every page). Keep ordinary GA4 properties.
2. **No properties:** no site is created. The dashboard shows sample data and the "No GA4 property" banner (section 12).
3. **One property:** use it.
4. **More than one:** for up to the first 20 properties, run a `runReport` with `activeUsers` from `7daysAgo` to `yesterday` (GA4 reads these in each property's own time zone).
   - Run them 5 at a time, with a 5 s timeout each.
   - Pick the highest. On a tie, pick the first.
   - Properties past the first 20 aren't checked, but they still appear in the switcher.
5. **Fetch details** for the chosen property:
   - `getProperty` gives `timeZone`, `createTime`, `serviceLevel` and `currencyCode`.
   - `listDataStreams` gives the first web stream's `defaultUri`. Its hostname, without `www.`, becomes the "Showing: mysite.com" label. If there is no web stream, use the property's display name.
6. **Save and warm:** insert the `site` (`is_active = true`), then warm the default range (section 10.3) so the dashboard opens from cache.

**The switcher** sits at the top of the dashboard: "Showing: mysite.com ▾".

- Opening it fetches the account summaries live, through a server action.
- Choosing a property:
  1. Check that the property is in the user's list.
  2. Deactivate the current site.
  3. Upsert and activate the chosen one.
  4. Warm its caches.
  5. Reload the page.
- V1 allows one site per account, so only one site is active at a time. Inactive rows remember their notes and signup event, so switching back restores them.

## 8. Date ranges and comparisons

**Days:**

- All dates are calendar dates in the site's GA4 time zone. "Today" means today in that time zone.
- Dates are worked out with `Intl.DateTimeFormat` and plain date arithmetic, with no date library.

| Date menu | Current period | Compared with | Chart points |
| --- | --- | --- | --- |
| **Today** | today so far | not compared: today isn't over, so the cards say "Today isn't over yet" | hourly (`dateHour`), midnight to the latest hour Google has reported |
| **Yesterday** | yesterday | the day before | hourly (`dateHour`), 24 points |
| **Last 7 days** (default) | the 7 days ending yesterday | the 7 days before that | daily (`date`), 7 points. Hourly was tried in Sprint 2 and read as noise over a week on small sites (see `docs/DECISIONS.md`) |
| **Last 30 days** | the 30 days ending yesterday | the 30 days before that | daily (`date`), 30 points |
| **Last 12 months** | the 12 full calendar months before this month | the 12 months before that | monthly (`yearMonth`), 12 points |
| **Custom** | any run of whole days, from 14 Aug 2015 (GA4's first day) up to today, at most 5 years | the same number of days just before | hourly for one day, daily up to 92 days, monthly after |

**Where ranges live:**

- The range is in the URL, so links can be shared and nothing is stored: `?range=today|yesterday|7d|30d|12m`, or `?range=2026-09-01..2026-09-30` for a custom range. Anything else falls back to the default. Days after today are cut off on the server, in the site's time zone.
- The menu and its keys are built by `rangeMenu` in `src/lib/ga4/ranges.ts`.

**The date menu** (`RangePicker`, like DataFast's):

- Today, Yesterday, then Last 7 days, Last 30 days, Last 12 months, then "Custom…".
- Keys while the menu is open: T, Y, W (week), M (month), L (last 12 months) and C (custom). They are shown next to each choice, except on touch screens. They only work while the menu is open, so typing elsewhere never changes the range (WCAG 2.1.4).
- **Custom** opens a calendar (shadcn `calendar`, react-day-picker) under the menu button: two months side by side, one on phones. The first click picks the first day, the second the last day, and the days between are shaded while pointing. Start and End date fields stay in step with it. Days after today and before GA4's first day can't be picked. "Clear" empties the choice; "Apply" goes to the new address, and one picked day applies as a single day.
- The calendar's code loads the first time "Custom" is pointed at or chosen, so pages don't carry it otherwise.
- With a custom range, the button shows its days ("1 Sep – 30 Sep") and the period isn't repeated next to it.
- The weekly email uses the 7-day range computed on a Monday, which is exactly last Monday to Sunday (section 14).

**Still updating:**

- Yesterday is "still updating", because GA4 can take 24–48 hours to finish a day.
- When a daily or monthly chart includes yesterday, its last segment is dashed and labelled "Still updating". On the hourly Yesterday chart every hour is solid, and the hint says it once.
- The period next to the date menu has a short hint: "Google may still be adding to yesterday."

**Today** (and a custom range that ends today):

- A period that ends today isn't compared ("Today isn't over yet") and its cache is fresh for 30 minutes.
- Google adds today's visits a few hours late (standard properties). The latest hours it hasn't reported yet are left off the chart rather than drawn as zeros, and the latest reported hour is dashed.
- The hint says "So far today. Google adds visits a few hours late."
- "Right now" in the live globe (section 11.10) stays the place for the last 30 minutes.

**% change:**

- % change = (current − previous) ÷ previous, rounded to a whole number.
- No % is shown when:
  - the previous period started before the property existed (`createTime`), or
  - the previous value is 0.

  Instead, the card shows a dash with the hint "Not enough history to compare". **We never show a made-up percentage.**

**Totals** always come from a query for the whole range. They are never the sum of chart points: GA4 counts each visitor once per row, so adding rows would overcount.

## 9. Data model

The Drizzle schema lives in `src/lib/db/schema.ts`.

- IDs are text, Better Auth style.
- `user_id` foreign keys cascade on delete.
- **No table holds visitor-level data.**

**Better Auth tables:** `user`, `session`, `account` and `verification`.

- They are generated with the Better Auth CLI (the `auth` package, `npx auth generate`; confirm the command in Sprint 0) and committed.
- `account` holds the encrypted Google tokens and the granted `scope`.
- These four tables are Sprint 0's first migration, which is the roadmap's "users" migration.

### `site`: a GA4 property connected by a user

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text pk | |
| `user_id` | text fk → user | |
| `property_id` | text | e.g. `properties/123456` |
| `is_active` | boolean | Exactly one active per user (partial unique index) |
| `display_name` | text | From GA4 |
| `domain` | text null | From the web stream, e.g. `mysite.com` |
| `time_zone` | text | e.g. `Europe/Amsterdam` |
| `currency_code` | text | |
| `service_level` | text | Standard or 360 (quotas and realtime window differ) |
| `property_created_at` | timestamptz | For "Not enough history to compare" |
| `signup_event` | text null | The key event the user chose |
| `status` | text | `ok` · `needs_reconnect` · `no_access` |
| `quota_blocked_until` | timestamptz null | Set after a 429 |
| `created_at`, `updated_at` | timestamptz | |

Unique on (`user_id`, `property_id`).

### `report_cache`: shared per property, never per viewer

| Column | Type | Notes |
| --- | --- | --- |
| `property_id` | text | |
| `report` | text | e.g. `totals`, `sources` (section 10.2) |
| `range_type` | text | `7d` · `30d` · `12m` |
| `params_hash` | text | Hash of extra inputs: signup event, AI list version, limits |
| `window_start`, `window_end` | date | The dates actually fetched |
| `payload` | jsonb | Aggregated rows only: totals, top-N lists, time series |
| `fetched_at` | timestamptz | |
| `refreshing_until` | timestamptz null | A lease, so only one refresh runs at a time |
| `last_error` | text null | |

Primary key (`property_id`, `report`, `range_type`, `params_hash`).

### Other tables

- **`chart_note`**: `id`, `site_id` fk → site (cascade), `day` date, `text` varchar(80), `created_at`, `updated_at`.
- **`public_page`**: `user_id` pk fk, `slug` unique, `enabled` boolean (default false), `cards` text[], `indexable` boolean (default true), `updated_at`.
  - A slug is 3–40 characters of `[a-z0-9-]`. Reserved words are blocked.
  - The page shows the user's active site.
- **`user_settings`**: `user_id` pk fk, `weekly_email` boolean (default true), `email_notice_dismissed` boolean (default false), `created_at`, `updated_at`.
- **`billing`**: `user_id` pk fk, `trial_ends_at` (sign-up + 14 days), `status` (Stripe subscription status or null), `stripe_customer_id`, `stripe_subscription_id`, `plan_interval` (`month` or `year`, null until the first payment), `current_period_end`, `updated_at`.
- **`email_send`**: `user_id` fk, `week_start` date, `sent_at`, `provider_message_id`. The primary key is (`user_id`, `week_start`), so a week's email can only go out once.
- **`stripe_event`**: `event_id` pk, `type`, `received_at`. The webhook skips events it has already stored.

**Migrations:**

- `npm run db:generate` (drizzle-kit) writes SQL files into `drizzle/`, which are committed.
- The container applies them at startup with Drizzle's migrator (`scripts/migrate.mjs`).

## 10. GA4 data layer (`src/lib/ga4/`)

This is the only code that talks to Google Analytics. Pages, the email and jobs call its typed functions. No other code imports the Google clients. How it works in detail goes into `docs/ga4.md` once it's built.

### 10.1 Clients

- Use `BetaAnalyticsDataClient` (`@google-analytics/data`) and the v1beta `AnalyticsAdminServiceClient` (`@google-analytics/admin`).
- Create them per request, with the user's `OAuth2Client` as `authClient`.
- Use the REST transport (`fallback: true`) to keep per-user clients light. Check this in Sprint 1.
- If bundling causes trouble, list both packages in `serverExternalPackages`.

### 10.2 Reports for one range

Every request sets `returnPropertyQuota: true`. The date ranges come from section 8.

"Both periods" means two `dateRanges` in one request. GA4 then adds a `dateRange` dimension to each row.

| # | Report | Dimensions | Metrics | Filter | Periods | Order and limit | Used by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `totals` | — | `activeUsers`, `screenPageViews`, `userEngagementDuration` | — | both | — | Visitors, Page views, Avg. time, summary, email |
| 2 | `series` | `dateHour` / `date` / `yearMonth` | `activeUsers` | — | current | by dimension | Visitors chart |
| 3 | `sources` | `sessionSource` | `activeUsers` | — | both | visitors desc, 50 | Sources, summary, email |
| 4 | `channels` | `sessionDefaultChannelGroup` | `activeUsers` | — | current | desc, 25 | Sources (Channels toggle) |
| 5 | `pages` | `pagePath` | `screenPageViews`, `activeUsers` | — | current | views desc, 50 | Pages, email |
| 6 | `landing` | `landingPage` | `activeUsers` | — | current | desc, 50 | Pages (Landing pages tab) |
| 7 | `countries` | `countryId`, `country` | `activeUsers` | — | current | desc, 50 | Countries |
| 8 | `devices` | `deviceCategory` | `activeUsers` | — | current | desc | Devices |
| 9 | `actions` | `eventName` | `eventCount` | `eventName` in [`file_download`, `click`, `form_submit`, signup event] | both | — | Actions, Signups, summary, email |
| 10 | `ai_sources` | `sessionSource` | `activeUsers` | AI filter (section 11.5) | current | desc, 20 | AI traffic, email |
| 11 | `ai_pages` | `landingPage` | `activeUsers` | AI filter (section 11.5) | current | desc, 10 | AI traffic |

**Batching:**

- Reports are sent with `batchRunReports`. That allows up to 5 requests per batch, all for the same property.
- Batch A is reports 1–5, batch B is 6–10, and batch C is 11.
- Only stale or missing reports are fetched.

**Plain-word labels** (`labels.ts`):

| GA4 value | Shown as |
| --- | --- |
| `(direct)`, `(none)` | Direct |
| `(not set)` | Unknown |
| `(other)` | Other. GA4 groups rare values this way on large properties |
| `deviceCategory` values | Desktop, Mobile, Tablet. Anything else is Other |

Channel names are mapped to plain words in section 11.4.

### 10.3 Cache: show old data at once, refresh in the background

`getReports(site, rangeType, reports[], { audience })`:

1. **Read** the cache row for each property, report, range type and params. There is one row per report, always holding the newest fetch.
2. **Decide if it's fresh.** A row is fresh when its window matches the current window and `fetched_at` is newer than:
   - 30 minutes for any period that ends today (1 hour on a public page), because today keeps changing
   - 3 hours for Yesterday, 7 days, 30 days and custom ranges that include yesterday
   - 24 hours for 12 months and for custom ranges that ended before yesterday (they won't change)
   - 12 hours when the reader is a public page (Today excepted)
3. **Act on it:**
   - **Fresh:** return it.
   - **Stale** (old window or old fetch): return it right away and schedule a refresh with `after()`. A new day changes the window, so the first view after midnight shows yesterday's numbers while the new ones load.
   - **Missing:** fetch it now. This is rare, because sign-in warms the default range.
4. **Refresh:**
   1. Take a lease with a conditional update: `refreshing_until = now() + 30 s`, only where it is null or in the past. No lease means someone else is already refreshing, so skip.
   2. Fetch only the stale or missing reports, in batches.
   3. Upsert the rows.
5. **Show the new data.** If any card on a page was stale, a small client component calls `router.refresh()` once, about 4 seconds later.
6. **Clean up.** The `cleanup` job deletes rows that haven't been fetched for 7 days.

**Realtime data** is not stored in Postgres. An in-memory map per property keeps the last result for 60 seconds. That works because there is one server process; if we ever run more than one, move it to Postgres.

### 10.4 Errors and quota

| Google says | We do | User sees |
| --- | --- | --- |
| 429 `RESOURCE_EXHAUSTED` | Set `quota_blocked_until` to the next hour, or to Pacific midnight for the daily quota. No GA4 calls for that property until then | Cached numbers with the note "Google's hourly limit for this site was reached. Numbers refresh after 14:00." With nothing cached, the **quota reached** state |
| 401 or `invalid_grant` | `site.status = needs_reconnect` | **Google access revoked** state |
| 403 `PERMISSION_DENIED` | `site.status = no_access` | "You no longer have access to this Google Analytics site", plus the switcher |
| 500, 503 or timeout | Retry once after about 1 s. A per-property breaker opens after 5 server errors in an hour, because Google blocks a project and property pair after 10 | Cached numbers. With nothing cached: "Google Analytics isn't answering right now." |
| Quota running low | When `tokensPerHour.remaining` drops below 10%, skip background refreshes and serve the cache | Nothing |

Other limits:

- At most 5 GA4 requests run at once per property, using an in-process limiter. Google allows 10.
- Each request has a 15 s timeout.
- Every failure goes to Sentry with the property ID. Tokens are never sent.

**Quota budget:** loading one range from scratch takes 3 batch calls covering 11 reports. Google says most requests cost 10 tokens or fewer. That is far below the limit of 14,000 tokens per project per property per hour.

## 11. Dashboard

The dashboard is one scrolling page.

- **Top bar:** the logo and a link to Settings.
- **Toolbar** (`OverviewToolbar`, shared with public pages and the demo): the site chip with its icon (on the dashboard it opens the site switcher), the date menu (`RangePicker`: Today, Yesterday, Last 7 days, Last 30 days, Last 12 months; it opens with a short fade and zoom, the label changes at once and a spinner shows while the new numbers load), and the period in words with its hint (section 8).
- **Below it:** notices (weekly email notice, state banners from section 12), the summary line, then the cards.
- **The overview** (`OverviewCard`): one card with the four numbers in a row, short dividers between them (two by two on phones), and the visitors chart underneath. Downloads for the chart and the four numbers sit in one small CSV menu.
- **Layout:** one column on phones, a grid on wider screens.
- **On every card:** a title, a short help popover (ⓘ) in plain words, and "Download CSV" (section 13). The summary line has no CSV.
- **Built from shared parts:** every list card sits in the shared `CardShell` (title, help, CSV, and the loading, empty, error, stale and locked states). The card list, titles and help text come from `src/config/cards.ts` (section 4).
- **List cards have a fixed height** of 10 rows (`RankedList`), whatever their number of rows, so cards side by side line up and nothing moves. "Show more" turns the list into a scrolling list inside the card. Share bars are soft blue (`chart-1`) and grow in when a list appears.

Help text for every count: "Visitors that Google Analytics counted. People who refuse cookies or block GA aren't included."

**Checking numbers against GA4** (Sprint 2 "done when"): use the same custom date range in GA4.

| Card | Where to compare in GA4 |
| --- | --- |
| Visitors | "Active users" |
| Page views | "Views" in Pages and screens |
| Avg. time | "Average engagement time per active user" |
| Signups | "Event count" of that event in the Events report |
| Sources | "Active users" by "Session source" in Traffic acquisition |
| Countries | Demographic details by country |
| Devices | Tech details by device category |

### 11.1 Summary line (built from the numbers, no AI)

`buildSummary()` in `src/lib/summary/` uses `totals`, `sources` (both periods) and `actions`. The rules:

1. **Visitors change:**
   - Under ±3%: "Visitors about the same as the previous 7 days".
   - Otherwise: "Visitors up 23% vs the previous 7 days" or "Visitors down 12% vs the previous 7 days".
   - Period words: "the previous 7 days", "the previous 30 days", "the previous 12 months". In the email: "the week before".
2. **Source:** add ", mostly from Google" when one source makes up 50% or more of the net change in visitors, in the same direction as the total. Otherwise add nothing.
3. **No comparison possible:** "1,234 visitors in the last 7 days". Add ", mostly from Google" when that source brought 50% or more of the visitors.
4. **Signups sentence:** only when a signup event is set and either period has signups. "12 signups, up from 8." / "…down from 15." / "…same as before."
5. **No reasons or guesses.** Never "because…".

Unit tests cover every rule, plus zeros, ties and rounding.

### 11.2 Visitors, Page views, Avg. time and Signups

**The four numbers:**

- **Visitors** = `activeUsers`.
- **Page views** = `screenPageViews`.
- **Avg. time** = `userEngagementDuration` ÷ `activeUsers`, shown like "1m 23s".
- **Signups** = `eventCount` of the chosen key event, taken from the `actions` report.

Each number shows its % change with an arrow and a word. Colour is never the only signal.

**Why Signups uses `eventCount`:** GA4's `keyEvents` metric only counts from the moment an event was marked as a key event. Older periods would show fake zeros.

**Signups empty state:** "Which action means a signup?"

- If the property has key events (`listKeyEvents`, Admin API), the card shows a picker of them.
- If it has none, the card shows a short how-to (GA4 → Admin → Events → "Mark as key event") with a link to Google's help.
- With no event chosen, the card **never shows a zero**.

### 11.3 Visitors chart

- A shadcn area chart (Recharts) drawn from the `series` points. Detail per range is in section 8.
- **Look:** a smooth light-blue line (monotone curve, so it never dips below zero or above the highest point) over a soft blue fill that fades out, dashed grid lines, and no dots until hovered. It draws in from the left when it appears. Public pages and the demo use a server-rendered SVG that looks the same (section 15).
- X-axis labels use the site's time zone: hours (00:00, 04:00, …) for Today and Yesterday. The tooltip shows the hour, day or month and the visitors.
- The last segment is dashed and labelled "Still updating" when it is still filling up (section 8).
- **Chart notes** (section 13) are small markers on their day; on the monthly chart, on their month. The note text shows on hover or keyboard focus.
- **Text alternative:**
  - A visually hidden caption, e.g. "Visitors per day, 4 Oct to 10 Oct, highest 312 on 7 Oct".
  - A "View as table" toggle.

### 11.4 Sources

- **Default view:** `sessionSource`, top 10, with "Show more" up to 50.
- **Toggle:** "Sources | Channels".
- **Site icons:** served by `/api/icon/<domain>` (section 19).
  - Sources that look like domains use that domain.
  - Common names map to domains: google → google.com, bing → bing.com, t.co → x.com, and so on.
  - Anything else gets a generic icon.

**Channel names in plain words:**

| GA4 channel | Shown as |
| --- | --- |
| Direct | Direct |
| Organic Search | Search |
| Organic Social | Social |
| Referral | Other sites |
| Email | Email |
| AI Assistant | AI assistants |
| Organic Video | Video |
| Organic Shopping | Shopping |
| Paid Search | Search ads |
| Paid Social | Social ads |
| Display | Display ads |
| Paid Other, Cross-network, and other paid channels | Other ads |
| Unassigned | Unknown |

### 11.5 AI traffic

The card shows visitors from AI assistants, split by assistant, plus the pages they landed on.

**AI filter**, as an OR group in `dimensionFilter`:

- `sessionDefaultChannelGroup` = "AI Assistant". This is GA4's new default channel. It covers ChatGPT, Gemini, Deepseek, Copilot and Grok, and excludes Google's AI Overviews and AI Mode.
- **or** `sessionSource` is in our list. The list also covers Claude, Perplexity, and data from before Google added the channel:
  - chatgpt.com, chat.openai.com
  - perplexity.ai, claude.ai
  - gemini.google.com, bard.google.com
  - copilot.microsoft.com
  - chat.deepseek.com, grok.com, meta.ai
  - chat.mistral.ai, you.com, phind.com, poe.com

  The list lives in `ai-sources.ts`, and its version number goes into `params_hash`.

**Display names:** ChatGPT, Perplexity, Claude, Gemini, Copilot, DeepSeek, Grok, and so on.

**Empty state:** "No visitors from AI assistants in this period."

**Help text:** "Google's AI Overviews count as Google search."

**Check later:** confirm the exact channel string the API returns on a real property in Sprint 3.

### 11.6 Pages

- **Two tabs:**
  - "Top pages" (`pagePath`, showing Views and Visitors).
  - "Landing pages" (`landingPage`, showing Visitors).
- Each tab shows the top 10, with "Show more" up to 50. Paths are shown as they are.

### 11.7 Countries

- Each row shows a flag, the country name, visitors and share.
  - The flag comes from `countryId`. It is a self-hosted 3:2 SVG from country-flag-icons (MIT), because emoji flags don't show on Windows.
  - The name comes from `country`.
- Top 10, with "Show more" up to 50.

### 11.8 Devices

Desktop, Mobile and Tablet, each with a share bar. Any other category is shown as "Other".

### 11.9 Actions

**Rows:**

- **Downloads:** `file_download`.
- **Outbound clicks:** `click`. Enhanced Measurement sends this event for links that leave the site.
- **Form submits:** `form_submit`.
- **Signups:** the chosen event.

Rows with zero are hidden. If every row is zero, the card says: "No actions recorded yet. Turn on Enhanced Measurement in GA4 to count downloads, outbound clicks and forms." It also links to Google's help.

### 11.10 Live globe

The card shows "12 visitors right now", a globe of places and the top 5 live pages.

**Realtime API queries.** Realtime covers the last 30 minutes on standard properties and 60 on GA4 360.

- **Places:** dimensions `countryId`, `country` and `city`, metric `activeUsers`, limit 100.
- **Live pages:** dimension `unifiedScreenName`, metric `activeUsers`, limit 5. The Realtime API has no page path, so **live pages show page titles**.

**From place names to coordinates** (on the server):

- A static lookup table built from GeoNames (CC BY 4.0, through the `all-the-cities` package) by `scripts/build-places.mjs`: about 14,000 places with 30,000+ people, matched on country code and city name (accents ignored, plus a few English names such as Cologne).
- If no city matches, use the country's population-weighted centre.
- Changed from Natural Earth in Sprint 3: Natural Earth's populated places aren't packaged on npm. GeoNames needs a credit line, which is in the privacy policy and the Right now card's help.
- Only coordinates and counts are sent to the browser.

**`/api/live`** returns `{ total, places: [{ lat, lng, visitors, label }], pages: [{ title, visitors }] }`. It is cached for 60 seconds per property, in memory.

**In the browser:**

- The server renders the card first as a text list of places and pages.
- cobe (about 5 KB) is imported only when:
  - the card scrolls into view, and
  - WebGL works.
- It polls every 45 seconds, give or take a little, while the tab is visible, and stops when the tab is hidden.
- With `prefers-reduced-motion`, the globe doesn't spin.
- The count updates in a polite `aria-live` region.

## 12. Onboarding and states

There is no setup screen. Every state below is a card or banner on the dashboard, with plain copy and one action.

| State | When | What the user sees |
| --- | --- | --- |
| **No GA4 property** | No properties in the account summaries | The dashboard on sample data, with the banner "No Google Analytics site found. Here's how to add GA4 in 5 minutes." It has 3 short steps inline and a link to Google's guide |
| **No data yet** | Both periods have zero visitors | Banner: "Google Analytics hasn't recorded any visits for mysite.com in this period. If you just added it, check back tomorrow." Cards show empty states, not zeros |
| **Key events missing** | No signup event chosen | The Signups card shows the picker or the how-to (section 11.2) |
| **Analytics access not granted** | The Analytics scope was unticked on Google's consent screen | Card: "SimpleDash needs read-only access to Google Analytics." Button: "Allow access" |
| **Google access revoked** | `invalid_grant` or a 401 | Banner: "Google access ended. Reconnect to see fresh numbers." Button: "Reconnect Google". Cached numbers stay visible, greyed out |
| **Google quota reached** | A 429 from Google | A note on the cards with the time it clears. Cached numbers stay (section 10.4) |
| **Trial ended** | Trial over and no paid subscription | A locked overlay on the cards: "Your free trial has ended. Keep SimpleDash for €9 a month or €90 a year." The Monthly / Yearly switch and an "Upgrade" button (section 16). Settings still work, and nothing is deleted |
| **Lost access to the property** | A 403 from Google | A banner, plus the switcher |

**Other empty states from the roadmap:**

- **Public page card:** "Share your stats publicly?" with a one-click "Turn on". This creates the page with a slug from the domain and the default cards, then shows the link.
- **Chart notes:** a hint inside the chart: "Add a note, like 'Launched on Product Hunt'".
- **Weekly email:** the one-line notice "Every Monday we'll email you last week's numbers." with a "Turn off" link. It shows until dismissed.

**Sample data:**

- A fixed, generated data set shaped like a small SaaS site, in `src/lib/ga4/sample/`.
- Used for the landing demo and for the "No GA4 property" state.
- Always labelled "Sample data".

## 13. Chart notes and CSV

### Chart notes

- **Add:** "+ Add note" opens a date picker and a text field (80 characters at most). A note can also be added by picking a point on the chart.
- **Edit and delete:** from the note's marker.
- **Ownership:** server actions check that the note's site belongs to the signed-in user.
- **Storage:** stored in `chart_note`, never sent to GA4. Notes are hidden on public pages.

### CSV

- **Where:** every dashboard card has "Download CSV", which calls `/api/csv/<card>?range=30d`.
- **Data:** built from the same cached reports, so there are no extra GA4 calls unless a report is missing.
- **File name:** `simpledash-<domain>-<card>-<start>-<end>.csv`.
- **Format:** a plain-word header row, UTF-8, and RFC 4180 quoting.
- **Safety:** a cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'`. Page titles and sources come from the open internet and could carry spreadsheet formulas.

## 14. Weekly email

**When it's sent:**

- The `weekly-email` job runs every hour. It picks users who meet all of these:
  - The weekly email is on.
  - The account is not locked (section 16).
  - The active site has status `ok`.
  - Local time in the site's time zone is Monday, between 13:00 and 17:59.
  - There is no `email_send` row for this week yet.
- 13:00 leaves time for GA4's usual 12-hour processing of Sunday. The window runs to 17:59 so that a send that failed or was skipped (Resend down, a deploy at the wrong minute) is tried again the next hour, without sending in the evening.
- The job fetches fresh 7-day reports: `totals`, `sources`, `pages`, `actions` and `ai_sources`. These also update the dashboard cache.
- If there were no visitors in either week, no email is sent.

**Content** (React Email, `src/lib/email/weekly-email.tsx`):

- **Subject:** "mysite.com: 1,234 visitors last week (up 23%)".
- The summary line.
- The 4 numbers (Visitors, Page views, Avg. time, and Signups if set) for Monday–Sunday vs the week before.
- Top 3 sources and top 3 pages.
- An AI traffic line, only when it's above 0.
- An "Open your dashboard" button.
- **Footer:** why they get the email, a settings link and an unsubscribe link.
- **Look:** the colours, name and logo come from the theme file (section 18), as inline styles, because email clients don't support CSS variables.

**Sending:**

- Through the Resend batch API, up to 100 emails per call.
- One `email_send` row is written per user. It is unique per week, so retries never double-send.
- **Sender:** `SimpleDash <hello@simpledash.app>`. Resend's SPF, DKIM and DMARC records go in Cloudflare DNS.

**Unsubscribe:**

- A link to `/email/unsubscribe?token=…`. The token is an HMAC of the user ID, signed with `EMAIL_TOKEN_SECRET`.
- The email also carries `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers, as Gmail's and Yahoo's sender rules require.
- One click turns `weekly_email` off.

**Opens:** Resend counts them. Read the open rate in Resend's dashboard; V1 has no webhook for it.

**Limits:**

- Resend's free plan allows 3,000 emails a month but only **100 a day**.
- Move to Pro ($20 a month) before about 90 users have the weekly email on.
- Sentry's free cron monitor watches this job (section 20).

## 15. Public page `/p/<slug>`

**Turning it on and settings:**

- Turned on from its dashboard card or from settings.
- **Slug:** defaults to the domain, e.g. `mysite-com`. Must be unique.
- **Cards:** the user picks which cards to show, from the card list in `src/config/cards.ts` (section 4).
- **Indexing:** "Let search engines index this page" is on by default.
- **Copy link** button.

**Cards:**

- **Can be shown:** summary line, Visitors, Page views, Avg. time, Visitors chart, Sources, Pages, Countries, Devices, AI traffic, Signups, Live.
- **On by default:** summary line, Visitors, Page views, Visitors chart, Sources, Pages, Countries.
- **Off by default:** Signups and Live.
- If Signups is hidden, the summary line leaves out the signups sentence.
- **Chart notes are never shown.**

**Page contents:**

- The same layout as the dashboard: the toolbar (the site chip is the page's `h1`), the summary line, the overview card and the list cards (section 11).
- The same ranges as the dashboard, custom ones included, through `?range=`.
- **Custom ranges are capped:** anyone can type one into a public page's address, and each new one costs the owner's GA4 quota. A public page may fetch at most 20 new custom ranges per site per hour (`allowPublicCustomRange` in `src/lib/ga4/limiter.ts`); a range asked for in the last hour is always allowed again. Past the cap, the page shows only cached numbers and says "This page can't load more custom ranges right now."
- A "Powered by SimpleDash" footer link to `https://simpledash.app`.
- **No private data.** Nothing from settings, no email address, no notes, no user name and no property ID appears in the page or in what it loads.

**Caching:**

- The page body uses `"use cache"` with `cacheLife` (about 10 minutes) and `cacheTag("public:<slug>")`. Changes in settings call `updateTag`.
- Reports come from `report_cache`, fresh for 12 hours, and are refreshed with the owner's Google access.
- Responses send `Cache-Control: public, s-maxage=600, stale-while-revalidate=86400`. A Cloudflare cache rule for `/p/*` means most views never reach our server.

**No chart JavaScript:**

- Charts are server-rendered SVG (`StaticLineChart`): the same smooth line and fill as the dashboard. Hovering a point shows its tooltip with CSS only.
- Client code: the date menu (a small Radix menu) and, if turned on, the Live card. The Live card loads lazily as on the dashboard and polls `/api/p/<slug>/live`, which shares the 60-second realtime cache.

**Metadata:**

- Title "mysite.com stats · SimpleDash", a description and a canonical URL.
- An `opengraph-image.tsx` showing the domain and "Live stats".
- `robots: noindex` when indexing is off.

**When it's not live:**

- **Paused:** when the owner is locked (trial ended, unpaid) or disconnected from Google, the page only says "This page is paused." with the SimpleDash link. It is `noindex` and drops out of the sitemap.
- **Turned off (or never made):** the page shows "Page not found" with `noindex`. The page streams inside a Suspense boundary (Cache Components), so the status code is already 200 when the database answers; a real 404 status would need a lookup before rendering on every view. Search engines treat a `noindex` page like a 404.

**Sitemap:** includes pages that are on, indexable and not paused.

## 16. Billing

**Plans and prices** (Siamak, Oct 11, 2026). They live in one place, `src/config/plans.ts`, which feeds the pricing section, the upgrade screens, settings, structured data and `llms.txt`.

| Plan | Price | What it includes | Status |
| --- | --- | --- | --- |
| **Starter** | €9 a month, or €90 a year (2 months free) | One GA4 site, no traffic limits, every V1 feature, and a 14-day free trial with no card | On sale |
| **Growth** | €19 a month or €190 a year | Everything in Starter, plus the roadmap's V2 list: several sites, Search Console, traffic alerts, mentions on the chart, revenue next to traffic, and asking your data in plain English | "Coming soon" in the pricing section only. No button and no waitlist |

- "2 months free" is worked out from the prices (12 × €9 − €90 = €18, which is 2 months of €9). It is never typed in by hand.
- Stripe has one product, Starter, with two prices. Their IDs are in `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` (section 22).
- Growth arrives with V2 (roadmap Sprint 5), together with its Stripe price and its limits.

**Trial:**

- `billing.trial_ends_at` is set to sign-up + 14 days when the user is created.
- No card and no Stripe calls during the trial.

**Plan state** (`getPlan(user)` in `src/lib/billing/plan.ts`):

- **Paid:** the Stripe subscription status is `active`, `trialing` or `past_due`.
- **Trial:** otherwise, if now is before `trial_ends_at`.
- **Locked:** everything else.

**What locked means:**

- The dashboard overlay (section 12).
- No weekly email.
- The public page is paused.
- No GA4 calls: jobs skip locked users.
- All data is kept.

**Upgrade:** a server action, `startCheckout` (`src/lib/billing/checkout.ts`), creates a Checkout Session.

- **Where:** the locked overlay (section 12) and Settings → Billing. Both hold the same Monthly / Yearly switch as the pricing section (`BillingSwitch`), here as a form field named `interval`. The form posts to the server action, so upgrading needs no JavaScript.
- **Price:** the action checks `interval` (`month` or `year`) with Zod and picks `STRIPE_PRICE_MONTHLY` or `STRIPE_PRICE_YEARLY` on the server. **The browser never sends a price ID.**
- Subscription mode, for the chosen price.
- **Stripe Managed Payments** is turned on, so Stripe is the merchant of record and handles VAT and sales tax.
- The product needs an eligible digital tax code (SaaS).
- If 48 hours or more of the trial are left, pass `subscription_data.trial_end`, so upgrading early doesn't cost trial days. This works the same for both prices. Check in Sprint 4 that Managed Payments supports this; if not, charge right away.
- On success, go to `/dashboard?upgraded=1`. On cancel, go to `/settings`.

**Manage:** a Stripe Customer Portal session for card, invoices, cancelling, and switching between monthly and yearly. The Portal's plan-switching setting lists both Starter prices. Check in Sprint 4 that the Portal works with Managed Payments.

**Settings → Billing** shows the plan in plain words, for example "Free trial · 9 days left" or "Starter · €90 a year · renews on 11 Oct 2027", with "Upgrade" or "Manage billing".

**Webhook** (`/api/stripe/webhook`):

- Check the signature with `STRIPE_WEBHOOK_SECRET`.
- Store the event ID and skip repeats.
- Update `billing` for these events:
  - `checkout.session.completed`
  - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - `invoice.paid`, `invoice.payment_failed`
- Read the subscription's price and store its interval (`month` or `year`) in `billing.plan_interval`. A price that isn't one of the two Starter prices is reported to Sentry.
- **Unit tests:** signature check, each event to status, price to `plan_interval`, repeated events, and out-of-order events (the newest subscription state wins).

**Managed Payments limits:** subscriptions can only be created through Checkout or Payment Links, and Connect isn't supported. Neither affects us.

**Prices on the landing page:** the pricing section (section 17). Prices include VAT.

## 17. Landing page, legal pages and SEO files

### Landing page (`/`), statically generated

**Headline and button:** exactly as in the roadmap.

- H1 "Google Analytics, in a dash."
- The roadmap's subheadline.
- Button "See my dashboard, free" → `/signin`.

**Signed in:** the top bar shows "Dashboard →" instead of "Sign in", and the hero button reads "Open my dashboard →". The page stays static and cacheable: the proxy keeps a small `sd_signed_in=1` hint cookie (not HttpOnly, no secret) while the app is used, an inline script in `<head>` reads it before the first paint and marks `<html data-signed-in>`, and CSS (the `signed-in:` variant) shows the right buttons. Nothing moves. Signing out clears the cookie. It is only a hint: `/dashboard` still checks the session (`src/lib/auth/signed-in-hint.ts`).

**Live demo** (`DemoFrame`):

- A real public stats page (`/demo?embed=1`) inside a browser window: three dots on the left, the page address in the middle (`simpledash.app/p/<slug>`), a soft outer frame, and a handwritten "Interactive demo" note with an arrow.
- Fixed height: the page scrolls inside the window, and its date menu, tabs and tooltips work.
- The frame starts loading only when it comes near the screen, then fades in over a placeholder of the same shape, so the landing page's first load stays light.
- **Which page:** `src/config/demo.ts` holds the slug (now `meetline-me`) and the range the demo opens with. If that page is missing or paused, `/demo` shows sample data instead, so the landing page never breaks.
- **`/demo` on its own** shows the same page with a "Live demo" banner and a trial button. It is `noindex` (the original is `/p/<slug>`), may be framed by our own site only (`frame-ancestors 'self'`), and is cached like a public page.
- **No Recharts on the landing page:** the demo uses the server-rendered chart, and its JavaScript runs inside the frame.

**How it works, in 3 steps:**

1. Sign in with Google.
2. We find your GA4 site.
3. See your visitors, sources and top pages on one page.

**Pricing section** (`#pricing`, linked as "Pricing" from the landing page's top bar and footer). Everything on its cards comes from `src/config/plans.ts` (section 16).

- **Monthly / Yearly switch** (the shared `BillingSwitch`):
  - Two radio buttons styled as a segmented control, labelled "Monthly" and "Yearly". A handwritten "2 months free" note with an arrow points at Yearly (screen readers hear "Yearly · 2 months free").
  - The white pill slides to the checked option, and CSS `:has()` shows the matching prices, so it needs no JavaScript.
  - It starts on Monthly. Arrow keys move between the options, and focus is visible.
- **Prices roll** like an odometer when the switch moves (`RollingPrice`, CSS only): "€9" ⇄ "€90", "€19" ⇄ "€190". "/ month" and "/ year" crossfade, and for Yearly a "Save €18 a year" line opens under the price (12 × the monthly price − the yearly price).
- **Starter card:**
  - "€9 / month", or "€90 / year" with "Save €18 a year" when Yearly is picked.
  - Its feature list: one GA4 site, no traffic limits, full history from day one, the weekly email, the public page.
  - The button "Start 14-day free trial →" → `/signin`, with "€0 due today · no card needed" under it.
  - Billing is only chosen at upgrade (section 16), because the trial needs no card.
- **Growth card:**
  - "€19 / month", or "€190 / year" with "Save €38 a year", and a "Coming soon" badge.
  - "Everything in Starter, plus" its feature list (section 16).
  - No button and no waitlist.

**FAQ:** "Do I need GA4?" and "What do you store?".

**Brand:** the name is always SimpleDash, one word. The logo is a "–" dash mark, drawn by the shared `Logo` component. The favicons (`icon.tsx`, `apple-icon.tsx`) and the Open Graph images draw it from the theme file (section 18), so a brand colour change reaches them too.

### Legal pages (`/privacy`, `/terms`)

Both are static, in plain English. Claude drafts them, Siamak reviews them (this is not legal advice), and they need Siamak's legal details (section 27).

**The privacy policy must cover:**

- **What we store:** users, settings, encrypted Google tokens, chart notes, public-page settings and short-lived report caches. Never visitor-level data.
- **What we read from Google:** read-only Analytics, and why.
- **Google's rules:** compliance with the Google API Services User Data Policy, including the Limited Use requirements. Google verification needs this.
- **Processors:** Hetzner, Supabase, Cloudflare, Resend, Stripe (as merchant of record) and Sentry.
- **Retention and deletion:** deleting the account removes everything; disconnecting revokes Google access.
- **Cookies:** only necessary ones (session and sign-in state).
- **Contact.**

**The terms cover:**

- the service
- the trial
- prices and billing through Stripe as merchant of record: monthly or yearly, renewing automatically
- cancellation and refunds (the refund rule for yearly plans is an open question, section 27)
- acceptable use
- liability
- governing law

### SEO

- **Titles and descriptions:** unique per page, with the title template "%s · SimpleDash".
- **Canonical URLs:** built from `APP_URL`.
- **Open Graph images:** one for the landing page (`opengraph-image.tsx`, generated at build time) and one per public page.
- **Structured data:** `SoftwareApplication` JSON-LD on the landing page: name, description, `applicationCategory` "BusinessApplication", `operatingSystem` "Web", and `offers`.
  - Two `Offer`s, each with a `UnitPriceSpecification`: €9 a month (`unitCode` "MON") and €90 a year (`unitCode` "ANN"), priceCurrency "EUR", both from `plans.ts`.
  - Growth is left out until it can be bought.
- **`robots.txt`:**
  - Allows `/`, `/privacy`, `/terms` and `/p/`.
  - Blocks `/dashboard`, `/settings`, `/admin`, `/signin`, `/api/` and `/email/`.
  - Links to the sitemap.
- **`sitemap.xml`:** landing, privacy and terms (Sprint 3), plus public pages (Sprint 4).
- **`llms.txt`:** short plain text for AI assistants: what SimpleDash is, who it's for, features, prices (Starter at €9 a month or €90 a year; Growth at €19 a month or €190 a year, coming soon), what we store, and key links (including `/#pricing` and `/demo`).

## 18. Design, performance and accessibility

### Design system: one theme and brand file

Siamak's rule: the whole look and the brand live in one file, and the code only uses its tokens. Changing that file re-themes the site, the weekly email, the Open Graph images and the favicons.

**The file: `src/config/theme.ts`**

- **`brand`:** name (SimpleDash), tagline, description, URL and support email.
- **`colors.light`:** the tokens below, as hex values. Hex works everywhere the theme is needed: CSS, email clients and the Open Graph image renderer.
- **`radius` and `shadows`.**
- **Two settings at the top drive the rest:**
  - `brandColor` feeds `primary`, `ring` and `brand`, so changing the main colour is a one-line edit. `chart-1` is its own light, clear blue (it still reaches 3:1 against the card).
  - The `neutral` scale feeds the surfaces, borders and quiet text.
- **Plain data with no runtime imports,** so pages, emails, Open Graph images, tests and the globe can all import it.
- **Light theme only in V1.** A `colors.dark` palette can be added later: the CSS then gets a `prefers-color-scheme: dark` block, and nothing else changes.

**Tokens**

| Group | Tokens | Used for |
| --- | --- | --- |
| Surfaces and text | `background`, `foreground`, `card`, `popover`, `muted`, `secondary`, `accent`, each with a `-foreground` | Page, cards, menus, quiet text and hover backgrounds (shadcn's names) |
| Actions | `primary`, `primary-foreground`, `ring`, `destructive`, `destructive-foreground` | Buttons, links, focus rings, delete account |
| Lines | `border`, `input` | Card edges and form fields |
| Brand | `brand` | The dash in the logo |
| Changes | `positive`, `negative` | % change up and down, always with an arrow and a word |
| Notes | `warning` | "Still updating" and quota notes |
| Charts | `chart-1` to `chart-5` | Chart lines and series. `chart-1` is the visitors line, its fill and the share bars in lists |
| Layers | `overlay` | The dim layer behind dialogs |
| Decoration | `window-close`, `window-minimize`, `window-zoom` | The three dots of the browser frame around the landing demo |

**How the values reach the page:**

- `src/lib/theme/css.ts` turns the theme into CSS variables (`--primary: #…`). It is a pure function with tests.
- `<ThemeStyle />` writes them into `<head>` from the root layout and from `global-error.tsx`. A saved edit shows at once in development, and there is no generated file.
- `src/app/globals.css` only maps token names to Tailwind utilities (`@theme inline { --color-primary: var(--primary); … }`), so classes like `bg-primary` and `text-muted-foreground` exist. It holds no colour values.
- `color-scheme: light` is set, and shadcn's class-based `dark:` variant stays unused.

**The same values outside the page:**

- The weekly email, the Open Graph images, the live globe's colours and `viewport.themeColor` import `theme.ts` directly.
- The favicons (`icon.tsx`, `apple-icon.tsx`) draw the dash with the `Logo` component in `brandColor`.
- **Fonts are the one exception.** Next.js needs `next/font` calls in their own module, so `src/lib/theme/fonts.ts` loads Geist, and Caveat for the two handwritten notes on the landing page (`font-hand`, not preloaded, placed absolutely so nothing moves when it arrives). Changing a font is one import line there.

**Guards**, all part of `npm run check`:

1. **Only tokens exist.** Tailwind's default colours are removed (`@theme { --color-*: initial; }`), so classes like `bg-blue-500` don't exist.
2. **No raw colours.** ESLint (`no-restricted-syntax`) blocks hex, `rgb()`, `hsl()` and `oklch()` strings, and arbitrary colour and font-size classes such as `bg-[#…]` or `text-[13px]`, everywhere except `src/config/theme.ts`.
3. **Nothing missing.** A test checks that every token has a Tailwind mapping in `globals.css`, that every mapping has a token, and that `globals.css` holds no colour values.
4. **Contrast.** A test checks WCAG AA: 4.5:1 for every text and background pair, and 3:1 for the focus ring and `chart-1` against the card. A theme edit that would hurt accessibility (and Lighthouse) fails with a message naming the pair.

When a shadcn part is added, it is moved onto tokens. For example, the dialog overlay uses `bg-overlay` instead of `bg-black/50`, and the destructive button uses `text-destructive-foreground` instead of `text-white`.

### UI quality bar

The bar is the polish of the best tools in this space: everything clear, quick and in its place. Siamak named DataFast as the example. It is the bar to match, **not a design to copy**: SimpleDash keeps its own layout, colours and words.

**Layout and style:**

- **Numbers first.** The 4 numbers and the visitors chart are visible without scrolling on a 1440 × 900 screen, and right under the top bar on a phone.
- **One visual language:**
  - neutral surfaces with one accent colour
  - 1 px borders and flat cards
  - shadows only on raised layers (menus, dialogs)
  - one radius scale
- **Type:** Geist, sizes from Tailwind's type scale only, and sentence case everywhere.

**Numbers and lists:**

- **Numbers** use `tabular-nums` and are always formatted by `src/lib/format.ts`. A change shows an arrow, the % and a word; colour is never the only signal.
- **Ranked lists** (Sources, Pages, Countries, AI traffic) share one `RankedList` block:
  - each row has an icon or flag, a label and a value
  - a soft share bar sits behind the row (`bg-primary/10`)
  - the whole row highlights on hover
  - long labels are cut short, and the full text stays available on hover and to screen readers
  - "Show more" expands in place, with no jump

**Interaction:**

- Every control has hover, active, disabled and visible focus states, all from tokens.
- Touch targets are at least 44 × 44 px.
- The date menu is a small dropdown of the five ranges, each a link to `?range=` (section 11).
- **Segmented controls** (Sources | Channels, Monthly | Yearly) are radio buttons with a white pill that slides to the checked option, with CSS only. Options share one width.

**States:**

- Every card uses the shared `CardShell`, so the loading, empty, error, stale and locked states look the same everywhere.
- Skeletons have the final size, so nothing moves when the numbers arrive (no layout shift).
- No spinners for page content.

**Responsive:**

- Mobile first. Cards use container queries (`@container`), so one card fits the dashboard grid, the public page and the landing demo (a phone-width page inside the frame on phones).
- No horizontal scrolling down to 320 px wide.
- Every screen is checked at 320, 375, 768, 1024 and 1440 px at the end of each sprint.

**Motion:** smooth and short, and `prefers-reduced-motion` turns all of it off.

- 150–300 ms ease-out for changes of state: hover, menus and popovers opening, the segmented pill sliding, a tab's view fading in.
- A few things move once when they appear, to feel alive without slowing anything down: the visitors line draws in from the left (0.9 s), list share bars grow in (0.7 s), and prices roll when Monthly / Yearly changes (0.7 s).
- No animation hides content from the first paint for long, and nothing moves the layout.

**Before a UI task is ticked:**

- Check it in the browser at 375 px and 1440 px.
- Do a keyboard-only pass.
- Confirm there are no console errors.
- Run Lighthouse as described under Performance below.

### Performance (principle 7)

**Landing, legal and public pages:**

- Static or cached HTML.
- Very little client JavaScript: no chart library, no analytics and no Sentry client.
- `next/font` (Geist, self-hosted, no layout shift).
- `next/image` (sharp) with width and height set.
- Cloudflare caches static files and cached HTML.

**Dashboard:**

- Server components, streamed card by card with Suspense.
- Cache first (section 10.3).
- Recharts and cobe are split into their own chunks, and the globe loads only when visible.

**Lint:** `eslint-config-next`'s core-web-vitals rules are on.

**Lighthouse:**

- Run it at the end of every sprint on landing, legal and one public page, for mobile and desktop.
- Write the scores in `docs/STORY.md`.
- Target 100, and never below 95, in all four categories.
- The dashboard gets the same target for Accessibility and Best Practices.

### Accessibility

- shadcn and Radix components, which have keyboard support built in.
- Visible focus rings and WCAG AA contrast.
- Real headings and landmarks, and a label on every control.
- **Charts:** a caption plus "View as table". The globe has its text list.
- **Changes:** shown with arrows and words, never colour alone.
- `prefers-reduced-motion` is respected.
- **Theme:** light only in V1, confirmed by Siamak on Oct 11, 2026. The theme file can take a dark palette later (Design system, above).

## 19. Security

**Tokens and secrets:**

- Google tokens are encrypted at rest (section 6), and revoked or deleted on disconnect and account deletion.
- Secrets live only in env vars, read through `src/lib/env.ts` and checked with Zod at startup.
- `.env*` files are git-ignored, except `.env.example`.
- Secrets are never logged. Sentry's `beforeSend` strips headers and cookies.

**Access:** every request is scoped to the signed-in user's own site (`requireSite()`, section 6).

**Job endpoints:**

- Need `Authorization: Bearer <CRON_SECRET>`.
- A Cloudflare WAF rule also blocks `/api/internal/*` from the internet. The scheduled tasks call it from inside the server.

**Signatures:** the Stripe webhook signature is checked, and unsubscribe tokens are signed with an HMAC.

**Site icon proxy** (`/api/icon/<domain>`):

- The hostname is checked with a strict regex.
- Icons are fetched only from two fixed favicon services, never from arbitrary URLs, so there is no SSRF. DuckDuckGo's icon service is tried first, then Google's favicon service when DuckDuckGo has no icon.
- The server fetches the icons, so visitors' browsers never contact DuckDuckGo or Google.
- Responses are size-capped and cached for 30 days.
- Unknown sites get a generic icon.

**Headers** (`next.config.ts`):

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: no camera, microphone or geolocation
- `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`, except `/demo`: `frame-ancestors 'self'` and `SAMEORIGIN`, so only our own landing page can frame it.
- HSTS is set at Cloudflare.

A full CSP is a later improvement: script nonces would make the static pages dynamic.

**Rate limits:** a Cloudflare rate-limiting rule on `/api/` (the free plan allows one rule).

**CSV:** formula escaping (section 13).

**Cookies:** only necessary ones (session and OAuth state), so there is no cookie banner.

## 20. Jobs and operations

Jobs run as Coolify scheduled tasks. Each one runs `node scripts/run-job.mjs <job>` inside the app container, which POSTs to `http://localhost:3000/api/internal/jobs/<job>` with the bearer secret.

| Job | When | What it does |
| --- | --- | --- |
| `warm-cache` | hourly at :05 | For sites that are active, unlocked and `ok`, whose owner signed in during the last 14 days: refresh the 7-day reports when they're stale or the day has turned in the site's time zone. Skips quota-blocked sites |
| `weekly-email` | hourly at :00 | Section 14 |
| `cleanup` | daily at 03:30 UTC | Deletes `report_cache` rows not fetched for 7 days, and expired sessions and verification rows |
| backup | nightly at 02:00 UTC | Runs in a separate small container with a Postgres client and rclone. `pg_dump` (custom format) of our `public` and `drizzle` schemas (not Supabase's own), without the rows of `report_cache`, `session` and `verification`, then gzip, then the R2 bucket. An R2 lifecycle rule deletes copies after 30 days. Restore one into local Postgres once, to prove it works. Setup and restore: `docs/backup.md` |

### Monitoring

- **Sentry** (server only):
  - Errors from GA4 calls, jobs and webhooks.
  - One free uptime monitor on `/api/health`.
  - One free cron monitor on the weekly email job.
- **`/api/health`** runs `select 1` and returns 200 or 503. The uptime check calls it every minute, which also keeps the Supabase project active (free projects may pause after 7 days of low activity).

### Usage counts (`/admin`, only for `ADMIN_EMAILS`)

- Signups: total, last 7 days and last 30 days.
- Connected sites.
- On trial, paying (monthly and yearly) and locked.
- Trial-to-paid rate.
- Public pages turned on.
- Weekly email turned on.

Weekly email opens are read in Resend's dashboard.

## 21. Deployment

### Dockerfile

Multi-stage, on `node:24-alpine`:

1. **deps:** `npm ci`.
2. **build:** `next build` (standalone).
3. **runner:**
   - Runs as the non-root `node` user.
   - Copies `.next/standalone`, `.next/static`, `public`, `drizzle/` and `scripts/`.
   - `CMD node scripts/migrate.mjs && node server.js`.
   - `HEALTHCHECK` on `/api/health`.

### `compose.yaml`

- **`db`:** `postgres:17-alpine` with a volume, for local development.
- **`app`:** builds the Dockerfile, reads `.env` and serves port 3000. Use it to test the production image locally. Coolify deploys from the Dockerfile directly.

### Local development

1. `docker compose up -d db`
2. `npm run db:migrate`
3. `npm run dev`

Next.js runs on the Mac and Postgres runs in Docker. This needs Docker Desktop or OrbStack, which is not installed on this Mac today.

### Server setup

Siamak does this; Claude writes the step-by-step guide in `docs/deploy.md` during Sprint 0.

1. **Hetzner Cloud server:**
   - EU location: Falkenstein or Nuremberg, near Supabase's Frankfurt region.
   - 2 vCPU and 4 GB RAM. Coolify needs about 2 GB; add swap for builds.
   - Ubuntu LTS, SSH key login.
   - Firewall: port 22 from your IP only, plus 80 and 443.
2. **Coolify:**
   - Install Coolify and connect the GitHub repo, using the Dockerfile build pack.
   - Set env vars in Coolify.
   - Health check on `/api/health`.
   - Auto-deploy on push to `main`.
   - Add the scheduled tasks from section 20.
3. **Supabase:**
   - Project in `eu-central-1` (Frankfurt).
   - `DATABASE_URL` is the shared pooler in **session mode**. That works over IPv4. The direct connection is IPv6-only, and Docker has no IPv6 by default.
4. **Cloudflare:**
   - DNS: an A record for `simpledash.app` pointing at the server, proxied.
   - SSL/TLS: "Full (strict)", with a Cloudflare Origin Certificate installed in Coolify's proxy, and "Always Use HTTPS".
   - Cache rules for static files, `/`, `/privacy`, `/terms` and `/p/*`.
   - A WAF rule for `/api/internal/*`.
   - A rate-limiting rule for `/api/`.
   - Email Routing for `hello@simpledash.app`.
5. **Google Cloud:**
   - Create a project and enable the Google Analytics Data API and Admin API.
   - **OAuth consent screen** (External):
     - app name SimpleDash and the dash logo
     - support email
     - `simpledash.app` as an authorised domain
     - privacy and terms URLs
     - scopes: `openid`, `email`, `profile` and `analytics.readonly`
   - **Web client** with redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://simpledash.app/api/auth/callback/google`
   - Publish it **"In production"** (unverified) as early as Sprint 1. In "Testing" status, refresh tokens expire every 7 days. The 100-user cap and Google's warning screen stay until verification, which is submitted in Sprint 3.

## 22. Environment variables

These become `.env.example` in Sprint 0. Each variable is added in the sprint shown, and `README.md` lists them once they exist.

| Name | Used for | Example or format | From |
| --- | --- | --- | --- |
| `APP_URL` | Absolute links, canonical URLs, Better Auth base URL | `http://localhost:3000` · `https://simpledash.app` | Sprint 0 |
| `DATABASE_URL` | Postgres: local Docker, or the Supabase session pooler | `postgres://…` | Sprint 0 |
| `BETTER_AUTH_SECRET` | Signs sessions and encrypts Google tokens | 32+ random bytes | Sprint 1 |
| `GOOGLE_CLIENT_ID` | Google OAuth | | Sprint 1 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | | Sprint 1 |
| `CRON_SECRET` | Protects the job endpoints | random | Sprint 1 |
| `EMAIL_TOKEN_SECRET` | Signs unsubscribe links | random | Sprint 4 |
| `RESEND_API_KEY` | Sending email | | Sprint 4 |
| `EMAIL_FROM` | Sender address | `SimpleDash <hello@simpledash.app>` | Sprint 4 |
| `STRIPE_SECRET_KEY` | Stripe API | test key in development | Sprint 4 |
| `STRIPE_WEBHOOK_SECRET` | Webhook signatures | | Sprint 4 |
| `STRIPE_PRICE_MONTHLY` | Starter, €9 a month | `price_…` | Sprint 4 |
| `STRIPE_PRICE_YEARLY` | Starter, €90 a year | `price_…` | Sprint 4 |
| `STRIPE_MANAGED_PAYMENTS` | Turns Managed Payments on in Checkout | `true` (default) | Sprint 4 |
| `SENTRY_DSN` | Server error reports (optional) | | Sprint 4 |
| `ADMIN_EMAILS` | Who can open `/admin` | comma-separated | Sprint 4 |
| `BACKUP_DATABASE_URL` | Backup container: database to dump | `postgres://…` | Sprint 4 |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Backup container: where dumps go | | Sprint 4 |

## 23. Testing

Vitest unit tests only. The roadmap rules out end-to-end tests.

**GA4 data layer:**

- Date ranges per time zone, including month ends, daylight-saving changes and leap years.
- Request building for each card.
- Response parsing and label mapping.
- % change and "Not enough history to compare".
- Cache freshness and lease logic, with a fake clock and a mocked database and client.
- Error mapping: 429, 401, 403 and 5xx.
- Property choice.

**Summary:** every rule in section 11.1.

**Billing:**

- Webhooks: signature check, each event, price to `plan_interval`, repeated events and event order.
- `getPlan`.
- Plans: "2 months free" worked out from the prices, and `interval` to the right Stripe price ID.

**Theme** (section 18):

- `css.ts` writes a CSS variable for every token.
- Every token has a Tailwind mapping in `globals.css`, and every mapping has a token. `globals.css` holds no colour values.
- WCAG AA contrast: 4.5:1 for every text and background pair, 3:1 for the focus ring and `chart-1`.

**Small helpers:** CSV escaping, unsubscribe tokens, slug rules and price formatting.

**Before ticking a task:** `npm run check` (typecheck, lint and tests) must pass.

## 24. Running cost

| Item | Per month |
| --- | --- |
| Hetzner server (2 vCPU, 4 GB) | about €4–8 (check the current price) |
| Supabase free | €0. Pro ($25) only if pausing becomes a problem or we pass 500 MB |
| Cloudflare (DNS, proxy, cache, Email Routing) and R2 (10 GB free) | €0 |
| Resend | €0, then $20 at about 90 weekly-email users |
| Sentry Developer | €0 |
| Stripe and Managed Payments | Per payment: Stripe's fees plus 3.5%. That's about €0.32 on €9 a month, or €3.15 on €90 a year (about €0.26 a month) |

**At 100 customers:** about €25 a month in total, roughly €0.25 per customer, not counting payment fees. That's well under the €1 limit.

**Storage:** about 11 reports × 3 ranges × up to 15 KB per property, under 0.5 MB. So the 500 MB free database holds about 1,000 connected sites after the 7-day cleanup.

## 25. GA4 and Google facts (verified Oct 11, 2026)

| Topic | What we found | Source | What it means for us |
| --- | --- | --- | --- |
| Field names | Every name in the roadmap's card table exists. Also available: `sessionPrimaryChannelGroup`, `yearMonth`, `isoYearIsoWeek`, `linkDomain`, `fileName`, `outbound` | [API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) | Queries in section 10.2 use these names |
| AI channel | GA4 has a default channel "AI Assistant". It covers ChatGPT, Gemini, Deepseek, Copilot and Grok, and excludes AI Overviews and AI Mode | [Default channel group](https://support.google.com/analytics/answer/9756891) | AI card = channel OR our domain list (section 11.5) |
| Key events | `keyEvents` only counts from when an event was marked key. Older data doesn't change | [API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) | Signups uses `eventCount` (section 11.2) |
| Realtime | Last 30 minutes (60 on 360). Dimensions include `city`, `country`, `countryId` and `unifiedScreenName`, but **no `pagePath`** | [Realtime schema](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema), [basics](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-basics) | Live pages show page titles. The globe uses a lookup table |
| Quotas | Per standard property: 200,000 tokens a day, 40,000 an hour, 14,000 per project per property per hour, 10 concurrent requests, and **10 server errors per project per property per hour** (then requests are blocked). `returnPropertyQuota` shows what's left | [Quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas) | Cache, batch, limit concurrency, careful retries (section 10.4) |
| Freshness | Realtime: minutes. Standard intraday: 2–6 hours. Daily: about 12 hours. "Data processing can take 24-48 hours" | [Data freshness](https://support.google.com/analytics/answer/11198161) | Ranges end yesterday, marked "still updating". The email goes out Monday at 13:00 |
| OAuth Testing status | Refresh tokens expire in 7 days in "Testing". They also stop after 6 months unused, on revocation, or when time-limited access expires | [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2#expiration) | Publish "In production" early, and handle `invalid_grant` |
| Unverified apps | Capped at 100 new users. Verification needs a verified domain, privacy policy and demo video, and takes 3–5 business days (from the roadmap) | [Unverified apps](https://support.google.com/cloud/answer/7454865), [sensitive scopes](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification) | Submit in Sprint 3 |
| Admin API | v1beta has `accountSummaries`, `properties` (`timeZone`, `createTime`, `serviceLevel`), `dataStreams` and `keyEvents` | [Admin API](https://developers.google.com/analytics/devguides/config/admin/v1/rest) | Property choice (section 7) and the signup picker |
| Supabase free | 500 MB database. "May pause" after 7 days of low activity. The shared pooler is IPv4-only and session mode supports prepared statements. The direct connection is IPv6 | [Pricing](https://supabase.com/pricing), [connecting](https://supabase.com/docs/guides/database/connecting-to-postgres), [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) | Session pooler. The health check keeps it active |
| Resend | Free: 3,000 a month, 100 a day. Pro: $20 for 50,000 with no daily cap | [Pricing](https://resend.com/pricing) | Upgrade at about 90 weekly-email users |
| Stripe Managed Payments | Stripe is the merchant of record and handles tax in 80+ countries, for an extra 3.5% per transaction. European businesses are supported, and SaaS qualifies. Subscriptions must be created through Checkout or Payment Links | [Overview](https://docs.stripe.com/payments/managed-payments), [eligibility](https://docs.stripe.com/payments/managed-payments/eligibility) | Section 16 |
| Stripe Checkout trials | `subscription_data.trial_end` and `trial_period_days` are supported | [Free trials](https://docs.stripe.com/payments/checkout/free-trials) | Early upgrade keeps the remaining trial days |
| Next.js 16 | `proxy.ts`, Turbopack by default, no `next lint`. With Cache Components on, `revalidate` and `dynamic` exports are removed in favour of `"use cache"`. The docs can be fetched as Markdown | [Upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) | Sections 3 and 15 |
| Better Auth | Google `accessType: "offline"` and `prompt`, `encryptOAuthTokens`, `updateAccountOnSignIn`, and `getAccessToken` with automatic refresh | [Google](https://www.better-auth.com/docs/authentication/google), [options](https://www.better-auth.com/docs/reference/options), [OAuth](https://www.better-auth.com/docs/concepts/oauth) | Section 6 |
| Sentry free | 5,000 errors, 1 uptime monitor and 1 cron monitor | [Pricing](https://sentry.io/pricing/) | Section 20 |
| Funnel API | Still v1alpha according to the roadmap. Not checked, because it's V2 | — | — |

## 26. To verify in later sprints

| What | When |
| --- | --- |
| The Better Auth CLI command and generated schema | Sprint 0 |
| How Better Auth encrypts tokens, and `getAccessToken` refreshing them | Sprint 1 |
| The REST transport (`fallback`) for the GA4 clients | Sprint 1 |
| ~~Whether the hourly chart for 7 days looks right on small sites~~ It didn't: 7 days is daily now | Sprint 2 |
| The exact "AI Assistant" channel string the API returns on a real property | Sprint 3 |
| The ESLint colour rules catch raw colours in class names and strings without false alarms, and the shadcn parts work with Tailwind's default colours removed | Sprint 0 |
| ~~Managed Payments with two prices, `trial_end` in Checkout, the Customer Portal, and the right tax code~~ Checked in test mode on Oct 12, 2026: Checkout accepts `managed_payments` together with `subscription_data.trial_end`; the product has the SaaS tax code `txcd_10103001` and VAT-inclusive prices. The Portal opens with the default settings; switching between monthly and yearly needs the Portal's "customers can switch plans" setting with both prices (Siamak's part) | Sprint 4 |
| ~~Supabase's Postgres version, so the backup client version matches~~ Postgres 17.11: the backup image is `postgres:17-alpine` | Sprint 4 |

## 27. Open questions (not blocking Sprint 0)

| Question | Needed by |
| --- | --- |
| Legal entity name, address, country and contact email for the privacy policy and terms | Sprint 3 |
| ~~Are the prices shown with VAT included?~~ Yes, VAT included (Siamak, Oct 11, 2026) | Sprint 3 (pricing section) |
| ~~What is the refund rule for yearly plans?~~ A full refund within 14 days of a yearly payment (Siamak, Oct 11, 2026) | Sprint 3 |
| Support address: `hello@simpledash.app` forwarded to your inbox with Cloudflare Email Routing? | Sprint 3 |
