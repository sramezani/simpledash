# SimpleDash

**Google Analytics, in a dash.**

SimpleDash ([simpledash.app](https://simpledash.app)) takes the Google Analytics 4 data a site already has and turns it into:

- one simple dashboard page
- a weekly Monday email
- an optional public stats page

There is no new tracking script. Visitor data comes from the user's own GA4 property through Google's read-only APIs.

**Price:** the Starter plan costs €9 a month or €90 a year (VAT included), with a 14-day free trial and no card. A Growth plan (€19 a month) is coming soon.

## Status

All of V1 (Sprints 0–4) is built: the project setup, Google sign-in with read-only Analytics, the automatic site choice, the GA4 data layer with its cache, the full dashboard (summary line, the 4 numbers, the visitors chart with notes, Sources, Pages, Countries, Devices, AI traffic, Actions, the live globe, CSV on every card, every state), the landing page with a live demo and pricing, the legal pages and SEO files, the Monday email, public stats pages, Stripe billing with the 14-day trial, settings (disconnect Google, delete account), usage counts, Sentry and nightly backups. What's left before launch is mostly accounts and settings on Siamak's side (see Sprint 4 in the checklist). Progress is tracked in [docs/CHECKLIST.md](docs/CHECKLIST.md), and the session log is in [docs/STORY.md](docs/STORY.md).

## Requirements

- **Node 24** (`nvm install 24`; `.nvmrc` pins it). Node 22.13 or newer also works for development.
- **npm** (comes with Node).
- **Postgres 17.** Either Docker (Docker Desktop or OrbStack) for the local database in `compose.yaml`, or the Supabase session pooler URL.

## Setup

```bash
npm install
cp .env.example .env        # then fill in the values (see below)
docker compose up -d db     # local Postgres (skip if DATABASE_URL points at Supabase)
npm run db:migrate          # create the tables
npm run dev                 # http://localhost:3000
```

Pages:

| Page | What it is |
| --- | --- |
| `/` | Landing page: the live demo in a browser frame, how it works, pricing (`/#pricing`), FAQ. Shows "Dashboard" instead of "Sign in" when you're signed in |
| `/demo` | The live demo: a real public stats page, set in `src/config/demo.ts` (sample data if that page is off) |
| `/signin` | "Continue with Google" (needs `GOOGLE_CLIENT_ID` and the redirect URI on the Google client) |
| `/dashboard` | The dashboard (signed in). `?range=today`, `yesterday`, `7d` (default), `30d`, `12m`, or a custom range like `?range=2026-09-01..2026-09-30` |
| `/settings` | Account, weekly email, public page, billing, disconnect Google, delete account (signed in) |
| `/admin` | Usage counts (only for `ADMIN_EMAILS`; a 404 for everyone else) |
| `/p/<slug>` | A public stats page |
| `/email/unsubscribe?token=…` | One-click unsubscribe from the weekly email |
| `/account-deleted` | Where "Delete account" ends |
| `/privacy`, `/terms` | Legal pages (details in `src/config/legal.ts`) |
| `/ui-kit` | Every theme token and shared component (development only) |
| `/ui-kit/dashboard?state=…` | The dashboard on sample data, in every state (development only) |
| `/ui-kit/settings?state=…`, `/ui-kit/public?state=…` | Settings and a public page on sample data (development only) |
| `/ui-kit/email` | The weekly email on sample data (`?text=1` for the plain-text version; development only) |
| `/api/health` | `{"status":"ok"}` when the database answers |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | SEO files |
| `/api/csv/<card>?range=` | "Download CSV" for a card (signed in) |
| `/api/live` | Live data for the globe (signed in) |
| `/api/p/<slug>/live` | Live data for a public page with "Right now" turned on |
| `/api/stripe/webhook` | Stripe events (signature checked) |
| `/api/email/unsubscribe` | One-click unsubscribe for mail apps (`List-Unsubscribe-Post`) |
| `/api/icon/<domain>` | Cached site icons for Sources |

## Scheduled jobs

Jobs are `POST /api/internal/jobs/<job>` with `Authorization: Bearer $CRON_SECRET`. In production, Coolify runs them inside the container (`docs/deploy.md`):

```bash
node scripts/run-job.mjs warm-cache     # hourly at :05
node scripts/run-job.mjs weekly-email   # hourly at :00 (sends on Mondays, 13:00–17:59 local time)
node scripts/run-job.mjs cleanup        # daily at 03:30 UTC
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build (standalone output in `.next/standalone`) |
| `npm run start` | Runs the production build (in Docker, `node server.js` is used instead) |
| `npm run check` | Typecheck, lint and tests: run before ticking a task |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run lint` | ESLint, including the theme guards and the layer import rules |
| `npm run format` | Prettier, with the Tailwind class sorter |
| `npm test` | Vitest unit tests |
| `npm run db:generate` | Writes a SQL migration into `drizzle/` from changes in `src/lib/db/schema.ts` |
| `npm run db:migrate` | Applies the migrations to `DATABASE_URL` |
| `node scripts/copy-flags.mjs` | Rebuilds `public/flags` (SVG) from country-flag-icons, after upgrading it |
| `node scripts/build-places.mjs` | Rebuilds the globe's place table from GeoNames (all-the-cities) |
| `scripts/backup/backup.sh --local <dir>` | Writes a database backup to a folder (needs `BACKUP_DATABASE_URL`, `pg_dump` 17) |
| `docker compose up -d db` | Local Postgres 17 |
| `docker compose --profile app up --build` | The production image on http://localhost:3000 |

## Environment variables

All of them are listed with comments in [.env.example](.env.example). `src/lib/env.ts` is the only code that reads them, and it checks them with Zod when the server starts.

| Name | Used for | Needed from |
| --- | --- | --- |
| `APP_URL` | Absolute links, canonical URLs, the Better Auth base URL. Also read at build time | Sprint 0 |
| `DATABASE_URL` | Postgres: local Docker, or the Supabase **session** pooler (port 5432) | Sprint 0 |
| `BETTER_AUTH_SECRET` | Signs sessions and encrypts the stored Google tokens | Sprint 1 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in and read-only Analytics access | Sprint 1 |
| `CRON_SECRET` | Protects `/api/internal/jobs/*` | Sprint 1 |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sending the weekly email | Sprint 4 |
| `EMAIL_TOKEN_SECRET` | Signs unsubscribe links | Sprint 4 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API and webhook signatures | Sprint 4 |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | The two Starter prices (€9 a month, €90 a year) | Sprint 4 |
| `STRIPE_MANAGED_PAYMENTS` | `true` (default): Stripe is the merchant of record in Checkout | Sprint 4 |
| `STRIPE_PUBLISHABLE_KEY` | Not used by the server; kept for reference | — |
| `SENTRY_DSN` | Server error reports (optional) | Sprint 4 |
| `ADMIN_EMAILS` | Who can open `/admin` | Sprint 4 |
| `BACKUP_DATABASE_URL`, `R2_*` | The backup service only, not the app ([docs/backup.md](docs/backup.md)) | Sprint 4 |
| `SHOW_UI_KIT` | `1` turns the dev previews on in a **local** production build (for Lighthouse). Never set it on the server | — |

## Theme and brand

The look of the whole site and the brand facts live in one file, `src/config/theme.ts`: colours, corner radius, shadows, name, tagline and contact email.

- Editing it re-themes the site, the weekly email, the social images and the favicons.
- The code only uses its tokens. `npm run check` blocks raw colours and checks contrast.
- How it works: [docs/ui.md](docs/ui.md).

## Deploy

One Docker image (`Dockerfile`, Next.js standalone on Node 24), deployed by Coolify on a Hetzner server behind Cloudflare. The container applies database migrations when it starts. Step by step: [docs/deploy.md](docs/deploy.md).

## Docs

| File | What's in it |
| --- | --- |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Product brief: what to build and why |
| [docs/SPEC.md](docs/SPEC.md) | Technical spec for V1: how it's built |
| [docs/CHECKLIST.md](docs/CHECKLIST.md) | Sprint tasks, ticked with the date as they finish |
| [docs/STORY.md](docs/STORY.md) | Session log: what was done and learned, and what's next |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Technical decisions, one line each with the reason |
| [docs/ui.md](docs/ui.md) | Theme file, tokens, guards and component layers |
| [docs/deploy.md](docs/deploy.md) | Server, Coolify, Cloudflare and Supabase setup |
| [docs/ga4.md](docs/ga4.md) | The GA4 data layer: reports, cache, errors, property choice, jobs |
| [docs/auth.md](docs/auth.md) | Sign-in, sessions, Google tokens and access checks |
| [docs/google-verification.md](docs/google-verification.md) | Google's OAuth app verification: what to set up, the scope justification, the demo video script |
| [docs/billing.md](docs/billing.md) | Trial, plan states, Checkout, the Portal, the webhook and Stripe setup |
| [docs/email.md](docs/email.md) | The Monday email: when it's sent, content, unsubscribe, Resend setup |
| [docs/public-page.md](docs/public-page.md) | Public stats pages: settings, caching, what's shown and what never is |
| [docs/backup.md](docs/backup.md) | Nightly backups to R2 and how to restore one |
| [docs/launch.md](docs/launch.md) | Launch kit: Product Hunt, Indie Hackers, X thread, screenshots |
| [CLAUDE.md](CLAUDE.md) | Brief and working rules for Claude Code |
