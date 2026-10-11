# SimpleDash Roadmap

Oct 10, 2026 · @Siamak Ramezani

## How to use this doc

This is the product brief for Claude Code. It says **what** to build and **why**, plus the rules the build must follow. During planning, Claude Code writes the technical spec (the **how**) into the repo as `docs/SPEC.md`, then builds sprint by sprint.

First prompt for Claude Code: _"Read this roadmap. Set up the project files from Working rules, write `docs/SPEC.md` for V1, and turn the V1 sprints into `docs/CHECKLIST.md`. Ask me about anything unclear before writing code."_

GA4 field names below come from my knowledge of the API and should be checked against Google's current API schema during planning.

## Product

SimpleDash (simpledash.app) turns the Google Analytics a founder already has into one simple page, a weekly email and an optional public stats page. There is no new tracking script.

**Positioning (landing page headline):** H1 "Google Analytics, in a dash." Subheadline: "Connect your Google account and see your visitors, sources and top pages on one page. No setup, no new tracking code, full history from day one." Button: "See my dashboard, free". Brand: the name is always written as one word, SimpleDash, and the logo is a simple "–" dash mark (it also works as the favicon).

**Our edge over DataFast, Plausible, Fathom and others:**

- Zero setup: if GA4 is already on the site, it works in one click.
- Full history on day one, because Google already stores it.
- A flat price with no traffic limits, because we store almost nothing. Competitors charge by events or pageviews.

**Who it's for:** indie hackers, solo founders and small SaaS or content sites that already run GA4 and find it confusing.

**Who it's not for:** people leaving Google for privacy reasons, and teams that need per-visitor journeys, session replay or deep product analytics.

**Business goal:** €1,000 MRR by end of 2027. This is the first product in a portfolio, so ship fast, learn, and grow an audience on X.

## Principles and hard constraints

These are not open for debate during planning. Anything that would break one goes back to Siamak first.

1. **No tracking script.** All visitor data comes from the user's GA4 property through Google's APIs.
2. **Read-only Google access.** Request only read-only scopes, and only when needed. V1 needs only Analytics read-only.
3. **Store as little as possible.** Keep users, settings, encrypted Google tokens, chart notes, public-page settings and short-lived report caches. Never store raw visitor-level data.
4. **Simple beats complete.** One page, plain words, no GA jargon ("Visitors", not "Active users"). If a card needs explaining, simplify it or cut it.
5. **Never invent explanations.** Summaries state what changed, from the numbers. No guessed reasons.
6. **Show missing data honestly.** If key events aren't set up, the Signups card says so and links to a short how-to. It never shows a fake zero.
7. **Fast.** Follow Core Web Vitals best practice everywhere. Public pages (landing, public stats, legal) target 100, and never below 95, in Lighthouse for Performance, Accessibility, Best Practices and SEO. The signed-in dashboard targets the same for Accessibility and Best Practices and feels instant: serve from cache and refresh in the background.
8. **Cheap to run.** Free tiers where possible. Running cost per customer must stay well under €1 a month.

## How it works

The whole product is one pipeline: Google login in, cached GA4 reports out to three places (dashboard, email, public page).

1. **Sign in with Google.** The same consent screen asks for read-only Analytics access. Store the refresh token encrypted.
2. **Choose a property automatically.** List the user's GA4 properties with the Admin API (account summaries) and pick one without asking: the only one, or the one with the most visitors in the last 7 days. Save its property ID and time zone. The user can switch later from the top of the dashboard.
3. **Fetch reports.** A server-side data layer runs Data API reports per card and per date range, and caches each result. Use one shared cache per property and range, not per viewer.
4. **Show the dashboard.** Cards read from cache. If a cache is old, show it right away and refresh in the background. The live globe polls the Realtime API about every 30 to 60 seconds while the page is open.
5. **Monday email.** A scheduled job builds each user's weekly numbers and summary from the same data layer and sends the email.
6. **Public page.** If the user turns it on, `/p/<slug>` shows only the cards they chose, served from cache with a longer lifetime.
7. **Billing.** Stripe Checkout and the Customer Portal. A webhook updates the user's plan status. When a trial ends unpaid, the dashboard locks but the data stays.

## GA4 and Google facts the build must respect

These limits shape the caching, the onboarding and the launch plan.

| Topic                 | Fact                                                                                                                                                                                                                                                                                                                                                                        | What it means for us                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| API quotas            | Per standard property: 200,000 tokens a day, 40,000 an hour, 14,000 per project per property per hour, 10 concurrent requests ([quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas))                                                                                                                                                        | Cache everything. Batch card queries. Never query GA4 on every page view.                                   |
| Realtime              | Covers only the last 30 minutes on standard properties, with fewer fields ([realtime](https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-basics))                                                                                                                                                                                                 | The live globe shows "right now" only. Map city or country names to coordinates with a static lookup table. |
| Freshness             | Standard properties can take 24 to 48 hours to fully process a day (from memory, verify)                                                                                                                                                                                                                                                                                    | Label today and yesterday as "still updating". Compare full days in summaries and emails.                   |
| Key events            | Signups and purchases exist only if the site set them up                                                                                                                                                                                                                                                                                                                    | Detect key events on connect. If none exist, show a friendly "set this up" card.                            |
| Auto-collected events | GA4 can collect downloads, outbound clicks, form interactions and scroll if Enhanced Measurement is on                                                                                                                                                                                                                                                                      | The Actions card shows whichever exist. Hide empty rows.                                                    |
| Consent and blockers  | Visitors who refuse cookies or block GA aren't counted                                                                                                                                                                                                                                                                                                                      | Say "visitors GA4 counted" in help text. Don't promise exact counts.                                        |
| OAuth verification    | Unverified apps with sensitive scopes are capped at 100 new users ([unverified apps](https://support.google.com/cloud/answer/7454865)). Verification needs a verified domain, privacy policy and demo video, and takes 3 to 5 business days ([sensitive scopes](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)) | Submit for verification as soon as the landing page and privacy policy are live.                            |
| Publishing status     | Apps left in "Testing" status have a limited refresh-token lifetime (from memory, about 7 days; verify)                                                                                                                                                                                                                                                                     | Publish to "In production" (unverified) before real users, so logins don't expire weekly.                   |
| Funnel API            | The funnel report endpoint is still v1alpha                                                                                                                                                                                                                                                                                                                                 | Fine for V2, but wrap it so changes are easy to absorb.                                                     |

## Suggested stack and pricing setup

Siamak has chosen the UI, database, hosting and DNS. The other rows are defaults that fit a low budget. Claude Code may propose a change in `docs/SPEC.md` with a one-line reason.

| Part            | Choice                                                                                                                                            | Why                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| App             | Next.js (App Router) with TypeScript, built as a standalone Docker image                                                                          | Siamak's main stack; Docker makes it portable                                    |
| UI              | Tailwind CSS plus shadcn/ui; shadcn/ui charts (built on Recharts) as the one chart library; a tiny WebGL globe library (e.g. cobe), loaded lazily | Agreed with Siamak; small and consistent                                         |
| Database        | Postgres on Supabase's free tier, used as **plain Postgres only** through an ORM such as Drizzle                                                  | A move to Azure Database for PostgreSQL later is just a connection-string change |
| Auth            | Google sign-in through a standard library (e.g. Auth.js), with offline access for refresh tokens. **Not** Supabase Auth                           | Login and GA4 consent in one step; no lock-in                                    |
| Google APIs     | Official Node clients for the Analytics Data API and Admin API                                                                                    | Supported and typed                                                              |
| Email           | Resend or Postmark, with React Email templates                                                                                                    | Easy, cheap at low volume                                                        |
| Payments        | Stripe Checkout, Customer Portal and webhooks                                                                                                     | Standard, self-serve                                                             |
| Hosting         | A Hetzner cloud server (EU region) running Docker, deployed with Coolify or Docker Compose                                                        | Cheap, EU, and the same image runs on Azure later                                |
| DNS, HTTPS, CDN | Cloudflare: DNS, proxy, SSL mode "Full (strict)" with a Cloudflare Origin Certificate on the server, caching of static files                      | Free, fast, hides the server IP                                                  |
| Jobs            | Scheduled tasks on the server (Coolify scheduled tasks or cron) calling protected internal endpoints, for the Monday email and cache warming      | No extra service                                                                 |
| Backups         | Nightly Postgres dump to Cloudflare R2                                                                                                            | Cheap, off-server                                                                |
| Errors          | A free error tracker (e.g. Sentry)                                                                                                                | Know when GA4 calls fail                                                         |
| Testing         | Unit tests for the GA4 data layer, summary logic and billing webhooks. **No end-to-end tests**                                                    | Protect the core, keep it fast                                                   |

**Keep it portable:** no Supabase-only features (Auth, Storage, Realtime, row-level security), no Vercel-only features (Edge Config, Vercel Cron, image service), and all config in environment variables. Then moving to Azure is a redeploy, not a rewrite. Note: from memory, Supabase pauses free projects after about a week with no activity (verify). The daily jobs should keep it awake, but check this in planning.

**Cloudflare is a good choice.** One extra suggestion: use Cloudflare Email Routing (free) to receive mail at your domain, and send app email through Resend or Postmark.

**Security musts:** encrypt Google refresh tokens at rest, keep secrets in environment variables only, check that every request is for the signed-in user's own property, and delete tokens on disconnect.

**Pricing in V1:** one plan at €9 a month, flat, with no traffic limits, one GA4 site, and a 14-day free trial with no card. A Growth plan at €19 arrives in V2.

## V1 screens and cards

V1 has 7 screens and one email. The dashboard is a single scrolling page of cards, with a date switch (7 days, 30 days, 12 months) that compares with the previous period of the same length.

**Screens**

1. **Landing page:** headline, a live demo dashboard on sample data, "how it works" in 3 steps, price, FAQ ("Do I need GA4?", "What do you store?"), sign-in button.
2. **Sign in:** Google sign-in with read-only Analytics consent. One screen, then straight to the dashboard.
3. **Dashboard:** the cards below. There is no separate onboarding screen (see Onboarding below).
4. **Public page** at `/p/<slug>`: the cards the user chose, a "Powered by SimpleDash" link, and no private data.
5. **Settings:** account, weekly email on or off, public page (slug and cards), billing (Stripe portal), disconnect Google, delete account.
6. **Legal:** privacy policy and terms.
7. **SEO files:** `robots.txt`, `sitemap.xml` and `llms.txt` (see Sprint 3).

**Onboarding: no setup screen, setup inside the cards.** The user should see real numbers within seconds of signing in, and is asked for anything else only where it matters:

- **Property:** picked automatically. With one GA4 property, use it. With several, pick the one with the most visitors in the last 7 days. A switcher at the top ("Showing: mysite.com") lets them change it.
- **No GA4 property at all:** show the dashboard with sample data and a clear banner: "No Google Analytics site found. Here's how to add GA4 in 5 minutes."
- **Signups card:** if no signup event is chosen, the card shows an empty state: "Which action means a signup?" with a picker of their existing key events, or a short how-to if there are none.
- **Public page card:** an empty state: "Share your stats publicly?" with a one-click turn-on.
- **Chart notes:** an empty hint on the chart: "Add a note, like 'Launched on Product Hunt'".
- **Weekly email:** on by default, with a one-line notice in the dashboard and an easy off switch.

**States to design:** no GA4 property found, property with no data yet, key events missing, Google access revoked, Google quota reached, trial ended.

**Dashboard cards and their GA4 source**

| Card           | Shows                                                                       | GA4 source (verify names in planning)                                                                  |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Summary line   | "Visitors up 23% vs last week, mostly from Google"                          | Built from the cards below, no AI                                                                      |
| Visitors       | Number and % change                                                         | `activeUsers`                                                                                          |
| Page views     | Number and % change                                                         | `screenPageViews`                                                                                      |
| Avg. time      | Engagement time per visitor                                                 | `userEngagementDuration` divided by `activeUsers`                                                      |
| Signups        | Count of the chosen key event                                               | `keyEvents` filtered by `eventName`                                                                    |
| Visitors chart | Line over time, with chart notes                                            | `activeUsers` by `date` (`dateHour` for short ranges)                                                  |
| Sources        | Ranked list with site icons                                                 | `sessionSource`, with a toggle to `sessionDefaultChannelGroup`                                         |
| AI traffic     | Visitors from ChatGPT, Perplexity, Claude, Gemini, Copilot, and their pages | `sessionSource` matched against a list of AI domains (check whether GA4 now has a built-in AI channel) |
| Pages          | Top pages and top landing pages                                             | `pagePath`, `landingPage`                                                                              |
| Countries      | Ranked with flags                                                           | `country`, `countryId`                                                                                 |
| Devices        | Desktop, mobile, tablet                                                     | `deviceCategory`                                                                                       |
| Actions        | Downloads, outbound clicks, form submits, signups                           | `eventCount` by `eventName` (e.g. `file_download`, `click`, `form_submit`)                             |
| Live globe     | Visitors in the last 30 minutes, by place, plus top live pages              | Realtime API: `activeUsers` by `country` and `city`                                                    |

Every card has a CSV download. Chart notes are stored in our database, not in GA4.

**Weekly email (Mondays):** the summary line, the 4 numbers for last full week vs the week before, top 3 sources, top 3 pages, any AI traffic, a link to the dashboard, and an unsubscribe link.

## V1 sprints

V1 is 5 sprints. Each sprint ends with something Siamak can click through, and the next sprint starts only when the "done when" line is true.

### Sprint 0: project setup

- [ ] Create the project files from Working rules: `CLAUDE.md`, `README.md`, `docs/SPEC.md`, `docs/CHECKLIST.md`, `docs/STORY.md`, `docs/DECISIONS.md`
- [ ] Initialise CodeGraph and confirm it indexes the repo
- [ ] Next.js, TypeScript, Tailwind, shadcn/ui, lint, format and unit-test setup
- [ ] Postgres on Supabase (plain Postgres via the ORM) and first migration (users)
- [ ] Environment variable template (`.env.example`) with every key documented
- [ ] Dockerfile (Next.js standalone output) and Docker Compose for local and server use
- [ ] Hetzner server with Coolify (or Compose), Cloudflare DNS and Full (strict) SSL, and a first deploy of a "hello" page
- [ ] Run Lighthouse on the hello page as the performance baseline

**Done when:** the app runs locally and on the server at the real domain over HTTPS, tests pass, and the project files exist and are filled in.

### Sprint 1: connect Google

- [ ] Google sign-in with read-only Analytics scope and refresh token, stored encrypted
- [ ] Automatic property choice after sign-in (only property, or most visitors in the last 7 days), plus a switcher at the top
- [ ] Sample-data dashboard with a "how to add GA4" banner for users with no GA4 property
- [ ] GA4 data layer: typed report functions, cache table, refresh-in-background, quota and error handling
- [ ] States: no data yet, access revoked, quota reached

**Done when:** Siamak signs in with a real Google account and lands on real numbers within seconds, without choosing anything.

### Sprint 2: core dashboard

- [ ] Date switch with comparison to the previous period
- [ ] Visitors, Page views, Avg. time and Signups cards with % change
- [ ] Signups empty state: "Which action means a signup?" with a key-event picker, or a how-to if none exist
- [ ] Visitors chart
- [ ] Sources, Pages, Countries and Devices ranked lists
- [ ] Summary line built from the numbers
- [ ] Mobile-friendly layout
- [ ] Accessible: keyboard navigation, visible focus, good contrast, and text alternatives for every chart

**Done when:** the dashboard shows a real site correctly, and the numbers match GA4's own reports for the same range.

### Sprint 3: the extras that make it special

- [ ] AI traffic card
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

**Done when:** a stranger can understand the landing page in 10 seconds, and the verification request is submitted.

### Sprint 4: email, sharing, payment, launch

- [ ] Weekly Monday email, on by default, with an off switch in settings and an unsubscribe link
- [ ] Public page: turn on from its card or settings, choose slug and cards, "Powered by SimpleDash" link
- [ ] Public pages in `sitemap.xml`, with a "let search engines index this page" option (on by default)
- [ ] Stripe: 14-day trial without card, €9 plan, checkout, portal, webhook, locked state after the trial
- [ ] Settings: disconnect Google, delete account and all data
- [ ] Production hardening: nightly database backup to Cloudflare R2, uptime check, error tracking, basic usage counts (signups, connected sites, paying)
- [ ] Final Lighthouse pass on landing, legal and a public page: 95 or more in all four categories
- [ ] Launch kit: Product Hunt page, Indie Hackers post, X thread, screenshots

**Done when:** a new user can go from landing page to paying without help, and the launch posts are ready.

## V2 sprints

V2 starts only once at least 3 people pay for V1. It adds a Growth plan at €19 a month (several sites, alerts, mentions, AI questions, revenue), and the €9 plan stays unchanged. Order the sprints by what paying users ask for most. The order below is the default.

### Sprint 5: more from Google

- [ ] Search Console connection (extra read-only scope, requested only when the user turns it on)
- [ ] Top searches, rising searches, and "almost page 1" searches (ranked 8 to 15)
- [ ] Several GA4 sites per account, with an all-sites overview
- [ ] Growth plan in Stripe, with limits enforced per plan

**Done when:** a Growth user sees Search Console data and switches between sites.

### Sprint 6: notice things for the user

- [ ] Email alerts: traffic dropped sharply, or tracking broke (signups or all events at zero)
- [ ] "New site linked to you" heads-up when a referrer appears for the first time
- [ ] Hacker News and Product Hunt launches pinned on the chart (free APIs)
- [ ] X mentions of the domain pinned on the chart (X API, about $0.005 per post read, Growth plan only)

**Done when:** an alert fires correctly on a test property, and mentions show on the chart.

### Sprint 7: money

- [ ] Connect Stripe (read-only) to show revenue next to traffic
- [ ] Revenue by channel: a small checkout snippet stores the GA visitor ID in Stripe metadata, and paid orders go back to GA4 as purchase events (Measurement Protocol)
- [ ] Signup funnel built from existing key events

**Done when:** Siamak's own test purchase shows up under the right source.

### Sprint 8: AI and growth loop

- [ ] Ask your data in plain English (an AI model over our cached GA4 reports, answers must cite the numbers)
- [ ] Milestone images to share on X ("1,000 visitors this month")

**Done when:** answers to 10 test questions match the dashboard numbers.

## Working rules for Claude Code

Claude Code copies these rules into `CLAUDE.md` in Sprint 0 and follows them in every session.

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

## Launch and success rule

- **Launch:** Product Hunt, Indie Hackers and an X thread in the same week. Build in public on X at least 3 times a week from Sprint 0.
- **Stop rule:** if fewer than 3 people pay within 6 weeks of launch, stop and move to the next product.
- **V2 gate:** start V2 when 3 or more people pay.
- **Measure:** signups, connected sites, trial-to-paid rate, weekly email opens, public pages turned on.

## Not planned, only if users ask

- AI bot visits (needs a server snippet from the user)
- Bluesky mentions
- Public page explorer, leaderboards, benchmarks
- Shopify, Paddle, LemonSqueezy and Polar revenue
- Retention and cohorts
- Team seats and Slack alerts
- Phone app or home-screen widget

## Will not build

- Our own tracking script, because it breaks the core promise
- Session replay and heatmaps, which GA4 can't supply
- Per-visitor journeys, because GA4's API has no per-user data
- Competitor analytics, because other companies' data is private
- Storing raw visitor data
