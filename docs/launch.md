# Launch kit

Drafts for Siamak to review, change and post. Nothing here has been posted. Every claim matches what V1 does; there are no made-up numbers or quotes. Replace the `[…]` parts before posting.

Screenshots are in `docs/launch/` (2× resolution, from the local production build on sample data):

| File | Shows | Use for |
| --- | --- | --- |
| `01-landing.png` | The landing page hero | Product Hunt gallery 1, X post 1 |
| `02-dashboard.png` | The dashboard: summary line, the 4 numbers, the chart with a note | Product Hunt gallery 2, Indie Hackers post |
| `03-dashboard-live.png` | Right now (live globe), Sources with icons, Pages | Product Hunt gallery 3, X post 3 |
| `04-public-page.png` | A public stats page | Product Hunt gallery 4, X post 5 |
| `05-weekly-email.png` | The Monday email | Product Hunt gallery 5, X post 4 |
| `06-settings-billing.png` | Settings: public page and billing | Only if asked about pricing |
| `07-mobile-dashboard.png` | The dashboard on a phone | X post 2 |

Product Hunt's gallery wants 1270 × 760; the desktop shots are exactly that at 2×. The phone shot is 390 × 844 at 3×.

## Product Hunt

**Name:** SimpleDash

**Tagline** (60 characters at most):

> Your Google Analytics on one simple page

**Description** (260 characters at most):

> SimpleDash turns the GA4 data you already have into one plain dashboard: visitors, where they came from, top pages, signups, a live globe. Plus a Monday email and an optional public stats page. No tracking script to add. Read-only. Free for all your sites.

**Topics:** Analytics, SaaS, Developer Tools, Indie Hackers (pick the 3 that exist).

**Pricing:** Free, with a paid plan. Free: all your sites and the last 30 days. Pro: $9 a month or $90 a year (tax included).

**First comment (from the maker):**

> Hi Product Hunt 👋 I'm Siamak.
>
> I kept opening Google Analytics 4 to answer three questions: how many people came, where from, and did anyone sign up. GA4 can answer all three, but it takes me a dozen clicks and a few reports I don't fully understand.
>
> So I built SimpleDash. You sign in with Google, it finds your GA4 site, and you get one page:
>
> - a summary line that only states what changed (no guesses about why)
> - visitors, page views, average time and signups, against the period before
> - sources (with icons), top pages, countries, devices and AI assistants like ChatGPT
> - who's on the site right now, on a small globe
> - notes on the chart ("Launched on Product Hunt" 🙂) and CSV on every card
>
> Things I cared about:
>
> - **No new tracking script.** It reads the data GA4 already has, with read-only access.
> - **Little stored.** Your settings, encrypted Google tokens and short-lived report caches. Nothing about individual visitors.
> - **Honest numbers.** Missing data says so instead of showing a zero, and today is marked "still updating".
>
> It's free for all your sites and the last 30 days, no card. Pro is $9 a month (or $90 a year) for 12 months and any dates, a Monday email with last week's numbers, Google search insights and revenue from Stripe. You can share a public stats page if you build in public.
>
> I'd love to hear what you'd want on the page, and what you'd remove. [link]

**Launch day checklist:**

- [ ] Product Hunt page scheduled for 00:01 Pacific time
- [ ] The landing page and sign-in work on the live domain, with live Stripe keys
- [ ] Google's app verification is approved (otherwise new users see the "unverified app" screen and are capped at 100)
- [ ] Resend is on a plan that covers the expected sign-ups' Monday emails
- [ ] A note on your own chart: "Launched on Product Hunt"

## Indie Hackers post

**Title:** I built a one-page dashboard for GA4 because I kept getting lost in it

> I run a few small sites and they all have Google Analytics 4. Every week I'd open it to answer the same questions (how many visitors, from where, did anyone sign up) and every week it took too long.
>
> **What I built:** SimpleDash ([link]). Sign in with Google, it picks your busiest GA4 property, and you see one page with the numbers that matter for a small site, in plain words. It also sends a Monday email with last week's numbers, and can publish a public stats page if you like sharing your numbers.
>
> **How it works:**
>
> - It reads GA4 through Google's Data and Admin APIs with read-only access. There's no script to add to your site.
> - Reports are cached and refreshed in the background (every half hour while a range includes today), so the page opens fast and stays well inside Google's quotas.
> - It stores your settings, encrypted Google tokens and short-lived caches. Nothing about individual visitors.
> - Stack: Next.js 16, Postgres, Better Auth, Stripe, Resend, on one server with Docker Compose behind Cloudflare.
>
> **Pricing:** free for all your sites and 30 days; Pro is $9 a month or $90 a year. I wanted it cheap enough that it's an easy yes for a side project, and it's built to cost well under $1 per customer per month to run.
>
> **What I learned building it:**
>
> - GA4's hourly data is a comb of zeros and ones on small sites, so the 7-day chart is daily.
> - "Average engagement time" confuses everyone; it's "Avg. time" here, with a one-line explanation.
> - Never show a fake zero: if GA4 hasn't reported today yet, the chart leaves it out instead of drawing a zero.
>
> I'd love feedback, especially from anyone who also gave up on the GA4 interface. What would you want on the one page?

## X thread

1/
> I kept opening Google Analytics 4 to answer 3 questions:
> how many came, from where, did anyone sign up.
>
> So I built SimpleDash: your GA4 data on one simple page. No new tracking script.
>
> [link] 🧵
>
> [01-landing.png]

2/
> Sign in with Google and it finds your site on its own.
>
> One page: a summary line, visitors, page views, avg. time, signups, the chart, sources, pages, countries, devices.
>
> Works on your phone too.
>
> [07-mobile-dashboard.png]

3/
> Who's on your site right now, on a little globe 🌍
>
> Plus where visitors came from (with icons), and how many came from ChatGPT, Perplexity and Claude.
>
> [03-dashboard-live.png]

4/
> On Pro, every Monday you get last week's numbers by email.
>
> It only says what changed. It never guesses why.
>
> [05-weekly-email.png]

5/
> Building in public? Turn on a public stats page and choose the cards it shows. Notes and anything private never appear on it.
>
> [04-public-page.png]

6/
> Read-only Google access. Nothing stored about your visitors. Open source (AGPL-3.0).
>
> Free for all your sites, no card. Pro: $9 a month or $90 a year.
>
> [link]

## After launch

- Answer every comment on Product Hunt and Indie Hackers the same day.
- Note what people ask for in `docs/STORY.md`, so it can go into the V2 planning (the Pro plan list in `src/config/plans.ts`).
