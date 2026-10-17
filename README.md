# SimpleDash

**Google Analytics, in a dash.**

SimpleDash ([simpledash.app](https://simpledash.app)) takes the Google Analytics 4 data a site already has and turns it into:

- one simple dashboard page, in plain words instead of GA jargon
- a Monday email with last week's numbers
- an optional public stats page

There is **no tracking script**. Everything comes from your own GA4 property through Google's read-only APIs, including the history GA4 already has. It's built for indie hackers and small SaaS or content sites that run GA4 and find it confusing.

- **Free:** all your Google Analytics sites, the last 30 days, a public stats page per site. No card, no time limit.
- **Pro:** $9 a month or $90 a year (tax included). Everything in Free, plus 12 months and any dates, the Monday email, Google search insights from Search Console, revenue from Stripe and sales by source.

Use it at **[simpledash.app](https://simpledash.app)**. The code is open source under the [AGPL-3.0](LICENSE).

## What SimpleDash stores

As little as possible, and never data about individual visitors: no IP addresses, no visitor IDs, no single visits. Every table is in [`src/lib/db/schema.ts`](src/lib/db/schema.ts).

| Table | What's in it | Kept for |
| --- | --- | --- |
| `user`, `session`, `verification` | Name, email and picture from Google; sign-in sessions (no IP addresses) | Until the account is deleted; sessions until they expire |
| `account` | Google access and refresh tokens, **encrypted** | Until Google is disconnected or the account is deleted |
| `site` | The GA4 properties you added: name, domain, time zone, your chosen signup and sale events, the Search Console property | Until removed or the account is deleted |
| `report_cache` | Copies of report **totals** from Google (visitors per day, top pages, sources, countries, and top searches when Search Console is on), so pages open fast and stay within Google's limits | 7 days without use; never in backups |
| `chart_note`, `user_settings`, `public_page` | Your notes on the chart, the email switch, public page choices | Until deleted |
| `billing`, `stripe_event` | Plan, Stripe customer and subscription IDs, renewal date. Card details stay with Stripe | Until the account is deleted |
| `email_send` | Which week's Monday email went out, so it's never sent twice | Until the account is deleted |
| `revenue_source`, `revenue_day` | Pro, only if you connect Stripe: your read-only key, **encrypted**, and daily totals (charged, refunded, new customers, MRR). No customer names, emails or IDs | Until Stripe is removed in Settings |

Nightly database backups (`docs/backup.md`) leave out the report caches and sign-in sessions, and are deleted after 30 days. The full policy is at [simpledash.app/privacy](https://simpledash.app/privacy).

## Self-hosting

SimpleDash is built to run simpledash.app. Self-hosting works but isn't officially supported yet: you need your own Google Cloud OAuth app, Stripe keys (test keys are fine), Resend and a server. `docs/deploy.md` describes how simpledash.app itself runs, with one command per server (`deploy/setup.sh`).

## Contributing

Issues and pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). Security problems go to the address in [SECURITY.md](SECURITY.md), not to public issues.

## Status

V1 (Sprints 0–4) and V2 (Sprints 5–7) are built: Google sign-in with read-only Analytics, the GA4 data layer with its cache, the full dashboard, the landing page with a live demo and pricing, the Monday email, public pages, Stripe billing, several sites, Google search insights from Search Console, and revenue from a read-only Stripe key. Since 14 Oct 2026 the plans are Free and Pro (no trial). Progress is in [docs/CHECKLIST.md](docs/CHECKLIST.md) and the session log in [docs/STORY.md](docs/STORY.md).

## Requirements

- **Node 24** (`nvm install 24`; `.nvmrc` pins it). Node 22.13 or newer also works for development.
- **npm** (comes with Node).
- **Postgres 17.** Docker (Docker Desktop or OrbStack) for the local database in `compose.yaml`, or any Postgres 17 URL.

## Setup

```bash
npm install
cp .env.example .env        # then fill in the values (see below)
docker compose up -d db     # local Postgres (skip if DATABASE_URL points elsewhere)
npm run db:migrate          # create the tables
npm run dev                 # http://localhost:3000
```

Pages:

| Page | What it is |
| --- | --- |
| `/` | Landing page: the live demo in a browser frame, how it works, pricing (`/#pricing`), FAQ. Shows "Dashboard" instead of "Sign in" when you're signed in |
| `/demo` | The live demo: a real public stats page, set in `src/config/demo.ts` (sample data if that page is off) |
| `/signin` | "Continue with Google" (needs `GOOGLE_CLIENT_ID` and the redirect URI on the Google client) |
| `/dashboard` | The dashboard (signed in). `?site=<id>` names the site (default: the one opened last). `?range=today`, `yesterday`, `7d` (default), `30d`, `12m`, or a custom range like `?range=2026-09-01..2026-09-30`. On Free, anything older than 30 days shows Last 30 days |
| `/settings` | Settings → Profile: your account, disconnect Google, delete account (signed in). A menu on the left links every settings page |
| `/settings/billing` | Settings → Plan & billing: upgrade to Pro or manage billing (signed in) |
| `/settings/email` | Settings → Monday email: on or off (signed in) |
| `/settings/sites/<id>` | Settings for one of your sites: public page, Google search, revenue, sales, remove (signed in). The gear next to a site in the dashboard's site menu opens it |
| `/docs`, `/guides`, `/glossary`, `/compare` | Docs, Google Analytics guides, GA4 terms in plain words and comparisons, from the MDX files in `content/` (Fumadocs). Add `.md` to any page's address for its Markdown copy |
| `/llms-full.txt` | Every docs page and guide in one Markdown file, for AI assistants (`/llms.txt` lists them) |
| `/admin` | Usage counts (only for `ADMIN_EMAILS`; a 404 for everyone else) |
| `/p/<slug>` | A public stats page |
| `/email/unsubscribe?token=…` | One-click unsubscribe from the weekly email |
| `/account-deleted` | Where "Delete account" ends |
| `/privacy`, `/terms` | Legal pages (details in `src/config/legal.ts`) |
| `/ui-kit` | Every theme token and shared component (development only) |
| `/ui-kit/dashboard?state=…` | The dashboard on sample data, in every state (development only) |
| `/ui-kit/settings?state=…&page=…`, `/ui-kit/public?state=…` | Settings (`page=account`, `billing`, `email` or `site`) and a public page on sample data (development only) |
| `/ui-kit/email` | The weekly email on sample data (`?text=1` for the plain-text version, `?sites=3` for several sites; development only) |
| `/api/health` | `{"status":"ok"}` when the database answers |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | SEO files |
| `/api/csv/<card>?site=&range=` | "Download CSV" for a card (signed in, own sites only) |
| `/api/live?site=` | Live data for the globe (signed in, own sites only) |
| `/api/p/<slug>/live` | Live data for a public page with "Right now" turned on |
| `/api/stripe/webhook` | Stripe events (signature checked) |
| `/api/search-console/connected?site=` | Where Google returns after granting Search Console access; picks the property (signed in) |
| `/api/email/unsubscribe` | One-click unsubscribe for mail apps (`List-Unsubscribe-Post`) |
| `/api/icon/<domain>` | Cached site icons for Sources |

## Docs and guides

The pages at `/docs`, `/guides`, `/glossary` and `/compare` are MDX files in `content/`, one folder per section, rendered with [Fumadocs](https://fumadocs.dev) (`docs/SPEC.md` section 30).

- **Add a page:** create `content/<section>/<slug>.mdx` with `title`, `description` (70 to 160 characters), `updated` and, for long titles, `seoTitle` and `menuTitle`, then add the slug to that folder's `meta.json`.
- **Prices and plan facts** come from components (`<Price plan="pro" interval="month" />`, `<FreeDays />`, `<PlanFeatures plan="free" />`), never typed.
- **Screenshots:** `<ImageSlot id="…" alt="…">what to capture</ImageSlot>`, then `npm run content:images`. A slot shows nothing in production until `public/content/<id>.webp` exists.
- `npm test` checks every page's frontmatter, links and anchors, menus and screenshot list.

## Scheduled jobs

Jobs are `POST /api/internal/jobs/<job>` with `Authorization: Bearer $CRON_SECRET`. In production, cron on the server runs them inside the app container through `simpledash job <job>` (`deploy/crontab`, `docs/deploy.md` step 8):

```bash
node scripts/run-job.mjs warm-cache     # hourly at :05
node scripts/run-job.mjs weekly-email   # hourly at :00 (Pro; sends on Mondays, 13:00–17:59 local time)
node scripts/run-job.mjs cleanup        # daily at 03:30 UTC
node scripts/run-job.mjs revenue-sync   # hourly at :20 (Pro sites with Stripe connected)
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
| `npm run content:images` | Rewrites `docs/CONTENT-IMAGES.md`: every screenshot slot in `content/`, and which are still missing |
| `node scripts/copy-flags.mjs` | Rebuilds `public/flags` (SVG) from country-flag-icons, after upgrading it |
| `node scripts/copy-tech-icons.mjs` | Rebuilds `public/icons/tech` (browser, OS and device icons) from the two Iconify sets, after changing the list or upgrading them |
| `node scripts/build-places.mjs` | Rebuilds the globe's place table from GeoNames (all-the-cities) |
| `scripts/backup/backup.sh --local <dir>` | Writes a database backup to a folder (needs `BACKUP_DATABASE_URL`, `pg_dump` 17) |
| `docker compose up -d db` | Local Postgres 17 |
| `docker compose --profile app up --build` | The production image on http://localhost:3000 |

## Environment variables

All of them are listed with comments in [.env.example](.env.example). `src/lib/env.ts` is the only code that reads them, and it checks them with Zod when the server starts.

| Name | Used for | Needed from |
| --- | --- | --- |
| `APP_URL` | Absolute links, canonical URLs, the Better Auth base URL. Also read at build time | Sprint 0 |
| `DATABASE_URL` | Postgres: local Docker, or the Supabase **session** pooler (port 5432) for development. On the server, `deploy/compose.yaml` sets it | Sprint 0 |
| `POSTGRES_PASSWORD` | Server only: the Postgres container's password (set once by `deploy/setup.sh`) | Oct 14 |
| `BETTER_AUTH_SECRET` | Signs sessions and encrypts the stored Google tokens | Sprint 1 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in and read-only Analytics access | Sprint 1 |
| `CRON_SECRET` | Protects `/api/internal/jobs/*` | Sprint 1 |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sending the weekly email | Sprint 4 |
| `EMAIL_TOKEN_SECRET` | Signs unsubscribe links | Sprint 4 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API and webhook signatures | Sprint 4 |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | Pro's two prices ($9 a month, $90 a year, tax included) | Sprint 4 |
| `STRIPE_MANAGED_PAYMENTS` | `true` (default): Stripe is the merchant of record in Checkout | Sprint 4 |
| `STRIPE_PUBLISHABLE_KEY` | Not used by the server; kept for reference | — |
| `SENTRY_DSN` | Server error reports (optional) | Sprint 4 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | SimpleDash's own Google Analytics (`G-…`), loaded only after consent. Public, written in at build time; on the server `deploy/setup.sh` passes it to GitHub. Empty: no banner, no analytics | Oct 14 |
| `ADMIN_EMAILS` | Who can open `/admin` | Sprint 4 |
| `BACKUP_DATABASE_URL`, `R2_*` | The backup helper on the server, not the app ([docs/backup.md](docs/backup.md)). Compose sets `BACKUP_DATABASE_URL` | Sprint 4 |
| `SHOW_UI_KIT` | `1` turns the dev previews on in a **local** production build (for Lighthouse). Never set it on the server | — |

## Theme and brand

The look of the whole site and the brand facts live in one file, `src/config/theme.ts`: colours, corner radius, shadows, name, tagline and contact email.

- Editing it re-themes the site, the weekly email, the social images and the favicons.
- The code only uses its tokens. `npm run check` blocks raw colours and checks contrast.
- How it works: [docs/ui.md](docs/ui.md).

## Deploy

One server behind Cloudflare runs `deploy/compose.yaml`: the app image (`Dockerfile`, Next.js standalone on Node 24), Postgres 17, Caddy for HTTPS and a backup helper. The app applies database migrations when it starts. Step by step: [docs/deploy.md](docs/deploy.md).

```bash
deploy/setup.sh azureuser@<server-ip>                        # a fresh server, one command
deploy/setup.sh azureuser@<new-ip> --from azureuser@<old-ip>  # move to a new server with the data
```

- **Secrets** live in `deploy/secrets/` (git-ignored; the first run creates `app.env` from `.env.example`). Keep a copy in a password manager.
- **Every merge to `main`** deploys on its own: `.github/workflows/deploy.yml` runs `npm run check`, builds the image and sends it to the server, which goes back to the previous version if `/api/health` fails. Pull requests run the check only.
- **On the server:** `sudo simpledash status`, `logs`, `job <name>`, `backup`, `restore --force`.

## Docs

| File | What's in it |
| --- | --- |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Product brief: what to build and why |
| [docs/SPEC.md](docs/SPEC.md) | Technical spec: how V1 is built, and the V2 plan (section 28) |
| [docs/CHECKLIST.md](docs/CHECKLIST.md) | Sprint tasks, ticked with the date as they finish |
| [docs/STORY.md](docs/STORY.md) | Session log: what was done and learned, and what's next |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Technical decisions, one line each with the reason |
| [docs/ui.md](docs/ui.md) | Theme file, tokens, guards and component layers |
| [docs/deploy.md](docs/deploy.md) | The server, one-command setup, deploys from GitHub, Cloudflare, moving servers |
| [docs/ga4.md](docs/ga4.md) | The GA4 data layer: reports, cache, errors, property choice, jobs |
| [docs/auth.md](docs/auth.md) | Sign-in, sessions, Google tokens and access checks |
| [docs/google-verification.md](docs/google-verification.md) | Google's OAuth app verification: what to set up, the scope justification, the demo video script |
| [docs/billing.md](docs/billing.md) | Free and Pro, plan states, Checkout, the Portal, the webhook and Stripe setup |
| [docs/search-console.md](docs/search-console.md) | Google search insights: connecting Search Console, the window, the five views, errors |
| [docs/revenue.md](docs/revenue.md) | Revenue from Stripe (the pasted key, daily totals, MRR, the sync) and sales by source |
| [docs/email.md](docs/email.md) | The Monday email: when it's sent, content, unsubscribe, Resend setup |
| [docs/public-page.md](docs/public-page.md) | Public stats pages: settings, caching, what's shown and what never is |
| [docs/backup.md](docs/backup.md) | Nightly backups to R2 and how to restore one |
| [docs/launch.md](docs/launch.md) | Launch kit: Product Hunt, Indie Hackers, X thread, screenshots |
| [docs/CONTENT-PLAN.md](docs/CONTENT-PLAN.md) | Content plan: who the docs and guides are for, the clusters, and the rules for keeping them right |
| [docs/CONTENT-IMAGES.md](docs/CONTENT-IMAGES.md) | Every screenshot slot in the docs and guides, with what to capture (made by `npm run content:images`) |
| [CLAUDE.md](CLAUDE.md) | Brief and working rules for Claude Code |

## License

SimpleDash is free software under the [GNU Affero General Public License v3.0](LICENSE). Credits for the data, icons and fonts it uses, and the note about the SimpleDash name and logo, are in [NOTICE](NOTICE).
