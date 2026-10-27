# SimpleDash V1 technical spec

Oct 11, 2026 · Written by Claude Code from `docs/ROADMAP.md` · Status: approved plan, before any Sprint 0 code

**Updated Oct 11, 2026 (session 2):** a yearly price and Growth shown as "coming soon" (sections 16 and 17), one theme and brand file and a UI quality bar (section 18), and code structure and reuse rules (section 4).

**Updated Oct 27, 2026 (session 18):** a new footer for the landing and legal pages: a brand-coloured band with a last call, a live band of SimpleDash's own numbers, and the name as a bar chart of its last 10 days (sections 5, 17 and 18).

**Updated Oct 15, 2026 (session 13, end):** ranges end today (Siamak): Last 7 days, Last 30 days and Last 12 months include today so far, on the dashboard and public pages, and are compared with the period before. Free's 30 days start on the first day of Last 30 days. The Monday email keeps last Monday to Sunday with its own range (`lastWeekRange`). Reports for ranges that end today stay fresh for 30 minutes (an hour on public pages) (sections 8, 10, 14 and 16).

**Updated Oct 15, 2026 (session 13, later):** no site limit on either plan. Free and Pro both open every Google Analytics site in the account, so paused sites, the "n of 10" count and the Free footer in the site menu are gone (sections 7, 15, 16 and 28.1).

**Updated Oct 15, 2026 (session 13):** one site menu for every plan: it lists every Google Analytics site in the Google account, opens any of them with one click, and has a gear to each of the user's sites' settings. All sites (`/sites`) and the add or switch dialog are gone. Settings is split into pages with a menu on the left: Profile, Plan & billing, Monday email, and one page per site (sections 5, 7 and 28.1).

**Updated Oct 14, 2026 (session 10):** Free and Pro replace Starter, Growth and the trial (section 16): Free is one site and 30 days with nothing locked, Pro is $9 a month or $90 a year with everything. Free's 30 days in the date menu and ranges (sections 8 and 16), the Monday email for Pro (section 14), "Powered by" on Free public pages only (section 15), the pricing section (section 17), and open-source files (README, NOTICE, CONTRIBUTING, SECURITY).

**Updated Oct 14, 2026 (session 9):** production moved to one server with Docker Compose and Caddy, set up by `deploy/setup.sh`, with deploys from GitHub Actions (sections 2, 3, 20 and 21).

**Updated Oct 13, 2026 (session 8):** Sprint 7 built: revenue from Stripe and sales by source (section 28.3, "How it's built"), with `revenue_source`, `revenue_day` and the sale columns (section 9) and the `revenue-sync` job (section 20). Sprint 6 built: Google search insights (section 28.2, "How it's built"), with the two new site columns (section 9). Sprint 5 built: how the Growth plan, several sites, per-site public pages and the multi-site Monday email work (section 28.1, "How it's built"), with the data model, billing, jobs and env vars updated (sections 9, 16, 20 and 22).

**Updated Oct 13, 2026 (session 7):** the V2 plan (section 28) and the V3 list (section 29), as decided by Siamak.

**Updated Oct 12, 2026 (session 6):** custom date ranges with a calendar, and keys in the date menu (sections 8 and 15); list cards without titles or CSV buttons, with "Details" (search and CSV in a modal), Browser and OS in Devices, City in Countries, and the summary line in the email only (sections 10.2, 11 and 13).

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

- **Date ranges** end today, so far (since Oct 15, 2026; before, they ended yesterday). 12 months means 11 full months and this month so far (section 8).
- **Better Auth** handles Google sign-in instead of Auth.js (section 6).
- **Stripe Managed Payments** handles VAT and sales tax, with Stripe as the merchant of record (section 16).
- ~~**When a trial ends unpaid**, the dashboard locks and the weekly email and public page pause too.~~ Since Oct 14 there's no trial and nothing locks: Free and Pro (section 16).

Added later the same day:

- **Pricing** (replaced on Oct 14 by Free and Pro, section 16): one plan, **Starter**, at €9 a month or €90 a year (2 months free). **Growth** (€19 a month or €190 a year) shows as "Coming soon". Pricing is a section on the landing page with a Monthly / Yearly switch (sections 16 and 17). This replaces the roadmap's "one plan at €9 a month" for V1.
- **Theme and brand in one file:** `src/config/theme.ts`, and the code only uses its tokens (section 18).
- **Light theme only** in V1, confirmed (section 18).
- **UI bar:** the polish of the best tools in this space (Siamak named DataFast), with our own design (section 18).

## 2. Architecture

```
                Cloudflare: DNS · proxy · SSL Full (strict) · cache for static files, landing, legal, /p/*
                                                   │
              One server (Azure today) · Docker Compose · Caddy with the Cloudflare Origin Certificate
                      ┌────────────────────────────────────────────────┐
  browser ──────────► │ Next.js 16 app (standalone image, one process) │
                      │   pages · route handlers · server actions      │
                      │   src/lib/ga4      data layer + report cache   │──► GA4 Data API + Admin API
                      │   src/lib/auth     Better Auth                 │──► Google OAuth
                      │   src/lib/email    React Email                 │──► Resend
                      │   src/lib/billing  Checkout, Portal, webhook   │◄─► Stripe (Managed Payments)
                      │   Sentry (server only)                         │──► Sentry
                      └──────────────────────┬─────────────────────────┘
   cron on the server (hourly, daily) ───────┤  calls /api/internal/jobs/* inside the app container
   backup container (nightly) ───────────────┤──► Cloudflare R2
                                             ▼
                      Postgres 17 in a container on the same server: plain Postgres via Drizzle

   GitHub Actions, on every merge to main: check → build the image → send it to the server over SSH
```

**The pipeline:**

1. The user signs in with Google.
2. A property is chosen automatically.
3. The GA4 data layer fetches reports and stores them in `report_cache`. There is one shared entry per property, report and range.
4. The dashboard, the weekly email and the public page all read from that cache.

**The setup** is one app container and one database container, on one server. There is no queue, no Redis and no separate worker. Background work runs in one of two ways:

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
| Globe | MapLibre GL JS (globe projection), DiceBear Notionists faces | 6.13, 9.4 | Loaded only when the live view opens; map data self-hosted in `public/globe` |
| Language | TypeScript, strict | 6.0.3, pinned | typescript-eslint needs < 6.1. TypeScript 7 comes later |
| Database | Postgres in a container on the server (`postgres:17-alpine`), plain Postgres | 17 | The same image runs locally (section 21) |
| Hosting | One Ubuntu or Debian server with Docker Compose, Caddy and cron, behind Cloudflare. GitHub Actions deploys | Caddy 2 | `deploy/`, section 21 |
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
├── .github/workflows/deploy.yml     checks pull requests; on main also builds and deploys
├── deploy/                          the production server (section 21)
│   ├── setup.sh                     one command per server, run on the Mac
│   ├── simpledash                   the command on the server: setup, deploy, status, logs, backup…
│   ├── compose.yaml · caddy/site.caddy · proxy/ (the shared HTTPS proxy) · crontab
│   └── secrets/                     app.env, certificate, deploy key (git-ignored)
├── next.config.ts · drizzle.config.ts · vitest.config.ts · eslint.config.mjs · .prettierrc
├── drizzle/                         SQL migrations (generated, committed)
├── public/                          flags/ (SVG), images
├── scripts/
│   ├── migrate.mjs                  runs migrations when the container starts
│   ├── run-job.mjs                  used by the cron jobs on the server
│   └── backup/                      Dockerfile + backup.sh and restore.sh (pg_dump ↔ R2)
├── docs/                            ROADMAP, SPEC, CHECKLIST, STORY, DECISIONS, <area>.md
└── src/
    ├── proxy.ts                     sends signed-out visitors from /dashboard and /settings to /signin, and signed-in ones from /signin to /dashboard
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
    │   ├── globe/                   LiveButton, the live view and LiveGlobe (both lazy)
    │   ├── marketing/               Hero · HowItWorks · Pricing · Faq · Footer
    │   └── settings/                the settings frame, its menu and the sections
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
| `/` | **Landing**: headline, the live demo in a browser frame, how it works in 3 steps, pricing section (`#pricing`, section 17), FAQ, sign-in or Dashboard button, and the footer whose word is a chart | public | static, with the footer's numbers streamed in; cached about 10 minutes, plus Cloudflare |
| `/demo` | **Live demo** (section 17): a real public stats page, framed on the landing page with `?embed=1` | public | partly prerendered, cached about 10 minutes, plus Cloudflare |
| `/signin` | **Sign in**: one screen saying what we read (read-only), then "Continue with Google". A signed-in browser is sent to `/dashboard` (by the proxy, unless the address has a query such as `?expired=1`, so a stale cookie can't loop) | public | static |
| `/dashboard` | **Dashboard**: the cards (section 11); `?site=<id>` names the site (section 28.1) | signed in | dynamic, streamed per card, cache-first |
| `/settings` | **Settings → Profile**: the account, sign out, disconnect Google, delete account. Settings pages share one frame: a menu on the left ("Account", then "Sites"; a sideways row on phones) and the page beside it | signed in | dynamic |
| `/settings/billing` | **Settings → Plan & billing**: the plan, Upgrade or Manage billing (section 16) | signed in | dynamic |
| `/settings/email` | **Settings → Monday email**: on or off (Pro, section 14) | signed in | dynamic |
| `/settings/sites/[siteId]` | **Settings for one site**: public page, Google search insights, revenue, what counts as a sale, remove the site (section 28.1) | signed in, the user's own site | dynamic |
| `/p/[slug]` | **Public page** (section 15) | public | cached about 10 minutes, plus Cloudflare |
| `/privacy`, `/terms` | **Legal** | public | static, with the footer's numbers streamed in; cached about 10 minutes, plus Cloudflare |
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

**The site menu** (`SiteSwitcher`) sits at the top of the dashboard: "mysite.com ▾". It is the same on Free and Pro (since Oct 15, 2026; section 28.1).

- Opening it fetches the account summaries live, through a server action (`listMyProperties`). The browser keeps the list for 5 minutes, and hovering the chip starts the fetch early.
- It lists every Google Analytics site in the Google account, grouped by account. The user's own sites open with a plain link (`/dashboard?site=<id>`), and each has a gear to its settings (`/settings/sites/<id>`).
- Any other site opens with one click (`openSite`), with no dialog and no confirm:
  1. Check that the property is in the user's live Google list (never trust the browser).
  2. It joins the user's sites, on Free and Pro alike, with no limit (`addProperty`).
  3. Upsert and activate it, under a per-user lock (`connectProperty`), so two quick clicks can't leave two active sites.
  4. Go to its dashboard.
- Only one site is active at a time (the one the dashboard opens with). Rows that leave the list remember their notes, signup event and settings, so opening the site again restores them.

## 8. Date ranges and comparisons

**Days:**

- All dates are calendar dates in the site's GA4 time zone. "Today" means today in that time zone.
- Dates are worked out with `Intl.DateTimeFormat` and plain date arithmetic, with no date library.

| Date menu | Current period | Compared with | Chart points |
| --- | --- | --- | --- |
| **Today** | today so far | not compared: today isn't over, so the cards say "Today isn't over yet" | hourly (`dateHour`), midnight to the latest hour Google has reported |
| **Yesterday** | yesterday | the day before | hourly (`dateHour`), 24 points |
| **Last 7 days** (default) | the 7 days ending today (six full days and today so far) | the 7 days before that (today being partial, the change reads a little low until the day ends) | daily (`date`), 7 points; today is dashed, and left off until Google has reported it. Hourly was tried in Sprint 2 and read as noise over a week on small sites (see `docs/DECISIONS.md`) |
| **Last 30 days** | the 30 days ending today | the 30 days before that | daily (`date`), 30 points, today as in Last 7 days |
| **Last 12 months** | the 11 full calendar months before this month, and this month so far | the 12 months before that | monthly (`yearMonth`), 12 points; this month is dashed |
| **Custom** | any run of whole days, from 14 Aug 2015 (GA4's first day) up to today, at most 5 years | the same number of days just before (not compared when it is today alone) | hourly for one day, daily up to 92 days, monthly after |

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
- **Free's 30 days** (section 16): on Free, "Last 12 months" shows a "Pro" badge and opens Settings → Plan & billing, the calendar starts on the first day of Last 30 days (`freeFirstDay`: today and the 29 days before), and a note under the menu says "Free shows the last 30 days. Pro shows everything." An address with an older range shows Last 30 days instead (`rangeForPlan`), on the dashboard, CSV downloads and public pages. A Free owner's public page leaves 12 months out of its menu.

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
| `is_active` | boolean | Exactly one active per user (partial unique index): the site the dashboard opens with, the one opened most recently |
| `display_name` | text | From GA4 |
| `domain` | text null | From the web stream, e.g. `mysite.com` |
| `time_zone` | text | e.g. `Europe/Amsterdam` |
| `currency_code` | text | |
| `service_level` | text | Standard or 360 (quotas and realtime window differ) |
| `property_created_at` | timestamptz | For "Not enough history to compare" |
| `signup_event` | text null | The key event the user chose |
| `status` | text | `ok` · `needs_reconnect` · `no_access` |
| `quota_blocked_until` | timestamptz null | Set after a 429 |
| `added_at` | timestamptz null | In the user's list since (Sprint 5). Null: switched away from or removed, kept for its notes and settings |
| `last_viewed_at` | timestamptz null | When its dashboard was last opened, stamped at most hourly; `warm-cache` uses it (Sprint 5) |
| `search_console_url` | text null | The Search Console property for Google search insights, e.g. `sc-domain:example.com` (Sprint 6) |
| `brand_terms` | text[] | Extra spellings of the site's name, at most 10 (Sprint 6) |
| `sale_event`, `sale_page` | text null | What counts as a sale: a GA4 key event or a "thank you" page path (Sprint 7) |
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
- **`public_page`**: `site_id` pk fk → site (cascade), `user_id` fk (for clean-up), `slug` unique, `enabled` boolean (default false), `cards` text[], `indexable` boolean (default true), `updated_at`.
  - A slug is 3–40 characters of `[a-z0-9-]`. Reserved words are blocked.
  - One page per site since Sprint 5 (it was one per user, showing the active site).
- **`user_settings`**: `user_id` pk fk, `weekly_email` boolean (default true), `email_notice_dismissed` boolean (default false), `created_at`, `updated_at`.
- **`billing`**: `user_id` pk fk, `status` (Stripe subscription status, or null on Free), `plan` (`pro`, from the price; null until the first payment), `stripe_customer_id`, `stripe_subscription_id`, `plan_interval` (`month` or `year`, null until the first payment), `current_period_end`, `cancel_at_period_end`, `state_at`, `updated_at`.
- **`email_send`**: `user_id` fk, `week_start` date, `sent_at`, `provider_message_id`. The primary key is (`user_id`, `week_start`), so a week's email can only go out once.
- **`stripe_event`**: `event_id` pk, `type`, `received_at`. The webhook skips events it has already stored.
- **`revenue_source`** (Sprint 7): `site_id` pk fk → site (cascade), `user_id` fk, `secret` (the restricted Stripe key, encrypted), `key_hint` (last 4), `livemode`, `status` (`ok` · `invalid`), `covers_from` (first day of the totals), `last_sync_at`, `last_error`, `mrr_left_out`, `connected_at`.
- **`revenue_day`** (Sprint 7): `site_id` fk (cascade), `day` (the site's time zone), `money` jsonb (per currency: `charged`, `refunded`, smallest unit), `new_customers`, `mrr` jsonb null (per currency, on the days recorded). Primary key (`site_id`, `day`). Aggregate only: no customer data.

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
| 12 | `browsers` | `browser` | `activeUsers` | — | current | desc, 50 | Devices (Browser tab) |
| 13 | `systems` | `operatingSystem` | `activeUsers` | — | current | desc, 25 | Devices (OS tab) |
| 14 | `cities` | `city`, `countryId` | `activeUsers` | — | current | desc, 100 | Countries (City tab) |

**Batching:**

- Reports are sent with `batchRunReports`. That allows up to 5 requests per batch, all for the same property.
- Batch A is reports 1–5, batch B is 6–10, and batch C is 11–14.
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
   - 30 minutes for any period that ends today (1 hour on a public page), because today keeps changing: Today, 7 days, 30 days, 12 months and custom ranges up to today
   - 3 hours for Yesterday and custom ranges that end yesterday (12 hours on a public page)
   - 24 hours for custom ranges that ended before yesterday (they won't change)
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
| `invalid_grant` from Google's token server (the grant is gone) | `site.status = needs_reconnect` | **Google access revoked** state |
| 401 `UNAUTHENTICATED` from an API (the access token was turned down) | Drop the token and ask once more with a new one from Google's token server (`withGoogleToken`). If the token server refuses the grant, it's the row above. A 401 that a new token doesn't fix is logged as unavailable, never a reconnect | Nothing, or with nothing cached: "Google Analytics isn't answering right now." |
| 403 `PERMISSION_DENIED` | `site.status = no_access` | "You no longer have access to this Google Analytics site", plus the switcher |
| 500, 503 or timeout | Retry once after about 1 s. A per-property breaker opens after 5 server errors in an hour, because Google blocks a project and property pair after 10 | Cached numbers. With nothing cached: "Google Analytics isn't answering right now." |
| Quota running low | When `tokensPerHour.remaining` drops below 10%, skip background refreshes and serve the cache | Nothing |

Other limits:

- At most 5 GA4 requests run at once per property, using an in-process limiter. Google allows 10.
- Each request has a 15 s timeout.
- Every failure goes to Sentry with the property ID. Tokens are never sent.
- **Access tokens** are kept in memory for at most 10 minutes, and never past a minute before Google says they run out. Better Auth hands back its stored token until 5 seconds before the end, so one with less than a minute left is swapped for a new one first (since 26 Oct: a token kept past its hour gave 401s, which used to mark every site "access ended").

**Quota budget:** loading one range from scratch takes 3 batch calls covering 11 reports. Google says most requests cost 10 tokens or fewer. That is far below the limit of 14,000 tokens per project per property per hour.

## 11. Dashboard

The dashboard is one scrolling page.

- **Top bar:** the logo and a link to Settings.
- **Toolbar** (`OverviewToolbar`, shared with public pages and the demo): the site chip with its icon (on the dashboard it opens the site switcher), the date menu (`RangePicker`: Today, Yesterday, Last 7 days, Last 30 days, Last 12 months; it opens with a short fade and zoom, the label changes at once and a spinner shows while the new numbers load), and the period in words with its hint (section 8).
- **Below it:** notices (weekly email notice, state banners from section 12), then the cards. The period next to the date menu is small and light.
- **The overview** (`OverviewCard`): one card with the numbers in a row, short dividers between them (two by two on phones), the live count as the last one (section 11.10), and the visitors chart underneath. A cell never gets narrower than its label and number: when they don't fit (Pro with Stripe on a narrow window), the last ones move to a new row, and a cell alone on its row takes all of it. Downloads for the chart and the four numbers sit in one small CSV menu.
- **Layout:** one column on phones, a grid on wider screens.
- **List cards** (`ListCard`: Sources, Pages, Countries, Devices, AI traffic, Actions) have no visible title and no CSV button, like DataFast: tabs at the top left name the view ("Country | City"), the view's column names sit at the right, and "More" at the bottom opens the whole list (section 13). The title stays for screen readers; the plain-words help moved into Details. A card with one view shows its name as a single tab.
- **The overview** keeps its ⓘ help. "Right now" is no longer a card: it is the live count, the last number of the overview, and the live view's footer carries the GeoNames credit (section 11.10).
- **What changed** (section 31.2) sits right under the overview: the sources and landing pages behind a change, on every plan.
- **Built from shared parts:** every list card sits in the shared `CardShell` (title, help, CSV, and the loading, empty, error, stale and locked states). The card list, titles and help text come from `src/config/cards.ts` (section 4).
- **List cards have a fixed height** of 10 rows (`RankedList`), whatever their number of rows, so cards side by side line up and nothing moves. The rest of a list is in Details. Share bars are soft blue (`chart-1`) and grow in when a list appears.

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

**Since 12 Oct 2026 the summary line is in the weekly email only** (Siamak asked to take it off the pages; the numbers speak for themselves there). The rules stay as they are.

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
- Each tab shows the top 10; Details has up to 50. Paths are shown as they are.

### 11.7 Countries

Two tabs: **Country | City**.

- **Country:** a flag, the country name, visitors and share.
  - The flag comes from `countryId`. It is a self-hosted 3:2 SVG from country-flag-icons (MIT), because emoji flags don't show on Windows.
  - The name comes from `country`.
- **City** (report `cities`: `city` and `countryId`, top 100): the city with its country's flag, and visitors. A city is kept with its country (Paris, France is not Paris, Texas). Cities Google couldn't place are one "Unknown" row, without a flag. Cities come from the visitor's network, so one can be a nearby city; the help says so.
- Top 10 in the card; Details has the rest.

### 11.8 Devices

Three tabs: **Browser | OS | Device**, each with visitors, share and an icon.

- **Browser** (report `browsers`: `browser`, top 50) and **OS** (report `systems`: `operatingSystem`, top 25). Names in plain words: "Macintosh" reads "macOS", "Safari (in-app)" reads "Safari (in an app)", "(not set)" reads "Unknown". Values that read the same are merged.
- **Device** (`deviceCategory`): Desktop, Mobile and Tablet. Any other category is shown as "Other".
- **Icons** are self-hosted SVGs in `public/icons/tech`, copied by `scripts/copy-tech-icons.mjs`: brand logos from SVG Logos (CC0) and device pictures from Icons8's Flat Color Icons (MIT). Icons8's set has no plain computer screen (its "display" is a digital number display that read "00"), so the desktop picture is our own drawing in the same style (`scripts/tech-icons/desktop.svg`). `src/config/tech-icons.ts` says which GA4 name gets which file; anything else gets a plain globe (browsers) or question mark.

### 11.9 Actions

**Rows:**

- **Downloads:** `file_download`.
- **Outbound clicks:** `click`. Enhanced Measurement sends this event for links that leave the site.
- **Form submits:** `form_submit`.
- **Signups:** the chosen event.

Rows with zero are hidden. If every row is zero, the card says: "No actions recorded yet. Turn on Enhanced Measurement in GA4 to count downloads, outbound clicks and forms." It also links to Google's help.

### 11.10 Live globe

Two parts (since 22 Oct 2026, Siamak): a live count, the last number of the overview, and the live view it opens. The count sat beside the date menu until 24 Oct, when Siamak moved it into the numbers row so it reads as one of them and is clearly clickable.

**The live count.** "● Right now 3", the last cell of the overview's numbers row, on the dashboard, public pages (when "Right now" is on) and the demo (with sample live data when the demo shows sample data).

- Under the number, "Open the globe →" in the link colour says it opens something. The whole tile is the click area, with a soft background on hover and a focus ring; its ⓘ help still opens on its own.
- Alone on a wide row (phones, or when the row has no room), it lies flat: the label, the number, and "Open the globe" at the right. It has its own container for this (`@container/live`); its number follows the card (`@container/overview`), so it matches the others.
- The dot is green and pulses while anyone is there, grey at zero. Screen readers hear "3 visitors in the last 30 minutes. Open the live view."
- It is one Realtime request (`activeUsers`, no dimensions), asked for every 20 seconds while the tab is visible.
- **The early ask (dashboard only):** 5 seconds after the page opens, the count is asked for once more with `&fresh=1`, which takes an answer at most 5 seconds old instead of 20 (`LIVE_EARLY` in `src/lib/ga4/freshness.ts`). An owner who just opened their own site sees themselves without waiting 20 seconds. It happens once per page load, not again after the live view closes. Public pages don't need it: their visitors aren't on the site being counted.

**The live view** (a dialog, about 90% of the screen on a computer, the whole screen on a phone):

- A globe on a starry night sky, with a drawn face for each visitor at their city (up to 3 faces per marker, "+N" for the rest). Hovering a marker shows a card with each place, its flag and count. Places that would overlap on screen share a marker, worked out again after each zoom (`src/lib/globe/groups.ts`).
- A panel (top left on a computer, under the globe on a phone): the count, Page views, Signups (when a signup event is chosen), visitors per minute over the window as bars, and tabs: Places, Pages, Devices, Actions. Picking a place flies the globe there and shows its card.
- The globe turns slowly until touched, and not at all with `prefers-reduced-motion`. Drag to turn, scroll to zoom.
- The faces are decoration: GA4 says how many people are in a city, never who. The panel says so ("Faces are for fun: visitors stay anonymous.").
- Everything is asked for every 20 seconds while the view is open, and the live count follows it.
- The sky is a deep blue (`globe-space`, lightened on 24 Oct so it feels less heavy) with still stars and a soft glow behind the globe. The panel's footer says only that the faces are for fun, and the credits.

**Realtime API queries.** Realtime covers the last 30 minutes on standard properties and 60 on GA4 360. The Realtime API has no traffic source dimension, so there's no "where they came from" list.

- **Count:** metric `activeUsers`, no dimensions.
- **Places:** dimensions `countryId`, `country` and `city`, metric `activeUsers`, limit 100.
- **Pages:** dimension `unifiedScreenName`, metric `activeUsers`, limit 10. The Realtime API has no page path, so **live pages show page titles**.
- **Devices:** dimension `deviceCategory`, metric `activeUsers`.
- **Visitors per minute:** dimension `minutesAgo`, metric `activeUsers`. Minutes without a row are zero.
- **Actions:** dimension `eventName`, metric `eventCount`, limit 50. Shown like the Actions card (downloads, outbound clicks, form submits, signups); `page_view` gives Page views.

**From place names to coordinates** (on the server):

- A static lookup table built from GeoNames (CC BY 4.0, through the `all-the-cities` package) by `scripts/build-places.mjs`: about 14,000 places with 30,000+ people, matched on country code and city name (accents ignored, plus a few English names such as Cologne).
- If no city matches, use the country's population-weighted centre.
- GeoNames needs a credit line, which is in the privacy policy and the Right now help.
- Only coordinates, labels, country codes and counts are sent to the browser.

**`/api/live?site=<id>`** returns the count `{ total, minutes }`; with `&view=full` it returns everything the view shows: `{ total, minutes, places: [{ lat, lng, visitors, label, countryCode }], pages: [{ title, visitors }], devices: [{ device, label, visitors }], perMinute: number[], events: { [eventName]: count } }`. `/api/p/<slug>/live` does the same for a public page. Both are cached for 20 seconds per property, in memory, shared by everyone watching; a fresh full answer also answers the count. `/api/live?site=<id>&fresh=1` (the dashboard's early ask) takes a cached count only when it's at most 5 seconds old, so a user can make Google be asked at most every 5 seconds per property.

**The map** (no map service, nothing sent anywhere else):

- MapLibre GL JS with the globe projection, loaded only when the view opens (the panel shows first).
- Country shapes from Natural Earth (public domain, through the `world-atlas` package, 1:50m), a label point per country and Geist for the labels, written to `public/globe/` by `npm run globe:data`. About 205 KB compressed.
- Russia's and Fiji's outlines cross 180°, which flat map tiles read as a line across the world: `src/lib/globe/antimeridian.ts` makes their longitudes continuous first.
- MapLibre's worker file is served from the installed package (`new URL(..., import.meta.url)`), so it always matches the library.
- Colours are theme tokens (`globe-space`, `globe-ocean`, `globe-land`, `globe-border`, `globe-label`, `globe-glow`).
- Faces: DiceBear's Notionists (CC0), made in the browser from a seed per place, so a place keeps its faces between updates.
- Without WebGL the globe stays empty; the panel has every number.

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
| **Older than Free's 30 days** | Free, and the address asks for 12 months or older custom days | Last 30 days, with the note "Free shows the last 30 days, so this is Last 30 days. Pro shows 12 months and any dates you pick." (section 16) |
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

### Details and CSV

- **Details** (`ListDetails`, at the bottom of every list card, on the dashboard, public pages and the demo): a modal with every row of the view shown in the card ("City", "Browser"), a search box (accents and case don't matter), and a CSV button.
  - Centred on wide screens, nearly full height on phones; it fades and zooms in, and Escape, the X or a click outside close it. A long list keeps its height while searching, so the modal doesn't jump. On touch screens the keyboard doesn't open by itself.
  - The CSV is built in the browser from the rows shown (all of them, or the ones found), with the same header, quoting and formula safety as below (`listCsv`). No extra request.
- **The overview's CSV menu** (dashboard only) downloads the chart and the four numbers from `/api/csv/<card>?range=…`, built from the same cached reports, so there are no extra GA4 calls unless a report is missing.
- **File name:** `simpledash-<domain>-<card>-<start>-<end>.csv`.
- **Format:** a plain-word header row, UTF-8, and RFC 4180 quoting.
- **Safety:** a cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'`. Page titles and sources come from the open internet and could carry spreadsheet formulas.

## 14. Weekly email

**When it's sent:**

- The `weekly-email` job runs every hour. It picks users who meet all of these:
  - The weekly email is on.
  - The account is on Pro (the Monday email is a Pro feature, section 16).
  - The active site has status `ok`.
  - Local time in the site's time zone is Monday, between 13:00 and 17:59.
  - There is no `email_send` row for this week yet.
- 13:00 leaves time for GA4's usual 12-hour processing of Sunday. The window runs to 17:59 so that a send that failed or was skipped (Resend down, a deploy at the wrong minute) is tried again the next hour, without sending in the evening.
- The job fetches fresh 7-day reports: `totals`, `sources`, `pages`, `actions`, `ai_sources` and `change_paths`. These also update the dashboard cache.
- If there were no visitors in either week, no email is sent.

**Content** (React Email, `src/lib/email/weekly-email.tsx`):

- **Subject:** "mysite.com: 1,234 visitors last week (up 23%)".
- The summary line.
- The 4 numbers (Visitors, Page views, Avg. time, and Signups if set) for Monday–Sunday vs the week before.
- Top 3 sources and top 3 pages.
- An AI traffic line, only when it's above 0.
- Three lines from section 31, each left out when it has nothing to say: **What moved** (up to 3 sources), the first **What brings customers** line for the last 30 days, and **This week on Google search** (the weekly pick and its main fact).
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

- **Can be shown:** Visitors, Page views, Avg. time, Visitors chart, Sources, Pages, Countries (with cities), Devices (with browsers and systems), AI traffic, Signups, Live.
- **On by default:** Visitors, Page views, Visitors chart, Sources, Pages, Countries.
- **Off by default:** Signups and Live.
- **Chart notes are never shown.**

**Page contents:**

- The same layout as the dashboard: the toolbar (the site chip is the page's `h1`), the overview card and the list cards with their Details (section 11).
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

- **Paused:** when the owner is disconnected from Google, the page only says "This page is paused." with the SimpleDash link. It is `noindex` and drops out of the sitemap.
- **Turned off (or never made):** the page shows "Page not found" with `noindex`. The page streams inside a Suspense boundary (Cache Components), so the status code is already 200 when the database answers; a real 404 status would need a lookup before rendering on every view. Search engines treat a `noindex` page like a 404.

**Sitemap:** includes pages that are on, indexable, and whose site is in the owner's list and working (one query).

## 16. Billing

**Plans and prices** (Siamak, Oct 14, 2026; they replace Starter, Growth and the 14-day trial). They live in one place, `src/config/plans.ts`, which feeds the pricing section, the upgrade screens, settings, the terms, structured data, `llms.txt` and every server-side limit.

| Plan | Price | What it includes |
| --- | --- | --- |
| **Free** | $0. No card, no time limit | All the GA4 sites in the Google account (no limit, since Oct 15, 2026); Today, Yesterday, 7 and 30 days (custom days inside the last 30); every dashboard card; a public stats page per site with "Powered by SimpleDash" |
| **Pro** | $9 a month, or $90 a year (2 months free), tax included. Launch price: it stays the same while the subscription runs without a break | Everything in Free, plus: 12 months and any dates, the Monday email, Google search insights (section 28.2), revenue from Stripe and sales by source (section 28.3), and a public page without our link |

- "2 months free" is worked out from the prices (12 × $9 − $90 = $18, which is 2 months of $9). It is never typed in by hand.
- Prices are in US dollars (`currency` in `plans.ts`) and shown as "$9" (`formatPrice`, narrow symbol).
- Stripe has one product, "SimpleDash Pro" (SaaS tax code `txcd_10103001`), with two tax-inclusive USD prices: `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` (section 22).
- The terms say Free may change, with 30 days' notice by email.

**Limits** (`entitlements(planState)` in `src/lib/billing/plan.ts`, from `plans.ts`). The number of sites is not one of them: both plans open every site (Siamak, Oct 15, 2026; until then Free had 1 and Pro 10).

| Limit | Free | Pro | Enforced in |
| --- | --- | --- | --- |
| `fullHistory` | No: the last 30 days (`FREE_HISTORY_DAYS`) | Yes | `rangeForPlan` (`src/lib/ga4/ranges.ts`): the dashboard, CSV downloads and public pages show Last 30 days instead of an older range, with a note on the dashboard. The date menu shows "Last 12 months" with a Pro badge that opens Settings → Plan & billing, and the calendar starts 30 days back |
| `weeklyEmail` | No | Yes | The weekly-email job only reads paying accounts; Settings shows the email as part of Pro |
| `searchConsole`, `revenue` | No | Yes | Their actions, cards, jobs and settings sections (section 28) |
| `poweredBy` | Yes | No | The public page's footer (section 15); the landing page's demo always shows it |

**Plan state** (`getPlan(user)`, `planState` in `src/lib/billing/plan.ts`, unit tested):

- **Paid (Pro):** the Stripe subscription status is `active`, `trialing` or `past_due`.
- **Free:** everything else, including after a subscription ends. Nothing locks: Free keeps every site, its dashboard, its public page and the data.

**Upgrade:** the server action `upgrade` (`src/app/actions/billing.ts`) creates a Checkout Session (`createCheckout` in `src/lib/billing/checkout.ts`).

- **Where:** Settings → Plan & billing and the "part of Pro" panels (Google search insights, revenue, the Monday email). They hold the same Monthly / Yearly switch as the pricing section (`BillingSwitch`), here as a form field named `interval`. The form posts to the server action, so upgrading needs no JavaScript.
- **Price:** the action checks `interval` (`month` or `year`) with Zod and picks `STRIPE_PRICE_MONTHLY` or `STRIPE_PRICE_YEARLY` on the server. **The browser never sends a price ID.**
- Subscription mode, no trial. **Stripe Managed Payments** is on, so Stripe is the merchant of record and handles VAT and sales tax.
- Someone already paying gets the Customer Portal instead.
- On success, go to `/dashboard?upgraded=pro`. On cancel, go to `/settings/billing`.

**Manage:** a Stripe Customer Portal session for card, invoices, cancelling, and switching between monthly and yearly (the Portal's plan-switching setting lists both Pro prices).

**Settings → Plan & billing** shows the plan in plain words: "Free", "Pro · $90 a year · renews on 11 Oct 2027" or "Pro · $9 a month · ends on 4 Nov 2026", with "Upgrade to Pro" or "Manage billing".

**Webhook** (`/api/stripe/webhook`):

- Check the signature with `STRIPE_WEBHOOK_SECRET`.
- Store the event ID and skip repeats.
- Update `billing` for these events:
  - `checkout.session.completed`
  - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - `invoice.paid`, `invoice.payment_failed`
- Read the subscription's price and store `plan` (`pro`) and its interval in `billing`. A paid subscription on a price that isn't one of Pro's two (an old Starter or Growth test price, say) is still Pro, and is reported to Sentry.
- **Unit tests:** signature check, each event to status, price to plan and interval, repeated events, and out-of-order events (the newest subscription state wins).

**Managed Payments limits:** subscriptions can only be created through Checkout or Payment Links, and Connect isn't supported. Neither affects us.

**Migration `0007_pro_plan.sql`:** every row that had a paid plan becomes `pro`, and `billing.trial_ends_at` is dropped.

## 17. Landing page, legal pages and SEO files

### Landing page (`/`), statically generated

**Headline and button:** exactly as in the roadmap.

- H1 "Google Analytics, in a dash."
- The roadmap's subheadline.
- Button "See my dashboard, free" → `/signin`.

**Signed in:** the top bar shows "Dashboard →" instead of "Sign in", and the hero button and both pricing buttons read "Open my dashboard →". The page stays static and cacheable: the proxy keeps a small `sd_signed_in=1` hint cookie (not HttpOnly, no secret) while the app is used, an inline script in `<head>` reads it before the first paint and marks `<html data-signed-in>`, and CSS (the `signed-in:` variant) shows the right buttons. Nothing moves. Signing out clears the cookie. It is only a hint: `/dashboard` still checks the session (`src/lib/auth/signed-in-hint.ts`).

**Live demo** (`DemoFrame`):

- A real public stats page (`/demo?embed=1`) inside a browser window: three dots on the left, the page address in the middle (`simpledash.app/p/<slug>`), a soft outer frame, and a handwritten "Interactive demo" note with an arrow.
- Fixed height: the page scrolls inside the window, and its date menu, tabs and tooltips work.
- The frame starts loading only when it comes near the screen, then fades in over a placeholder of the same shape, so the landing page's first load stays light.
- **Which page:** `src/config/demo.ts` holds the slug (now `meetline-me`) and the range the demo opens with. If that page is missing or paused, `/demo` shows sample data instead, so the landing page never breaks.
- **The live globe in the demo:** the real page shows its live count when its owner turned on "Right now". The sample data shows it always, with a still sample (`sampleLive`: 9 visitors in 7 cities), so the globe can be tried on the landing page and on `/demo`. The live view opens inside the demo's frame.
- **`/demo` on its own** shows the same page with a "Live demo" banner and a "Get yours, free" button. It always allows every range and shows "Powered by SimpleDash", whatever the demo owner's plan. It is `noindex` (the original is `/p/<slug>`), may be framed by our own site only (`frame-ancestors 'self'`), and is cached like a public page.
- **No Recharts on the landing page:** the demo uses the server-rendered chart, and its JavaScript runs inside the frame.

**Works with** (`WorksWith`, `#works-with`, between the demo and How it works; Siamak, Oct 27, 2026): "Works with the tools you already use", then Google Analytics 4, Google Search Console and Stripe as names with our own plain icons (integrations, not customers, so never "trusted by"; Google's logos aren't ours to use), then four facts as chips: "Verified by Google" (Google approved the app's data access on Oct 27, 2026), "Read-only access", "No tracking script", "Open source".

**How it works, in 3 steps** (`#how-it-works`; redesigned Oct 27, 2026):

1. Sign in with Google.
2. We find your GA4 site.
3. See your visitors, sources and top pages on one page.

- A pill "How it works", the heading "Three steps to your numbers" and one line under it.
- Each step is a card with a small drawing of it made of HTML (no image files): the consent screen reduced to "See your Google Analytics · Read-only access · Allow", the account's sites with the busiest picked, and one page with the visitors line (it draws itself in as it scrolls into view) and top sources. The drawings show shapes and labels, never made-up numbers. Under the drawing: "01", the step and its sentence.
- A soft brand glow behind the cards and a fading dot grid behind each drawing.
- Under the steps, one card split in three: Zero setup, Full charts from day one, A flat price, each with an icon tile.

**Section addresses:** every landing section has an id to link to and share: `#hero`, `#demo`, `#works-with`, `#how-it-works`, `#pricing`, `#faq`, `#footer`.

**Pricing section** (`#pricing`, linked as "Pricing" from the landing page's top bar and footer). Both links glide to it (`scroll-behavior: smooth` on the page, off for reduced motion; `data-scroll-behavior="smooth"` on `<html>` so Next.js keeps changing pages instant). They are plain `<a href="/#pricing">` links: Next.js's `Link` ignores a click to the address already showing, so a second click did nothing. From the legal pages they open the landing page at its pricing. Everything on its cards comes from `src/config/plans.ts` (section 16).

- **Monthly / Yearly switch** (the shared `BillingSwitch`):
  - Two radio buttons styled as a segmented control, labelled "Monthly" and "Yearly". A handwritten "2 months free" note with an arrow points at Yearly (screen readers hear "Yearly · 2 months free").
  - The white pill slides to the checked option, and CSS `:has()` shows the matching prices, so it needs no JavaScript.
  - It starts on Monthly. Arrow keys move between the options, and focus is visible.
- **Prices roll** like an odometer when the switch moves (`RollingPrice`, CSS only): "$9" ⇄ "$90". "/ month" and "/ year" crossfade, and for Yearly a "Save $18 a year" line opens under Pro's price (12 × the monthly price − the yearly price).
- **Free card** (since Oct 14, 2026): "$0", its feature list (section 16), and the outline button "Start free →" → `/signin`, with "No card needed, no time limit" under it.
- **Pro card** (highlighted): "$9 / month", or "$90 / year" with "Save $18 a year". "Everything in Free, plus" its feature list. The button "Start free, upgrade any time →" → `/signin`, with the launch price note under it. Billing is chosen at upgrade, in Settings (section 16).
- Both cards are the shared `PlanCard` (`components/shared`), which the in-app upgrade also uses in a compact size.
- The heading is "Free to start, one simple price", with "Prices include tax."

**Hero:** under the button, "Free for all your sites · no card · read-only access · Pro $9 a month".

**FAQ:** "Do I need GA4?", "What do you store?", "Can SimpleDash change anything in my Google account?", "Is it really free?", "Is SimpleDash open source?" (the code on GitHub, AGPL-3.0) and "Do I have to add a tracking script?".

**Footer** (`SiteFooter`, on the landing and legal pages; Siamak, Oct 27, 2026). A band in the brand colour at the end of the light page, in the `footer` tokens (section 18; Siamak, Oct 27, 2026: lighter than the first near-black), with a soft glow and frosted glass. Top to bottom:

1. **Last call:** the tagline as a large heading, "Free for all your sites · no card · read-only access" (from `plans.ts`), and the hero's button on the white `light` variant ("See my dashboard, free", or "Open my dashboard →" when signed in). Beside it, three link columns: Product (Pricing, Live demo, Compare), Learn (Docs, Guides, GA4 glossary) and Company (Privacy, Terms, Cookie settings, the support email). Under them, two frosted pills: "Open source on GitHub" (GitHub icon) and "Made by Sia" (X icon, `brand.makerUrl`), both opening in a new tab (with "opens in a new tab" for screen readers).
2. **Live band:** a frosted strip with a slow scrolling line of SimpleDash's own live numbers, for example "23 visitors in the last 30 minutes · 7 in the United States · 4 reading Pricing · 15 on computers", ending with when it was checked ("checked 6 minutes ago", worked out in the browser). CSS only; it stops on hover and for reduced motion, and the repeated copy is hidden from screen readers. Left out when nobody was there.
3. **The word is a chart:** the name "SimpleDash", edge to edge and cut off at the bottom of the page. Its 10 letters are the last 10 days of visitors, today last:
   - Each letter is as wide as it is in the name (Siamak, Oct 27: bigger letters), and the word fills the width. A frosted glass bar rises in each letter's column, from zero, to that day's visitors against the busiest of the 10 days, with a bright top edge. Inside the bar the letter shows softly (white at about 40%); above it the letter stays a dim ghost. Hover, keyboard focus or an open card makes that letter, its glass and its number bright white (Siamak, Oct 27, 2026). The bar's height carries the number, not the letter's shape, so short letters ("m", "a") don't make a day look busier; wide letters have wide bars.
   - The day's number and its short name sit on top of each bar ("254", "Fri 23"). Today is a dashed, fainter bar with "Today", because it is still updating.
   - **A letter is a button** (read as "Friday 23 October: 254 visitors. Show this day"). Clicking it opens a frosted card above its number (a native popover, placed with CSS anchor positioning; Esc or a click outside closes it): the long day name, the number rolling up from 0 like an odometer, the change from the day before ("↗ Up 16% vs Saturday"; never for today, which isn't over), and its rank ("Busiest of these 10 days", "3rd busiest", "Quietest"; today only ever "Already the busiest"). As it opens, a streak of light crosses that letter's glass, its number grows a little, and the other letters step back. No JavaScript.
   - Hover or keyboard focus dims the other letters, and a plain sentence above the word says the day, its visitors and "the busiest of these 10 days" when it is.
   - The bars rise one after another as the word scrolls into view (a CSS scroll-driven animation, transforms and `clip-path` only, so no layout shift). Browsers without it, and reduced motion, show the finished bars.
   - Above the word: "This word is a chart: each letter is a day of visitors to simpledash.app" and "Click a letter" ("Tap a letter" on touch screens).

**Where the numbers come from** (`src/config/footer.ts`, `src/lib/public-page/footer.ts`):

- SimpleDash's own public stats page, named by its slug in `src/config/footer.ts` (`simpledash-app`; not the demo's site). The footer shows only what that page shows: the word needs the page to be on and to show "Visitors over time"; the live band needs "Right now", and its countries, pages and devices need those cards.
- The 10 days are the last 10 points of the page's Last 30 days chart, through the same report cache as the public page. A day before the GA4 property existed has no number: its column stays empty with "–", never a zero.
- The live band uses the live view's data (`getLive`), shared with the dashboard and public page.
- `getFooterStats()` is `"use cache"` for about 10 minutes and tagged like the public page. The footer streams in after the static page (`connection()` inside `Suspense`), so the landing and legal pages stay partly prerendered and send the public pages' `Cache-Control` (Cloudflare keeps them about 10 minutes).
- **Nothing to show** (the page is off or paused, Google failed, or before it streams in): the plain ghost word at the same size, with no numbers, no live band and no caption. Never a fake zero, and nothing moves when the real word arrives.
- **Cost:** at most one series report an hour (shared with the public page) and six small realtime requests every 10 minutes.

**Brand:** the name is always SimpleDash, one word. The logo is a "–" dash mark, drawn by the shared `Logo` component. The favicons (`icon.tsx`, `apple-icon.tsx`) and the Open Graph images draw it from the theme file (section 18), so a brand colour change reaches them too.

### Legal pages (`/privacy`, `/terms`)

Both are static, in plain English. Claude drafts them, Siamak reviews them (this is not legal advice), and they need Siamak's legal details (section 27).

**The privacy policy must cover:**

- **What we store:** users, settings, encrypted Google tokens, chart notes, public-page settings and short-lived report caches. Never visitor-level data.
- **What we read from Google:** read-only Analytics, and why.
- **Google's rules:** compliance with the Google API Services User Data Policy, including the Limited Use requirements. Google verification needs this.
- **Processors:** the server host (Microsoft Azure today; it also holds the database), Cloudflare (with R2 for backups), Resend, Stripe (as merchant of record) and Sentry.
- **Retention and deletion:** deleting the account removes everything; disconnecting revokes Google access.
- **Cookies:** the necessary ones (session and sign-in state), plus Google Analytics' (`_ga`, `_ga_…`, 13 months) only after consent.
- **Our own analytics** (Siamak, Oct 14, 2026): Google Analytics 4 on all of simpledash.app (website, dashboard, public pages), behind a consent banner (`ConsentBanner`, `src/components/shared/consent.tsx`, in the root layout):
  - Nothing loads before "Accept"; "Decline" means Google's script is never loaded. "This website uses cookies", with Decline (outline) and Accept (brand colour) the same size side by side.
  - The choice is saved in the browser with its date and asked again after 13 months (Accept) or 6 months (Decline). "Cookie settings" in the footer and on the privacy page reopens it; taking back an Allow deletes the `_ga` cookies and reloads.
  - Never inside a frame (the landing page's demo) or on `/email/*` (the unsubscribe address holds a token).
  - Ads features off: ad storage and personalisation denied, no Google signals.
  - The ID is `NEXT_PUBLIC_GA_MEASUREMENT_ID` (public, written in at build time; `deploy/setup.sh` copies it to the GitHub variable `GA_MEASUREMENT_ID`, passed as a build argument). Empty means no banner and no analytics. Google loads only on the live host, never in development.
  - **Key events** (Siamak, Oct 18, 2026), with Google's recommended names and parameters (`src/lib/analytics/events.ts`, tested), only these four:

    | Event | When | Parameters |
    | --- | --- | --- |
    | `sign_up` | Google sign-in created the account: Better Auth's `newUserCallbackURL` returns to `/dashboard?auth=signup` | `method: "Google"` |
    | `login` | A returning account signed in (or reconnected): `callbackURL` `/dashboard?auth=login` | `method: "Google"` |
    | `begin_checkout` | "Upgrade to Pro" was submitted (`CheckoutEvent` in the upgrade form) | `currency`, `value` (the interval's price from `plans.ts`), `items` (`pro_month` or `pro_year`) |
    | `purchase` | Stripe returned to `/dashboard?upgraded=pro&session_id=…`, and the server read that Checkout Session from Stripe: the signed-in user's, complete and paid (`checkoutPurchase`, `purchaseFromSession`) | `transaction_id` (the session ID; GA4 counts it once), `value` (before tax), `tax`, `currency`, `items` |

  - **How they're sent:** `trackEvent()` in `consent.tsx` sends at once when Google's script runs, keeps events until the visitor chooses when they haven't yet (sent if they accept, dropped if they decline), and drops them after "Decline". Off the live host it only writes `[analytics] …` to the console in development. `SendEvents` (dashboard) sends once, then takes `auth` and `session_id` out of the address a tick later (after the router's own effect), with `history.replaceState(null, …)` so the router keeps the new address.
  - **Never sent:** names, emails, user or account IDs. The purchase itself is still handled only by the Stripe webhook; the event is for counting.
  - **Not tracked:** `refund` (it would need Google's Measurement Protocol from the webhook) and `generate_lead` (SimpleDash has no lead form). Marking `sign_up` and `purchase` as key events in GA4 is the next step.
- **Contact.**

**The terms cover:**

- the service
- Free (and that it may change, with 30 days' notice by email)
- Pro's prices, the launch price, and billing through Stripe as merchant of record: monthly or yearly, renewing automatically
- cancellation and refunds (the refund rule for yearly plans is an open question, section 27)
- acceptable use
- liability
- governing law

### SEO

- **Titles and descriptions:** unique per page, with the title template "%s · SimpleDash".
- **Canonical URLs:** built from `APP_URL`.
- **Open Graph images:** one for the landing page (`opengraph-image.tsx`, generated at build time) and one per public page.
- **Structured data:** `SoftwareApplication` JSON-LD on the landing page: name, description, `applicationCategory` "BusinessApplication", `operatingSystem` "Web", and `offers`.
  - Three `Offer`s from `plans.ts`, priceCurrency "USD": Free at 0, and Pro at 9 a month (`unitCode` "MON") and 90 a year (`unitCode` "ANN"), each of Pro's with a `UnitPriceSpecification` (tax included).
- **`robots.txt`:**
  - Allows `/`, `/privacy`, `/terms` and `/p/`.
  - Blocks `/dashboard`, `/settings`, `/admin`, `/signin`, `/api/` and `/email/`.
  - Links to the sitemap.
- **`sitemap.xml`:** landing, privacy and terms (Sprint 3), plus public pages (Sprint 4).
- **`llms.txt`:** short plain text for AI assistants: what SimpleDash is, who it's for, features, prices (Free; Pro at $9 a month or $90 a year), what we store, and key links (including `/#pricing` and `/demo`).

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
| Footer | `footer`, `footer-foreground`, `footer-muted`, `footer-border`, `footer-ghost`, `footer-accent`, `footer-live-dot` | The footer band (section 17): the brand colour, white text, quiet text, lines, the dim letters, the white bars and focus ring, and the live dot |

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
- **Ranked lists** (Sources, Pages, Countries, Devices, AI traffic, Actions) share one `RankedList` block inside `ListCard`:
  - each row has an icon or flag, a label and a value
  - a soft blue share bar sits behind the row (`bg-chart-1/12`) and grows in
  - the whole row highlights on hover
  - long labels are cut short, and the full text stays available on hover and to screen readers
  - the card shows the top rows at a fixed height; "More" opens the rest in a modal

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
- Recharts and MapLibre are split into their own chunks; the live view and its globe load only when the live count is clicked (fetched early on hover or focus).

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
- **Charts:** a caption plus "View as table". The globe's places are listed in the live view's panel, and picking one there flies the globe to it; the globe itself is hidden from screen readers.
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

Jobs run from cron on the server (`deploy/crontab`, as the `simpledash` user, times in UTC). Each one runs `simpledash job <job>`, which runs `node scripts/run-job.mjs <job>` inside the app container. That POSTs to `http://localhost:3000/api/internal/jobs/<job>` with the bearer secret. Output goes to the journal (`simpledash logs jobs`).

| Job | When | What it does |
| --- | --- | --- |
| `warm-cache` | hourly at :05 | For listed `ok` sites, on every plan, whose dashboard was opened in the last 24 hours (`last_viewed_at`, since Sprint 5): refresh the 7-day reports when they're stale or the day has turned in the site's time zone. Skips quota-blocked sites |
| `weekly-email` | hourly at :00 | Section 14 |
| `revenue-sync` | hourly at :20 | Brings Pro sites' Stripe totals up to date (section 28.3) |
| `cleanup` | daily at 03:30 UTC | Deletes `report_cache` rows not fetched for 7 days, and expired sessions and verification rows |
| backup | nightly at 02:00 UTC | Runs in a separate small container with a Postgres client and rclone. `pg_dump` (custom format) of our `public` and `drizzle` schemas, without the rows of `report_cache`, `session` and `verification`, then gzip, then the R2 bucket. An R2 lifecycle rule deletes copies after 30 days. Restore one into local Postgres once, to prove it works. Setup and restore: `docs/backup.md` |

### Monitoring

- **Sentry** (server only):
  - Errors from GA4 calls, jobs and webhooks.
  - One free uptime monitor on `/api/health`.
  - One free cron monitor on the weekly email job.
- **`/api/health`** runs `select 1` and returns 200 or 503. The uptime check calls it every minute, and each deploy waits for it before keeping a new version.

### Usage counts (`/admin`, only for `ADMIN_EMAILS`)

- Signups: total, last 7 days and last 30 days.
- Connected sites.
- Free, and Pro monthly and yearly.
- The share of accounts on Pro.
- Public pages turned on.
- Monday email turned on (Pro accounts only).

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

### `compose.yaml` (local)

- **`db`:** `postgres:17-alpine` with a volume, for local development.
- **`app`:** builds the Dockerfile, reads `.env` and serves port 3000. Use it to test the production image locally.

### Local development

1. `docker compose up -d db`
2. `npm run db:migrate`
3. `npm run dev`

Next.js runs on the Mac and Postgres runs in Docker. This needs Docker Desktop or OrbStack, which is not installed on this Mac today.

### Production: one server (Siamak's call, Oct 14, 2026)

No Coolify and no Supabase in production. Step by step for Siamak: `docs/deploy.md`.

**`deploy/compose.yaml`** runs three containers in `/opt/simpledash`:

- **`app`:** the image `simpledash-app:current`, never pulled from a registry. `DATABASE_URL` comes from `POSTGRES_PASSWORD`; everything else from `.env` (a copy of `deploy/secrets/app.env`). No published port; it joins the shared `web` network as `simpledash-app`.
- **`db`:** `postgres:17-alpine` with a named volume. No published port, not on `web`.
- **`backup`:** built from `scripts/backup/`; waits for cron's nightly `backup.sh` and setup's `restore.sh` (section 20, `docs/backup.md`).

**The shared proxy** (`deploy/proxy`, in `/opt/proxy`): one Caddy (`proxy-caddy`) on ports 80 and 443 for every site on the server, whose Caddyfile only imports `etc/sites/*.caddy`. SimpleDash's block (`deploy/caddy/site.caddy`, written as `sites/simpledash.caddy` with the domain from `APP_URL`) serves the Cloudflare Origin Certificate from `/opt/proxy/certs/simpledash/` (SSL mode Full (strict), 15 years, no Let's Encrypt), redirects `www` to the bare domain, refuses `/api/internal/*` and proxies the rest to `simpledash-app:3000`. Setup creates the proxy and the `web` network only if they're missing, and a block the proxy rejects is put back, so other sites on the server are never touched (`docs/deploy.md`, "Several sites on one server").

**`deploy/setup.sh <user@server> [--from <user@old-server>]`**, run on the Mac:

1. Installs and signs in the GitHub CLI if needed. Builds `deploy/secrets/app.env` from `.env.example` the first time (new random secrets, service keys copied from `.env`), adds variables new to `.env.example` later, makes the deploy key, and asks in the terminal for any missing required value and the certificate, so one run is enough.
2. Sends the release files and secrets over SSH and runs `simpledash setup` as root: system updates and automatic security updates, UTC clock, 2 GB swap, Docker from Docker's apt repository with the rotating `local` log driver, `ufw` (SSH, 80, 443), the `simpledash` user and the files. Then it starts `db` and `backup`, and the shared proxy with this site's block.
3. With `--from`: stops the old server's app and backs it up.
4. `simpledash restore --if-empty`: the newest R2 backup, only into an empty database and before the app's first start.
5. Sets the GitHub secrets (`DEPLOY_HOST`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, from the server's own host keys over the same SSH session) and the variable `DEPLOY_PLATFORM` (from the server's CPU), then runs the first deploy and waits for it.
6. Checks port 443 on the server's IP, and with a Cloudflare token sets the DNS records (`A` proxied, `www` CNAME if missing).

**`.github/workflows/deploy.yml`:**

- Every pull request and push: `npm ci` and `npm run check` on Node from `.nvmrc`.
- On `main` (or by hand), once `DEPLOY_PLATFORM` is set: builds the `Dockerfile` for that platform with the GitHub Actions cache, then streams the image (`docker save`) with `deploy/` and `scripts/backup/` to `simpledash@server` over SSH. One deploy at a time.
- The deploy key is restricted on the server to `command="simpledash deploy"`: no shell, no forwarding.

**`simpledash deploy`** (on the server): loads the image as `simpledash-app:<commit>`, updates the release files, tags the old `current` as `previous`, starts the new one (migrations run first) and waits up to 3 minutes for a healthy `/api/health`. If it isn't healthy, it goes back to `previous` and fails the run. It updates its block in the shared proxy and removes older images. Migrations stay additive, so going back never meets a schema it can't read.

## 22. Environment variables

These become `.env.example` in Sprint 0. Each variable is added in the sprint shown, and `README.md` lists them once they exist.

| Name | Used for | Example or format | From |
| --- | --- | --- | --- |
| `APP_URL` | Absolute links, canonical URLs, Better Auth base URL | `http://localhost:3000` · `https://simpledash.app` | Sprint 0 |
| `DATABASE_URL` | Postgres: local Docker. On the server `deploy/compose.yaml` sets it, so `app.env` leaves it out | `postgres://…` | Sprint 0 |
| `POSTGRES_PASSWORD` | Server only: the Postgres container's password, from which compose builds `DATABASE_URL` and `BACKUP_DATABASE_URL`. Letters and digits; set once | random | Oct 14 |
| `BETTER_AUTH_SECRET` | Signs sessions and encrypts Google tokens | 32+ random bytes | Sprint 1 |
| `GOOGLE_CLIENT_ID` | Google OAuth | | Sprint 1 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | | Sprint 1 |
| `CRON_SECRET` | Protects the job endpoints | random | Sprint 1 |
| `EMAIL_TOKEN_SECRET` | Signs unsubscribe links | random | Sprint 4 |
| `RESEND_API_KEY` | Sending email | | Sprint 4 |
| `EMAIL_FROM` | Sender address | `SimpleDash <hello@simpledash.app>` | Sprint 4 |
| `STRIPE_SECRET_KEY` | Stripe API | test key in development | Sprint 4 |
| `STRIPE_WEBHOOK_SECRET` | Webhook signatures | | Sprint 4 |
| `STRIPE_PRICE_MONTHLY` | Pro, $9 a month (tax included) | `price_…` | Sprint 4 |
| `STRIPE_PRICE_YEARLY` | Pro, $90 a year (tax included) | `price_…` | Sprint 4 |
| `STRIPE_MANAGED_PAYMENTS` | Turns Managed Payments on in Checkout | `true` (default) | Sprint 4 |
| `SENTRY_DSN` | Server error reports (optional) | | Sprint 4 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | SimpleDash's own Google Analytics ID, behind the consent banner (section 17). Public; build time, via the GitHub variable `GA_MEASUREMENT_ID` | `G-…` (empty: off) | Oct 14 |
| `ADMIN_EMAILS` | Who can open `/admin` | comma-separated | Sprint 4 |
| `BACKUP_DATABASE_URL` | Backup container: database to dump and restore into. Set by `deploy/compose.yaml` | `postgres://…` | Sprint 4 |
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
| The server (2 vCPU, 2–4 GB; Azure today) | the provider's price for that size. Postgres runs on it, so there's no database bill |
| GitHub Actions (checks, builds, deploys) | €0: 2,000 minutes a month on a private repo; a deploy takes about 5–8 |
| Cloudflare (DNS, proxy, cache, Email Routing) and R2 (10 GB free) | €0 |
| Resend | €0, then $20 at about 90 weekly-email users |
| Sentry Developer | €0 |
| Stripe and Managed Payments | Per payment: Stripe's fees plus 3.5%. 3.5% of $9 is about $0.32, plus Stripe's card fee; check Stripe's current pricing |

**At 100 customers:** the server plus about €20 for Resend, not counting payment fees. With a server under €60 a month, that's under €0.80 per customer, inside the €1 limit.

**Storage:** about 11 reports × 3 ranges × up to 15 KB per property, under 0.5 MB. So 500 MB of the server's disk holds about 1,000 connected sites after the 7-day cleanup.

## 25. GA4 and Google facts (verified Oct 11, 2026)

| Topic | What we found | Source | What it means for us |
| --- | --- | --- | --- |
| Field names | Every name in the roadmap's card table exists. Also available: `sessionPrimaryChannelGroup`, `yearMonth`, `isoYearIsoWeek`, `linkDomain`, `fileName`, `outbound` | [API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) | Queries in section 10.2 use these names |
| AI channel | GA4 has a default channel "AI Assistant". It covers ChatGPT, Gemini, Deepseek, Copilot and Grok, and excludes AI Overviews and AI Mode | [Default channel group](https://support.google.com/analytics/answer/9756891) | AI card = channel OR our domain list (section 11.5) |
| Key events | `keyEvents` only counts from when an event was marked key. Older data doesn't change | [API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) | Signups uses `eventCount` (section 11.2) |
| Realtime | Last 30 minutes (60 on 360). Dimensions include `city`, `country`, `countryId` and `unifiedScreenName`, but **no `pagePath`** | [Realtime schema](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-api-schema), [basics](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-basics) | Live pages show page titles. The globe uses a lookup table |
| Quotas | Per standard property: 200,000 tokens a day, 40,000 an hour, 14,000 per project per property per hour, 10 concurrent requests, and **10 server errors per project per property per hour** (then requests are blocked). `returnPropertyQuota` shows what's left | [Quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas) | Cache, batch, limit concurrency, careful retries (section 10.4) |
| Freshness | Realtime: minutes. Standard intraday: 2–6 hours. Daily: about 12 hours. "Data processing can take 24-48 hours" | [Data freshness](https://support.google.com/analytics/answer/11198161) | Ranges end today, so far, with the newest point marked "still updating" (yesterday until Oct 15, 2026). The email goes out Monday at 13:00 |
| OAuth Testing status | Refresh tokens expire in 7 days in "Testing". They also stop after 6 months unused, on revocation, or when time-limited access expires | [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2#expiration) | Publish "In production" early, and handle `invalid_grant` |
| Unverified apps | Capped at 100 new users. Verification needs a verified domain, privacy policy and demo video, and takes 3–5 business days (from the roadmap) | [Unverified apps](https://support.google.com/cloud/answer/7454865), [sensitive scopes](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification) | Submit in Sprint 3 |
| Admin API | v1beta has `accountSummaries`, `properties` (`timeZone`, `createTime`, `serviceLevel`), `dataStreams` and `keyEvents` | [Admin API](https://developers.google.com/analytics/devguides/config/admin/v1/rest) | Property choice (section 7) and the signup picker |
| Supabase free | 500 MB database. "May pause" after 7 days of low activity. The shared pooler is IPv4-only and session mode supports prepared statements. The direct connection is IPv6 | [Pricing](https://supabase.com/pricing), [connecting](https://supabase.com/docs/guides/database/connecting-to-postgres), [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) | Development only since Oct 14, 2026: production runs its own Postgres (section 21) |
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

## 28. V2 plan: the Growth plan (Siamak, Oct 13, 2026)

> **Since Oct 14, 2026, Growth is Pro and Starter is Free** (section 16): every "Growth" feature below is in Pro, and "Starter" or "the trial" means Free. There is no trial any more. The text below stays as it was planned and built.

Siamak's decisions on Oct 13, 2026 replace the roadmap's V2 list (`docs/ROADMAP.md` itself is unchanged). V2 starts now, by Siamak's choice, before the roadmap's 3-paying-users gate.

**The rule for every V2 feature:** exact numbers only. No estimates, no guessed matches, nothing a user can't rely on. When a number can't be known, the screen says what's missing instead.

**In V2:** the Growth plan, several sites, Search Console, and revenue from Stripe with sales by source. **Not in V2** (section 29): X mentions, AI questions, milestone images, Hacker News and Product Hunt markers, alerts, the "new site linked to you" heads-up and the signup funnel. **Dropped for good:** the checkout snippet that stores the GA visitor ID in Stripe, sending purchases into GA4 with the Measurement Protocol (it needs write access to the user's GA4), and estimated revenue per source or per search.

### 28.1 Sprint 5: Growth plan and several sites

> **Since Oct 15, 2026,** the site menu, All sites and settings per site work differently: see "Update (Oct 15, 2026)" at the end of this section.

**Growth plan:**

- €19 a month or €190 a year, VAT included, in `src/config/plans.ts`. Its feature list becomes: several sites, Google search insights, revenue from Stripe, sales by source. (Alerts, mentions and AI questions leave the list: they're V3.)
- Stripe: a second product, "SimpleDash Growth", with a monthly and a yearly price (`STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_YEARLY`), Managed Payments and the SaaS tax code like Starter.
- `billing.plan` (`starter` | `growth`), set by the webhook from the price ID. Switching plans goes through the Customer Portal (all four prices allowed).
- The pricing section's Growth card loses "Coming soon" and gets its own trial button. Checkout takes a `plan` field next to `interval`, checked with Zod on the server.
- **Limits** in `plans.ts` and enforced on the server: Starter 1 site; Growth up to 10 sites (Siamak, Oct 13, 2026). Search Console and Stripe are Growth only; Starter sees them with an "Upgrade to Growth" panel, never an error.
- **The trial stays Starter:** the 14-day trial gives Starter's features only. Growth features show the "Upgrade to Growth" panel during the trial too, and Growth starts when someone pays for it (Siamak, Oct 13, 2026).

**Several sites:**

- A Growth user adds GA4 sites from the site menu ("Add a site") up to the limit; each added site keeps its own signup event, notes, Search Console link and public page. Starter keeps today's behaviour: one site, switchable.
- **All sites** (`/sites`, Growth): one card per site with its visitors for the last 7 days, the change, and a small chart; a click opens that site's dashboard.
- The dashboard address names the site (`/dashboard?site=<id>`, checked with `requireSite()` like today), so a shared link opens the right one.
- `public_page` moves from one per user to one per site (a migration keyed on `site_id`).
- **The Monday email** stays one email per account, with one block per added site.
- **Cost:** GA4 calls grow with sites. Before several sites ship, `warm-cache` refreshes only sites whose dashboard was opened in the last 24 hours (`site.last_viewed_at`); the Monday email and public pages fetch what they need themselves.

**Done when:** a Growth test user pays in test mode, adds three sites, switches between them and sees all three on `/sites`; a Starter user sees the upgrade panel.

**How it's built (Sprint 5, session 8):**

- **What a plan allows** comes from `limits` in `plans.ts` (`sites`, `searchConsole`, `revenue`) through one function, `entitlements(planState)` in `src/lib/billing/plan.ts`. Paid Growth gets Growth's limits; a trial, paid Starter, an unknown price and a locked account get Starter's. Every server check reads it; nothing else decides.
- **`billing.plan`** (`starter` | `growth`, null before the first payment) is set by the webhook from the subscription's price: the two Starter prices mean Starter, the two Growth prices mean Growth. Any other price is reported to Sentry and counts as Starter. The migration sets `starter` for rows that already have a subscription.
- **Checkout** (`startCheckout`): the form sends `plan` and `interval`, both checked with Zod; the price ID is picked on the server from the four env vars. The success URL says which plan (`/dashboard?upgraded=growth`), so the thank-you notice names it.
- **Starter → Growth for someone already paying:** a Customer Portal session with the "confirm a subscription update" flow, preset to the matching Growth price (monthly stays monthly), so it is one confirm screen at Stripe with Stripe's own proration. If the Portal isn't set up for plan switching, a plain Portal session opens instead.
- **Choosing a plan** (the locked panel, Settings → Billing): one Monthly / Yearly switch above two compact plan cards, each with its own submit button (`name="plan"`), so it still needs no JavaScript. The cards are the pricing section's `PlanCard`, moved to `components/shared` with a `compact` look.
- **"Upgrade to Growth"** (`UpgradePanel`): a card saying what the feature is, Growth's price with the Monthly / Yearly switch, and one button. It replaces the feature where Starter (or a trial) reaches a Growth-only part: adding a second site, `/sites`, and later Search Console and revenue. Never an error page.
- **Sites in the account:** a new column `site.added_at`. A site with `added_at` set is in the user's list (Growth: up to 10, in the order added); `is_active` stays "the site the dashboard opens with", now the one opened most recently. The migration sets `added_at` for every user's active site. Starter's switcher works as before: the new site replaces the old one in the list (the old row keeps its notes and settings for later).
- **Which sites can be opened** (`siteAccess` in `src/lib/sites/access.ts`, pure and tested): Growth, every added site; Starter and trials, only the active one. `requireSite(siteId?)` checks the ID belongs to the user, is added, and is allowed; anything else is a 404 for actions and route handlers. The dashboard itself shows the upgrade panel for an added site the plan doesn't allow (an old link after going back to Starter), with "Switch to this site instead".
- **The site in the address:** `/dashboard?site=<id>` (no `site` means the active site). The date menu, Settings link, CSV and live endpoints, chart notes and the signup picker carry the site's ID, and the server checks it every time. Opening a site makes it the active one and stamps `last_viewed_at` (at most once an hour, after the response).
- **Going back to Starter** (Siamak, Oct 13, 2026): nothing is deleted. Added sites stay in the list but only the active one opens; the Monday email covers only that one; the others' public pages say "paused". Upgrading again brings everything back.
- **The site menu** (`SiteSwitcher`): the added sites as links (with "n of 10 sites"), then "All sites" (`/sites`) and "Add a site…" for Growth; for Starter, "Switch site…" and "Add another site" (which opens the upgrade panel on `/sites`). "Add a site…" and "Switch site…" open one dialog (`SitePickerDialog`): the user's GA4 properties fetched live, a search box, and Add or Switch on each row. Growth sites can be removed from Settings (the last one can't), which keeps their notes and settings.
- **All sites** (`/sites`): one card per added site, streamed one by one: icon and address, visitors for the last 7 days with the change, and a small server-rendered line (`Sparkline`, the same smooth curve as the chart). Status words where the numbers can't be fresh ("Google access ended", "No access"). A dashed "Add a site" card at the end, until the limit.
- **Public page per site:** `public_page` is keyed on `site_id` (migration `0004`: the column, a backfill from each user's active site, the new primary key; `user_id` stays for clean-up). Settings → Public page edits the page of the site being shown. A page whose site was removed, or isn't allowed on the owner's plan, is paused.
- **Settings per site:** `/settings?site=<id>`. Account parts (account, weekly email, billing, Google, delete) stay at the top; the site parts (public page, sites list, and later Search Console and Stripe) sit under "Site settings · mysite.com", with a site menu for Growth.
- **The Monday email:** one email per account, sent on Monday afternoon in the active site's time zone. One block per allowed site with visits (the summary, the four numbers, top sources and pages, AI traffic, its own dates and an "Open dashboard" link to that site). Subject: one site as before; several sites: "Last week: mysite.com 1,234 visitors (up 23%), and 2 more sites". Sites with no visits in either week are left out; with none left, nothing is sent.
- **`warm-cache`:** only added sites whose dashboard was opened in the last 24 hours (`last_viewed_at`), still skipping locked, broken and quota-blocked ones. It replaces the "signed in during the last 14 days" rule.
- **Usage counts** (`/admin`): paying is split into Starter and Growth.

**Update (Oct 15, 2026, Siamak): one site menu, settings pages.** This replaces the site menu, All sites and settings per site above.

- **The site menu** is the same on Free and Pro (section 7). It lists every Google Analytics site in the user's Google account, grouped by account when there are several, with a search box from 8 sites. One click opens a site: the user's own sites are links; any other site is opened by `openSite` and joins the user's sites. A ✓ marks the site shown, and a short warning line shows under a site whose Google access ended. Each of the user's sites has a gear to its settings.
- **Gone:** "Add a site…", "Switch site…", "All sites", the picker dialog (`SitePickerDialog`), the All sites page (`/sites`, with `SiteCard`, `AddSiteCard`, `SitesView`, `Sparkline` and the per-site summary query). Old `/sites` links are 404s.
- **Settings pages** (section 5), in one frame (`SettingsShell`): a slim top bar back to the dashboard, a menu on the left (`SettingsNav`: "Account" with Profile, Plan & billing and Monday email, then "Sites" with one item per site), and the page beside it. On phones the menu is a row that scrolls sideways. The addresses come from one place, `src/lib/settings-routes.ts`, and the menu's items from `settingsNavGroups` (`src/lib/settings-nav.ts`, tested).
- **A site's settings** (`/settings/sites/<id>`): public page, Google search insights, revenue from Stripe, what counts as a sale, and "Remove this site" (when the account has more than one). The site must be the user's own (`readSiteId`, then the user's list); anything else is a 404.
- **Old addresses keep working:** `/settings?site=<id>` (with `search`, `sale` and `revenue`) redirects to the site's page on the server, and `/settings#billing` and `#email` move to their pages in the browser (a hash never reaches the server).
- **Links and buttons** all show the pointer cursor (one base rule in `globals.css`, and the menu items).
- **No site limit (later the same day, Siamak):** Free and Pro both open every Google Analytics site in the account; the menu works the same on both. This replaces "Limits" and "Going back to Starter" above for sites: there are no paused sites any more. Gone with it: the `sites` limit in `plans.ts`, `openableSites`, the replace mode and `SiteLimitError` in `connectProperty`, `switchProperty`, the paused-site dashboard and settings (`PausedSiteView`, `PausedSiteSettings`, "Show … instead"), the "Several sites are part of Pro" panel, "n of 10 in use" and the Free footer in the menu, and "Paused" in the settings menu. A Pro account's Monday email has one block per listed site; public pages pause only when Google access ended.

### 28.2 Sprint 6: Google search insights (Search Console)

**Connecting** (Settings → a "Google Search Console" card, Growth): "Connect Search Console" asks Google for one more read-only scope, `webmasters.readonly`, only then. We list the user's Search Console sites (`sites.list`) and pick the one that matches the site's domain (`sc-domain:example.com` first, then `https://example.com/`); the user can change it. If none matches, the card says how to add the site in Search Console. Disconnecting drops the scope's use and the link.

**Data:** `searchanalytics.query` with the `query`, `page` and `date` dimensions, cached in `report_cache` like GA4 reports (new report names starting with `search_`). Aggregated rows only.

**What the user sees** (a "Google search" card with tabs, each list with Details like the other cards):

1. **Close to page 1:** searches where the site ranks 8 to 15 with the most impressions, grouped by page. "/pricing is on page 2 for 'ga4 dashboard', seen 3,200 times this month."
2. **What changed:** for the pages whose Google clicks fell or rose most against the period before, the searches behind it, with their clicks and position then and now. Facts only, never a reason.
3. **Your name vs new people:** clicks from searches that contain the site's name (worked out from the domain; the user can add spellings in Settings) against all other searches, over time.
4. **Seen but not clicked:** pages with many impressions whose click rate is well below the site's own average click rate at that position. Compared with the site itself, never with an industry number.
5. **Searches that lead to signups:** Google clicks per landing page next to that page's visitors and signups from GA4 (joined by page, which is exact; never "revenue per search").

**Changed by section 31.3 (Oct 17, 2026):** "Searches that lead to signups" became **Brings signups** (the first tab when a signup event is set), with each page's searches under it, and the card opens with **This week**, one page to work on.

**Honest on screen:** Search Console data is 2–3 days behind (the period says so), and Google leaves out rare searches ("Google hides searches made by very few people"). Search Console keeps 16 months.

**Google's side (Siamak):** add `webmasters.readonly` to the OAuth consent screen and get it verified (a sensitive scope); start this when the sprint starts, because review takes time.

**Done when:** a Growth test user connects Search Console on a real site and the five views match Search Console's own report for the same days.

**How it's built (Sprint 6, session 8):**

- **Asking for the scope:** "Connect Search Console" runs Better Auth's `linkSocial` for Google with `webmasters.readonly` added. Google shows one more consent screen (with `include_granted_scopes`), and Better Auth merges the new scope into the stored `account.scope` with the new tokens. (A plain sign-in never updates the stored scope; the "Allow access" button for Analytics uses the same link flow since this sprint, so that state can't loop.) The cached access token is dropped whenever Google's tokens change, so the next call carries the new scope.
- **The Search Console API** is called with `fetch` and the user's access token (`src/lib/search-console/client.ts`): `GET /webmasters/v3/sites` and `POST /webmasters/v3/sites/{site}/searchAnalytics/query`, 20-second timeout, errors mapped like GA4's (401 access ended, 403 no access or a missing scope, 429 Google's limit, 5xx not answering). Only `src/lib/search-console/` calls it. No new dependency.
- **Which Search Console property** (`match.ts`, pure, tested): from the verified ones in `sites.list`, the domain property for the site's own domain (`sc-domain:example.com`) first, then a URL-prefix property for it (`https://example.com/`, then `https://www.example.com/`, then `http://`). A domain property of a parent domain (`sc-domain:example.com` for `blog.example.com`) is offered too; when it is used, every query gets a page filter for the site's own host, so other subdomains never mix in. Picked automatically right after connecting (`/api/search-console/connected`, which then returns to Settings); the user can change it in Settings, and the server checks the choice is in their own list.
- **Stored per site** (migration `0005`): `site.search_console_url` (the property, or null) and `site.brand_terms` (extra spellings of the site's name, at most 10). Search reports are cached in `report_cache` like GA4's: aggregated rows only, keyed on the GA4 property (so clean-up stays the same), the Search Console window as the range, and the property, host filter and name spellings in `params_hash`.
- **The window** (`window.ts`, pure, tested): Search Console counts days in California time and is usually 2–3 days behind. A cheap query by date over the last 10 days finds the newest finished day (cached 6 hours). The dashboard's period is moved back so it ends on that day, keeping its length (Last 7 days → the 7 days ending on Google's newest day); the period before is the same length just before. The card always prints its own dates.
- **Reports** (each one cache row, fetched together, 9 Search Console calls for a new window):
  - `search_overview`: clicks, impressions, click rate and position for both periods, and clicks and impressions per day.
  - `search_insights`: searches by page for both periods, and pages for both periods (`rowLimit` 25,000, the API's maximum), worked into the four lists below at fetch time, so only the top rows are stored.
  - `search_brand`: clicks per day for searches matching the site's name, and for all other searches (Search Console's own `includingRegex` / `excludingRegex` filters), both periods.
  - Two GA4 reports for the same days (`search_landing`, `search_signups`): visitors and signup events by landing page for visits from Google search (`sessionSource` = google, `sessionMedium` = organic).
- **The five views** (`insights.ts`, pure, tested), each from Google's own numbers, compared only with the site itself:
  1. **Close to page 1:** searches whose average position rounds to 8–15, most seen first, grouped by page (25 pages, 10 searches each in the card; all in Details).
  2. **What changed:** the 5 pages whose Google clicks rose most and the 5 that fell most (at least 3 clicks of change), each with the searches behind it: clicks and position then and now. No reasons.
  3. **Your name vs others:** clicks per day from searches with the site's name against all other searches, with each total's change. The name comes from the domain (`meetline.me` → "meetline", "meet line" for a hyphen) plus the spellings from Settings. A note says the two add up to less than all Google clicks because Google hides rare searches.
  4. **Seen, not clicked:** pages seen at least 100 times whose click rate is under half of what the site's own pages get at about the same position (positions grouped 1, 2, 3, 4–5, 6–10, 11–20, 21+, needing 3 pages and 200 views in the group to compare with). Shows both rates.
  5. **Searches that lead to signups:** Google clicks per landing page (Search Console) next to that page's visitors from Google search and their signups (GA4, the chosen signup event), joined on the page path. With no signup event, it asks for one, like the Signups number.
- **The card** ("Google search", dashboard, Growth with Search Console connected): its own dates and the "2–3 days behind" note, four numbers (Clicks, Seen, Click rate, Position) with changes, then the five views as tabs (CSS only, scrolling sideways on phones). Every list has Details (search and CSV), like the other cards. It streams on its own, so it never holds up the page. Starter and trials see a small "Google search insights are part of Growth" card instead; Growth without Search Console sees "Connect Search Console".
- **Words on screen:** Clicks, Seen (impressions), Click rate (CTR), Position (average position), searches (queries). "Page 2" only next to the position it comes from (positions 11–20).
- **Settings → Google Search Console** (site settings, Growth): Connect; the property in use with a menu to change it; "Your name in searches" (the spellings); Disconnect (stops using it for this site; Google access itself stays, for the other sites).

### 28.3 Sprint 7: revenue and sales by source

Three layers, each exact, never multiplied together:

1. **Revenue from Stripe** (Growth). A read-only connection in Settings: the user pastes a **restricted read-only key** (Siamak, Oct 13, 2026). Settings shows short steps (Stripe → Developers → API keys → "Create restricted key", read access to the resources we need, nothing else) and a "Check and save" button that tries one read call. We refuse keys that can write (`sk_` secret keys) and say why. The key is stored encrypted like Google tokens, never shown again (only its last 4 characters), and can be removed in one click. We read balance transactions and subscriptions and keep **daily totals only**: revenue, refunds, new customers and MRR, in the account's currency. Never customer names, emails or card data. The overview gets Revenue and Customers numbers and revenue bars under the visitors line, plus visitors per customer for the period.
2. **Sales and signups by source** (Growth), from GA4: counts per source and per landing page of the user's chosen events. Settings gets "What counts as a sale?": a GA4 key event (like `purchase`), or a "thank you" page path. Where GA4 already has `purchase` events with a value, revenue per source shows too, from GA4's own numbers. If it doesn't, the card says so and how to send it; we never estimate it.
3. **Stripe Checkout warning** (every plan): when `checkout.stripe.com` (or another payment page) shows up in Sources, a notice says GA4 is giving sales to the payment page instead of their real source, and links to the GA4 setting that fixes it ("List unwanted referrals").

**Changed by section 31.1 (Oct 17, 2026):** "Sales and signups by source" became **What brings customers**: first visit next to last visit, paths and time from the first visit, as well as landing pages.

**Stored data:** the Stripe credential (encrypted) and daily revenue totals are new kinds of stored data. Both are aggregate or secret-at-rest, never visitor- or customer-level (principle 3); Siamak approved them with this plan.

**Done when:** Siamak's test Stripe account shows the same daily revenue as Stripe's dashboard, and a test purchase event in GA4 shows under its source.

**How it's built (Sprint 7, session 8):**

- **The key** (Settings → "Revenue from Stripe", per site, Growth): the steps in plain words, a password field, and "Check and save". `rk_live_…` and `rk_test_…` are accepted (a test key says so on screen); `sk_…` is refused ("this key can change your Stripe account"), and so are `pk_…` and anything else. The check makes four reads, one at a time (charges, refunds, customers, subscriptions), and names the one the key can't do, so the user knows what to tick in Stripe. The key is stored encrypted with the same method as Google tokens (Better Auth's `symmetricEncrypt`); only its last 4 characters are shown again. Remove deletes the key and every stored total for the site.
- **What is read** (with the user's key, through the `stripe` package already installed): succeeded charges (amount, currency, time), refunds (amount, currency, time), customers (time created only), and active or past-due subscriptions with their prices. Nothing else is kept: no names, emails, card or customer IDs.
- **Daily totals** (`revenue_day`: site, day in the site's time zone, currency, charged, refunded, new customers, and MRR on the days it was recorded). Pure, tested functions bucket the reads by day. **Revenue** on screen = charged minus refunded that day, before Stripe's fees and in the account's main currency (the one with the most charged); other currencies are named, never converted. **MRR** = the monthly list price of every active and past-due subscription (yearly ÷ 12, weekly × 52 ÷ 12), before discounts; trials aren't counted, and usage-based prices can't be, so the card says how many were left out. MRR history starts on the day Stripe was connected.
- **Syncing:** right after connecting, the last 25 months (enough for 12 months against the 12 before), after the response. Then the hourly `revenue-sync` job re-reads from 2 days before the last sync, so late refunds land on their own day. Locked accounts and Starter are skipped.
- **On the dashboard** (Growth, connected): two more numbers in the overview, **Revenue** and **New customers** (with "1 per 412 visitors" under it, visitors ÷ new customers for the same days), with the period before; and revenue as soft bars under the visitors line (per day, or per month on 12 months; hourly charts show none). The chart's tooltip and "View as table" include it.
- **What counts as a sale** (Settings, per site, Growth): a GA4 key event (the same picker as signups) or a "thank you" page path, or nothing (`site.sale_event`, `site.sale_page`).
- **Sales and signups by source** (a list card, Growth): Sources | Landing pages, with Visitors, Signups and Sales (GA4's event counts, or views of the thank-you page), and **Revenue** only when GA4 itself has `purchaseRevenue` for the period (GA4's own sums, in the property's currency). Without it the card says GA4 has no purchase values and links to how to send them. Never estimated.
- **The payment-page warning** (every plan, dashboard only): when `checkout.stripe.com` or another payment page (PayPal, Paddle, Lemon Squeezy) is a source, the Sources card says GA4 gives those sales to the payment page, and how to add it to "List unwanted referrals" in GA4.

### 28.4 Decided before V2 (Siamak, Oct 13, 2026)

| Question | Answer |
| --- | --- |
| Growth's site limit | 10 sites (no limit on any plan since Oct 15, 2026) |
| Does the 14-day trial include Growth features? | No: the trial is Starter only, so there are never extra sites to handle when it ends |
| Stripe App or a pasted key for the revenue connection | A pasted restricted read-only key |

## 29. V3: later (postponed by Siamak, Oct 13, 2026)

Not planned yet; Siamak picks from this list after V2.

- **X mentions on the chart.** Design notes kept for later: search the domain (`url:example.com`, plus an exact brand phrase the user gives), no retweets, once a day per site, only posts newer than the last one stored; keep only the post ID, author, date and link (and drop posts deleted on X); a hard cap per site (for example 200 posts a month, about $1); next to each mention, the visits from X (`t.co`) that day. Check X's current pricing first.
- **Ask your data in plain English** (an AI over the cached reports; answers must cite the numbers).
- **Milestone images** to share on X.
- **Hacker News and Product Hunt launches** marked on the chart.
- **"Tracking looks broken" alert** (all events at zero).
- **Not decided yet:** an alert email when traffic drops sharply, a "new site linked to you" heads-up when a new source appears, and a signup funnel built from the key-event counts we already fetch (not GA4's v1alpha funnel API).

## 30. Docs, guides, glossary and comparisons (Siamak, Oct 15, 2026)

What and why: `docs/CONTENT-PLAN.md`, including the rules for keeping pages right (section 15 there). This section is how it is built.

**Content source.** MDX files in `content/` with one folder per section: `docs`, `guides`, `glossary` and `compare`. Each folder has a `meta.json` (title, `root: true`, page order with separators) and an `index.mdx` (the hub); `content/meta.json` names the whole tree "SimpleDash". Fumadocs MDX reads them through its Macro API in `src/lib/content/collections.ts` (`defineDocs` kept alone there, because the macro evaluates the whole module that defines it). `src/lib/content/source.ts` builds one Fumadocs `loader` with base URL `/`: the pages, the menu tree (`menuTree()`, with short `menuTitle` labels) and the Markdown copies. The four folders are root folders, so they show as tabs above the menu.

**Frontmatter**, checked with Zod at build time:

| Field | Rule |
| --- | --- |
| `title` | The H1, in the searcher's words |
| `seoTitle` | Optional `<title>` when the H1 is too long (60 characters at most; " · SimpleDash" is added) |
| `menuTitle` | Optional short label for the menu on the left (36 characters at most) |
| `description` | 70 to 160 characters: the meta description and the line under the H1 |
| `updated` | `YYYY-MM-DD`, moved only when the page was really changed |

**Routes.** `src/app/(content)/{docs,guides,glossary,compare}/[[...slug]]/page.tsx`, all prerendered (`generateStaticParams`); the page reads its address inside a Suspense boundary (`ContentRoute`), as Cache Components asks. One layout, `src/app/(content)/layout.tsx`: Fumadocs' `RootProvider` (theme switching off: light only) and `DocsLayout`: the section tabs and the menu on the left, the page in the middle and "On this page" on the right, which follows the scroll. On phones the menu is a drawer and "On this page" folds into a button. Search (Ctrl/⌘ K) asks `/api/search`, built from the same pages.

**Each page has:**

- One H1 (the title), the description under it, then H2 and H3 headings for the questions it answers.
- Metadata: the title, description, canonical address, Open Graph and Twitter cards with a page image from `/content-og/<page>/image.png` (a static route, because Next.js allows no image file under a catch-all route), drawn like the landing page's.
- JSON-LD: `TechArticle` (docs) or `Article` (the rest), plus `BreadcrumbList`.
- "Copy Markdown" and "Open" (in ChatGPT, Claude and others, and as Markdown), "Edit on GitHub" and the last updated date.
- Previous and next links, and breadcrumbs.

**For AI assistants:**

- Every page has a Markdown copy at its address plus `.md` (`/docs/plans.md`), served by `src/app/llms.mdx/[...slug]/route.ts` through rewrites in `next.config.ts`. `contentToMarkdown` (`src/lib/content/markdown.ts`, tested) writes our components out as text: prices and other code facts as their values, screenshots left out, other components as their text.
- `/llms.txt` lists every page with its Markdown address, and `/llms-full.txt` holds every page in one file.
- Every page is in `sitemap.xml`, with its updated date.

**Components in content** (`src/components/content/`, registered in `getMDXComponents`): Fumadocs' `Callout`, `Steps`/`Step`, `Tabs`/`Tab`, `Accordions`/`Accordion`, `Cards`/`Card`, plus ours:

- `Price`, `FreeDays`, `MonthsFree` and `PlanFeatures` read `src/config/plans.ts`, so content never types a price. `Freshness` reads `src/lib/ga4/freshness.ts` (the cache times), `Scope` the Google scopes, `PlainWordsTable` `src/config/plain-words.ts`, and `SupportEmail` and `SourceRepo` the theme file.
- `InSimpleDash`: the one product block per guide, with "Start free" (or "Open dashboard" when signed in) and the live demo.
- `ImageSlot`: a screenshot by name from `public/content/<name>.webp` (or `.png`). Until the file exists, it renders nothing in production and a dashed box with the instructions in development. Every slot is listed with exact instructions in `docs/CONTENT-IMAGES.md`, which a test keeps in step.
  - **Size:** `npm run content:images` also writes `src/lib/content/image-sizes.json`, each file's real pixel size, read from its header (`image-size.ts`, tested), so nothing is read from disk while a page renders. A test fails when a file in `public/content` is missing from that list.
  - **Display:** an image keeps its real width and height (no layout shift) and shows at half its pixel width (shots are taken at twice the screen size), never wider than the text. It has an `alt` text, an optional `caption`, and `eager` for an image at the top of its page (it loads at once; the rest load lazily).
  - **Screens of SimpleDash itself** are retaken from the `/ui-kit` previews on sample data with `npm run content:screenshots` (`scripts/content-screenshots.mjs`): headless Chrome over its debugging protocol saves WebP straight away, each shot cropped to the part the page talks about, with neighbouring cards hidden and the dev address shown as `simpledash.app`. Screens from Google, Stripe and site builders are taken by hand.

**Theme.** Fumadocs' layout CSS is imported in `globals.css` without its colours, and its `fd-*` colours are mapped onto our theme tokens there, so the docs look like the rest of SimpleDash and still follow the token rules.

**Tests** (`src/lib/content/content.test.ts`): every page's frontmatter follows the rules; no SimpleDash price or section sign typed in content; every internal link goes to a page, route or `#heading` that exists; every page is in its folder's `meta.json`; every `ImageSlot` is listed in `docs/CONTENT-IMAGES.md` (made by `npm run content:images`).

**In the app:** the "No Google Analytics site found" notice links to `/guides/add-google-analytics-to-website`, the Signups card's "no key events" state to `/guides/ga4-key-events`, and the sales card's "no purchase values" note to `/guides/track-purchases-ga4`. The landing page's top bar links Guides and Docs, and its footer all four sections.

## 31. Why people pay: customers, changes and one search fix a week (Siamak, Oct 17, 2026)

Siamak's feedback: the dashboard mostly repeated what GA4, Search Console and Stripe already show. These three features turn the same read-only data into answers that are hard to get elsewhere. Every number is a whole count from Google, never a model or an estimate, and nothing says why something happened.

**A GA4 fact these rely on** (Google's help, "Scopes of traffic-source dimensions"): session-scoped sources (`sessionSource`) and first-user sources (`firstUserSource`) use "paid and organic channels last click". A return visit that arrives direct is credited to the last real source, not to Direct. The first source never changes for a person (per browser). We never use GA4's event-scoped, data-driven credit, because it gives fractions like 1.3 sales.

### 31.1 What brings customers (Pro)

The card that was "Sales and signups by source" (`sales-card.tsx`, id `sales`). For **Signups** and **Sales** (a switch when both are set up; Sales first), it answers: who first found the people behind them, which visit it happened on, and how long it took.

**GA4 reports** (`EXTRA_REPORTS`, current period only, filtered to the signup and sale events, or to views of the thank-you page):

| Report | Dimensions | Metric |
| --- | --- | --- |
| `first_goals` / `first_sale_page` | `firstUserSource` (+ `eventName`) | `eventCount` / `screenPageViews` |
| `goal_paths` / `sale_page_paths` | `firstUserSource`, `sessionSource` (+ `eventName`) | `eventCount` / `screenPageViews` |
| `goal_days` / `sale_page_days` | `firstSessionDate`, `date` (+ `eventName`) | `eventCount` / `screenPageViews` |
| `first_purchase` | `firstUserSource` | `purchaseRevenue` |

- **Last visit** reuses `goals_sources`, `sale_page_sources` and `purchase_sources`; landing pages reuse `goals_landing` and `sale_page_landing`.
- **Days** are worked into groups when the report arrives (same day, 1–7 days, 8–30 days, over 30 days, not recorded), so only the group counts are cached. The list allows 10,000 rows; when GA4 cuts it off, the line isn't shown.
- **Three separate loads** (last visit, first visit, paths and days), so a report GA4 turns down never hides the others. Without first-visit data the card shows last visits only; without paths, no Paths tab.
- **Counting** (`src/lib/customers/counts.ts`, tested) is shared by the card and the Monday email.

**On screen:**

- A legend: "First: where people first found you. Last: the visit it happened on."
- Up to two **highlight lines** (`src/lib/customers/highlights.ts`, tested), none when nothing stands out:
  - A named source (not Direct or unknown) behind 3 or more events by people it first brought, with first − last of 2 or more (the biggest gap wins): "7 of your 14 sales came from people who first found you through reddit.com; 2 happened on a visit from reddit.com."
  - A last-visit source with 3 or more events, at least half of them by people who first came from elsewhere: "Google was the last visit for 9 sales; for 6 of them, the person first found you somewhere else." Only when the paths list is complete.
  - The counts are events, so the lines say signups or sales, never people.
- "Time from first visit: same day 6 · 1–7 days 5 · 8–30 days 2 · over 30 days 1."
- **Tabs:**
  - **By source:** First and Last columns, sorted by First. Details adds revenue by first visit and by last visit, when GA4 has purchase values.
  - **Paths:** "reddit.com → Google", by count.
  - **Landing pages:** the metric and visitors; Details adds revenue.
- **Help:** first visit is the first time GA4 saw the browser; someone who changes device or clears cookies starts over.
- **Switches:** the metric switch and the tabs are CSS radios, so they work without JavaScript. The metric isn't kept in the address.
- **Free:** sees the Pro teaser (one card for all Pro insights).

### 31.2 What changed and where (every plan; Signups and Sales on Pro)

A card right under the overview (`what-changed-card.tsx`, id `what-changed`, owner only). It is a list of numbers, not a sentence, so it fits the 12 Oct decision that pages show numbers.

**Data:**

- **Visitors:** the total from `totals`. Sources come from `sources` (both periods), because visitors don't add up across rows.
- **Landing pages per source:** a new report, `change_paths` (`sessionSource` × `landingPage`, `activeUsers`, both periods, 500 rows).
- **Signups and sales:** `change_goals` (the same dimensions × `eventName`, `eventCount`) and `change_sale_page` (thank-you page views). Event counts add up, so sources are sums of the cells. The signups total comes from `actions`, so it matches the overview. The sales total is shown only when the list is complete.
- **Google search detail** (Pro with Search Console): the Search Console "What changed" page whose path matches one of Google's moving landing pages, the same way. Search Console is fetched once per request, shared with the search card (`cache()`).

**Rules** (`src/lib/changes/breakdown.ts`, tested):

- **Headline:** "Visitors up 32%", "about the same" within ±3%, or "none the period before". Then before → now.
- **Moves:** up to 3 sources by size of change, up or down. A change under 3 visitors or 2 events is left out.
- **Pages:** each move lists up to 3 landing pages that moved the same way. A page with nothing before is marked New.
- **Steady but moving:** when the total is steady but sources moved underneath, the moves still show.
- **Not comparable** (`comparisonGap`): the card says so instead.

**On screen:**

- Each move is a native disclosure row (`<details>`), opening onto its pages and, for Google, "On Google search (16 Sep – 15 Oct): clicks to /blog/ga4 316 → 574" and the top 2 searches with position and clicks then and now.
- "See all changes" opens Details for every source (change, before, now, CSV).
- Arrows plus a + or − sign, never colour alone.
- **Free:** sees Visitors only, with one line about Pro.
- **Differs from the plan:** the change pills in the overview don't link to the card, because the card sits right under them.

### 31.3 Brings signups and one page a week (Pro with Search Console)

**Searches per page:** `search_insights` gains `pageQueries`, the 100 pages with the most clicks, each with its 8 most-seen searches, then and now. It's built from the query × page rows already fetched for What changed, so there are no new requests. The insights cache key carries `v=2`, so older payloads are fetched again.

**Slipping** (`slippingQuery`): a page's most-seen search, seen 50 times or more, whose average position got worse by 2 or more.

**Brings signups** (the search card's first tab when a signup event is set): pages with signups from Google search visitors (GA4 `search_signups`) and Google clicks. Under each page are its top 2 searches by clicks, plus a Slipping tag. We never say a search brought a signup, because GA4 doesn't know the search.

**This week** (a panel at the top of the search card; `src/lib/search-console/action.ts`, tested):

- **Window:** picked from the last 28 finished Search Console days and GA4's Google signups for the same days.
- **Caching:** cached under the week's Monday in the site's time zone (`week:YYYY-MM-DD` in `report_cache`). The pick doesn't change with the date menu, and the Monday email shows the same one.
- **Order:** pages that brought signups first (slipping, then close to page 1 with a search at 8–15 seen 100 times or more, then seen but not clicked). Then the same rules for any page, by its Google numbers.
- **One per page:** up to 3 candidates; "Show another" cycles through them in the browser.
- **Skipped:** pages worked on in the last 28 days.
- **What's shown:** the facts (signups, clicks, and the search's position then and now) and fixed steps per kind, with our guide (`/guides/google-clicks-what-changed`, `/guides/keywords-close-to-page-1`, `/guides/low-click-rate-pages`). The steps are the same for every site and never explain the numbers.
- **Mark as done** (`markSearchActionDoneAction`, Pro only):
  - The server picks again and accepts only one of this week's candidates.
  - It adds a chart note dated today, "Worked on /blog/ga4".
  - The note stores the page and the search in `chart_note.search_page` and `search_query` (migration `0008`).
  - The panel then shows "Done on 17 Oct…" until Monday.
- **Follow-up:** for the last page worked on before this week (with 7 or more days of data since, notes up to 56 days old), "Since you worked on /x on 3 Oct, “q”: position 11.2 → 7.4, clicks 12 → 30 (14 days each side)". This comes from `search_followup`: the page and search, the same number of days before and since, at most 28. It is cached per note and the newest day.
- **Nothing qualifies:** "Nothing stands out this week…".
- **No signup event:** a nudge to choose one.
- **Free:** keeps the teaser.

### 31.4 Plans and copy

- Pro's features list "What brings customers: first and last visit" and "Google search insights, and one page to work on each week".
- The Pro teaser leads with "See what really brings your customers".
- `llms.txt` lists all three.

