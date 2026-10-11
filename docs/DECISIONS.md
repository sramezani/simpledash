# Decisions

Each technical decision gets one line with its reason.

- Add new decisions at the bottom.
- When a decision is replaced, strike it through (`~~…~~`) and add the new one below it.
- Every new dependency needs a line here (Working rule 9).
- **By** says who made the call:
  - **Siamak**: he chose it.
  - **Claude**: a default from the planning session that Siamak approved as part of the plan. Any of these can still be changed.

| Date | Decision | Why | By |
| --- | --- | --- | --- |
| 2026-10-11 | Date ranges are full days ending yesterday. 12 months = the last 12 full months. Today shows only in the live globe | One consistent set of numbers that matches GA4's own presets. Today's data runs 2–6 h behind on standard GA4 | Siamak |
| 2026-10-11 | Better Auth instead of Auth.js for Google sign-in | Auth.js v5 is still beta (5.0.0-beta.32). Better Auth is stable, with Drizzle support and built-in token encryption and refresh | Siamak |
| 2026-10-11 | Stripe Managed Payments for VAT and sales tax | Stripe is the merchant of record, so there are no VAT registrations or filings. It costs an extra 3.5% per payment | Siamak |
| 2026-10-11 | When a trial ends unpaid: the dashboard locks, the weekly email and public page pause, and all data is kept | Simplest rule, and no GA4 calls for unpaid users | Siamak |
| 2026-10-11 | Next.js 16.4 (App Router, standalone output, Cache Components) | Current stable release. The standalone build runs in any Docker host. `"use cache"` covers public pages | Claude |
| 2026-10-11 | React 19.3, Tailwind CSS 4.3, shadcn/ui (Radix) | The roadmap's UI choice, at current versions | Claude |
| 2026-10-11 | Recharts through shadcn/ui charts, in the dashboard only | The roadmap's one chart library | Claude |
| 2026-10-11 | Server-rendered SVG charts on landing and public pages | No chart JavaScript on the pages that target Lighthouse 100 | Claude |
| 2026-10-11 | cobe 2 for the live globe, loaded only when visible | About 5 KB of WebGL. Suggested in the roadmap | Claude |
| 2026-10-11 | TypeScript pinned to 6.0.3 | typescript-eslint supports TypeScript below 6.1. Move to 7 when it does | Claude |
| 2026-10-11 | npm as the package manager | Already installed, so nothing extra to set up | Claude |
| 2026-10-11 | ESLint (`eslint-config-next` core-web-vitals and typescript) with Prettier and its Tailwind plugin | Next.js rules that protect Core Web Vitals, plus standard formatting | Claude |
| 2026-10-11 | Vitest for unit tests | Fast, and runs TypeScript and ESM directly | Claude |
| 2026-10-11 | Node 24 LTS (Docker image and `.nvmrc`) | The current LTS. Node 22 is in maintenance | Claude |
| 2026-10-11 | Zod | One library to check env vars and inputs | Claude |
| 2026-10-11 | Geist font through `next/font` | Self-hosted with no layout shift. It's the create-next-app default | Claude |
| 2026-10-11 | Drizzle ORM, drizzle-kit and the postgres.js driver | The roadmap's ORM. Plain SQL migrations, and moving to Azure means only a new connection string | Claude |
| 2026-10-11 | Supabase through the shared pooler in session mode | Works over IPv4 (Docker has no IPv6 by default) and supports prepared statements | Claude |
| 2026-10-11 | Local Postgres 17 in Docker Compose for development | Free and works offline. Supabase stays production only | Claude |
| 2026-10-11 | Migrations run when the container starts | No manual step on each deploy | Claude |
| 2026-10-11 | Report cache in Postgres: one row per property, report, range and params | Shared across viewers and survives restarts, which protects GA4 quotas | Claude |
| 2026-10-11 | Realtime results cached in memory for 60 s | One server process, so no database churn | Claude |
| 2026-10-11 | Official `@google-analytics/data` and `@google-analytics/admin` (v1beta), with `google-auth-library` | Supported and typed, as the roadmap says | Claude |
| 2026-10-11 | Always ask for Google consent at sign-in (`prompt: "select_account consent"`) | Google only sends a refresh token on a consent screen | Claude |
| 2026-10-11 | Automatic property choice checks at most 20 properties, 5 at a time | Keeps sign-in fast for accounts with many sites | Claude |
| 2026-10-11 | Signups counted with `eventCount` of the chosen key event, not `keyEvents` | `keyEvents` only counts from when the event was marked key. This avoids fake zeros and keeps full history | Claude |
| 2026-10-11 | AI traffic = GA4's "AI Assistant" channel OR our list of AI domains | The channel is new and doesn't name Claude or Perplexity. The list also covers older data | Claude |
| 2026-10-11 | Live pages show page titles | The Realtime API has no page path | Claude |
| 2026-10-11 | Live globe coordinates from Natural Earth places, with country centroids as fallback, looked up on the server | Small, public domain (no attribution needed), and nothing extra sent to the browser | Claude |
| 2026-10-11 | Chart detail: 7 days hourly, 30 days daily, 12 months monthly | Follows the roadmap. Check the hourly view on small sites in Sprint 2 | Claude |
| 2026-10-11 | Default range is 7 days, kept in the URL (`?range=`) | Links can be shared, and nothing is stored | Claude |
| 2026-10-11 | Light theme only in V1 | Simpler. Dark mode is noted as an idea in `docs/STORY.md` | Claude |
| 2026-10-11 | Country flags as self-hosted SVGs (flag-icons, MIT) | Emoji flags don't show on Windows | Claude |
| 2026-10-11 | Site icons through our own cached `/api/icon` proxy (DuckDuckGo icons) | First-party and cached at Cloudflare, with a fixed upstream so there is no SSRF | Claude |
| 2026-10-11 | CSV built from the cache, with formula-looking cells escaped | No extra GA4 calls, and it blocks spreadsheet formula injection | Claude |
| 2026-10-11 | Resend and React Email for email (not Postmark) | Native React Email support. Free for 3,000 a month; move to Pro ($20) at about 90 weekly-email users because of the 100-a-day cap | Claude |
| 2026-10-11 | Weekly email on Monday at 13:00 in the site's time zone | After GA4's usual 12-hour processing of Sunday | Claude |
| 2026-10-11 | Email open rates read in Resend's dashboard, with no webhook | Less code in V1 | Claude |
| 2026-10-11 | The trial lives in our database. Stripe is only involved when someone upgrades | No Stripe objects for trial users | Claude |
| 2026-10-11 | Upgrading early keeps the remaining trial days (`trial_end`) | Fair to early payers. Check it works with Managed Payments in Sprint 4 | Claude |
| 2026-10-11 | Stripe Node SDK (`stripe`) | Official SDK for Checkout, Portal and webhooks | Claude |
| 2026-10-11 | Coolify on Hetzner, not plain Docker Compose | A UI for deploys, env vars, logs and scheduled tasks | Claude |
| 2026-10-11 | Jobs are Coolify scheduled tasks calling `/api/internal/jobs/*` | No extra service, as the roadmap says | Claude |
| 2026-10-11 | Sentry (`@sentry/nextjs`) on the server only, plus its free uptime and cron monitors | GA4 errors happen on the server, and public pages get no client SDK. The free plan covers the uptime check (UptimeRobot's and Better Stack's free tiers are for hobby use) | Claude |
| 2026-10-11 | Backups: a small container runs `pg_dump` and rclone to R2, kept for 30 days | Off-server and cheap, as the roadmap says | Claude |
| 2026-10-11 | No cookie banner | Only necessary cookies, and no analytics on simpledash.app in V1 | Claude |
| 2026-10-11 | Basic security headers, without a full CSP in V1 | Script nonces would turn the static pages dynamic | Claude |
