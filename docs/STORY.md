# SimpleDash story

A dated log with one entry per session. **Newest entry first.**

It is written for future Claude sessions: read the latest entry before starting work. Ideas that fall outside the roadmap go here too (Working rule 5).

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
