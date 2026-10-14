# SimpleDash: brief for Claude Code

SimpleDash (simpledash.app) turns the Google Analytics 4 data a founder already has into one simple dashboard page, a Monday email and an optional public stats page. It has no tracking script of its own. It is built for indie hackers and small SaaS or content sites that already run GA4. There are two plans: **Free** (one site, the last 30 days, a public page; no card, no time limit) and **Pro** at $9 a month or $90 a year (up to 10 sites, 12 months and any dates, the Monday email, Google search insights, revenue from Stripe). There is no trial. The code is open source under the AGPL-3.0.

- **What and why:** `docs/ROADMAP.md`. This is Siamak's brief; don't edit it.
- **How:** `docs/SPEC.md`. Update the spec before building something differently, and log the change in `docs/DECISIONS.md`.

## Every session

1. **Start:** read this file, `docs/CHECKLIST.md` and the latest entry in `docs/STORY.md` (newest is at the top).
2. **Find code with CodeGraph first** (`codegraph_*` tools) before reading or searching files.
   - Refresh the index after large changes with `codegraph sync`.
   - If the tools say no project is loaded, pass `projectPath` set to this repo's absolute path.
   - CodeGraph is initialised in Sprint 0, right after the Next.js scaffold (`codegraph init -i`).
3. **Plan before coding** each sprint. Ask Siamak when something is unclear.
4. **End:** add a dated entry to `docs/STORY.md`.

## Principles

These are not up for debate. Anything that would break one goes to Siamak first.

1. **No tracking script.** All visitor data comes from the user's GA4 property through Google's APIs.
2. **Read-only Google access.** Request only read-only scopes, and only when needed. V1 needs only `analytics.readonly`.
3. **Store as little as possible.** Keep only:
   - users and settings
   - encrypted Google tokens
   - chart notes and public-page settings
   - short-lived report caches

   Never store raw visitor-level data.
4. **Simple beats complete.** One page, plain words, no GA jargon.
5. **Never invent explanations.** Summaries state what changed, from the numbers. No guessed reasons.
6. **Show missing data honestly.** Never show a fake zero.
7. **Fast.** Public pages (landing, public stats, legal) target 100 in all four Lighthouse categories, and never go below 95. The dashboard targets the same for Accessibility and Best Practices: serve from cache and refresh in the background.
8. **Cheap to run.** Well under $1 (€1) per customer per month.

## Stack (details and versions in `docs/SPEC.md` section 3)

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, standalone Docker image, Cache Components), React 19, TypeScript 6.0 (pinned) |
| UI | Tailwind CSS 4, shadcn/ui and lucide icons |
| Theme and brand | One file, `src/config/theme.ts`, written into each page as CSS variables. Light theme only in V1 |
| Charts | shadcn/ui charts (Recharts) in the dashboard only. Server-rendered SVG on landing and public pages |
| Live globe | cobe, loaded lazily |
| Database | Postgres 17 in a container on the server, through Drizzle ORM and postgres.js. Local Postgres in Docker (or Supabase, for now) for development |
| Auth | Better Auth with Google sign-in and read-only Analytics consent. Tokens are encrypted |
| Google APIs | `@google-analytics/data` and `@google-analytics/admin` (v1beta) |
| Email | Resend with React Email |
| Payments | Stripe Checkout, Customer Portal and webhooks, with Managed Payments (Stripe is the merchant of record) |
| Errors and uptime | Sentry, on the server only |
| Hosting | One server (Azure today) with Docker Compose and Caddy, behind Cloudflare (Full strict SSL). `deploy/setup.sh` sets up a server in one command; GitHub Actions deploys every merge to `main`. Backups go to Cloudflare R2 |
| Tests | Vitest unit tests. No end-to-end tests |
| Package manager | npm |

## Commands

These arrive in Sprint 0 and don't exist yet.

```bash
npm run dev               # dev server on http://localhost:3000
npm run build             # production build (standalone output)
npm run start             # run the production build
npm run check             # typecheck + lint + tests: run before ticking a task
npm run typecheck         # tsc --noEmit
npm run lint              # eslint .
npm run format            # prettier --write .
npm test                  # vitest run
npm run db:generate       # drizzle-kit generate: SQL migration from schema changes
npm run db:migrate        # apply migrations
docker compose up -d db   # local Postgres
deploy/setup.sh user@ip   # Siamak only: set up (or, with --from, move to) the production server
```

## Conventions

- **Google Analytics:** only `src/lib/ga4/` calls GA4, and only `src/lib/search-console/` calls Search Console. Pages, the email and jobs use their typed functions. Components never call Google directly.
- **Access checks:** every signed-in page, route handler and server action starts with `requireUser()` or `requireSite()`. Never trust a property ID sent from the browser.
- **Env vars:** read them only through `src/lib/env.ts` (checked with Zod at startup).
- **Components:** use server components by default. Use client components only for interaction: date switch, chart tooltips, globe and forms.
- **Charts:** no chart JavaScript on landing or public pages, so those charts are server-rendered SVG.
- **Tests:** put them next to the code (`*.test.ts`), using Vitest.
- **Dates:** use calendar dates in the site's GA4 time zone. Ranges end yesterday, and yesterday is marked "still updating".
- **Brand:** the name is always one word, SimpleDash. The logo and favicon are a "–" dash mark.
- **Theme tokens only:** `src/config/theme.ts` is the only place for colours, radius, shadows and brand facts.
  - Use token classes such as `bg-primary` and `text-muted-foreground`.
  - Never use hex, `rgb()` or `oklch()` values, Tailwind palette colours (`bg-blue-500`) or arbitrary colour classes. Lint and tests enforce this.
- **Reuse first:** before writing a component, helper or util, look for one in CodeGraph, `src/components/ui`, `src/components/shared` and `src/lib`.
  - Add shadcn parts with its CLI instead of writing them.
  - Extend with a prop or a `cva` variant instead of copying, and pull shared code out the second time it's needed.
  - Prefer platform APIs (`Intl`, `URL`) and the packages we already have over new ones.
- **Layers:** `src/config` → `components/ui` → `components/shared` → feature folders → `src/app`. Each imports only from its own folder and the layers before it, and shared blocks never fetch data. Plans and prices come only from `src/config/plans.ts`, and the card list only from `src/config/cards.ts`. Details are in `docs/SPEC.md` section 4.
- **UI quality:** mobile first. Cards use container queries and the shared `CardShell` states, with no layout shift. Before ticking a UI task, check it at 375 px and 1440 px and do a keyboard-only pass. The bar is DataFast-level polish with our own design (`docs/SPEC.md` section 18).
- **Docs:** use plain words in the docs too. Refer to a part of a doc as "section 16", never with symbols such as the section sign.
- **Plain words on screen:**

| On screen | GA4 source |
| --- | --- |
| Visitors | `activeUsers` |
| Page views | `screenPageViews` |
| Avg. time | `userEngagementDuration` ÷ `activeUsers` |
| Signups | `eventCount` of the key event the user chose |
| Sources / Channels | `sessionSource` / `sessionDefaultChannelGroup` |
| Pages / Landing pages | `pagePath` / `landingPage` |
| Countries | `country`, `countryId` |
| Devices | `deviceCategory` |
| Actions | `eventCount` by `eventName` |
| Right now | Realtime `activeUsers` (last 30 minutes) |
| Clicks / Seen (Google search card) | Search Console `clicks` / `impressions` |
| Click rate / Position | Search Console `ctr` / `position` (average position) |
| Searches | Search Console `query` |

## Working rules (copied from the roadmap)

**Project files**

| File                | Purpose                                                                                                           | Updated when                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `CLAUDE.md`         | Short project brief: what SimpleDash is, the principles, stack, commands, conventions and these rules             | When a rule or convention changes                              |
| `README.md`         | What the app is, how to set it up and run it, every environment variable, scripts                                 | **After every change** that affects setup, running or features |
| `docs/SPEC.md`      | Technical spec: architecture, data model, GA4 queries, screens                                                    | Before each sprint, and when the design changes                |
| `docs/CHECKLIST.md` | Sprint tasks as checkboxes in plain words, so Siamak can see what's done                                          | Tick each task as it finishes, with the date                   |
| `docs/STORY.md`     | Dated log per session: what was done, what was learned, problems, what's next. Written for future Claude sessions | At the end of every session                                    |
| `docs/DECISIONS.md` | Each technical decision with a one-line reason (library choices, trade-offs)                                      | Whenever a decision is made                                    |
| `docs/<area>.md`    | How each part works: GA4 data layer, auth, billing, email, public page                                            | When that part is built or changed                             |

**Rules**

1. **Never commit, push or touch git history.** No `git commit`, `git push`, branches or PRs. Siamak handles all git work.
2. **Start every session** by reading `CLAUDE.md`, `docs/CHECKLIST.md` and the latest entry in `docs/STORY.md`.
3. **Use CodeGraph first.** Initialise it in Sprint 0, use it to find code before reading or searching files, and refresh its index after large changes.
4. **Plan before coding** each sprint, and ask Siamak when something is unclear instead of guessing.
5. **Stay inside the roadmap.** No features that aren't listed. Suggest ideas in `docs/STORY.md` instead.
6. **Definition of done for each task:** typecheck, lint and tests pass; the feature works in the browser; public pages still score 95 or more in Lighthouse; `docs/CHECKLIST.md` is ticked; `README.md` and the relevant `docs/` file are updated.
7. **End every session** with a `docs/STORY.md` entry.
8. **No secrets** in code, docs or logs. Keep them in `.env` files only and list them in `.env.example`.
9. **Every new dependency** gets a line in `docs/DECISIONS.md`.
10. **Plain words in the UI.** No GA4 jargon on screen.
