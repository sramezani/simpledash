# Content plan

Written Oct 15, 2026; approved by Siamak and built on Oct 16, 2026 with Fumadocs (`docs/SPEC.md` section 30). Every page in section 6 is written, except the changelog, which is skipped for now. The rules in section 15 apply to every change from here on.

## 1. The goal

Bring the people SimpleDash is for to simpledash.app, from Google and from AI assistants, and help everyone who signs up get value on day one. **Every page has one job: be the best answer on the web to one question our users ask.**

Success means three things, measured as in section 11:

- **People find us:** our pages get indexed, impressions and clicks grow in Search Console, and AI assistants name SimpleDash when asked our target questions.
- **People join:** signups that start on a content page.
- **People succeed:** fewer support emails, because every message the app shows has a page that explains it.

Targets get set after the first four weeks of data. Before then any number would be a guess, and we don't invent numbers.

## 2. Who we write for

| Reader | What they want | What brings them |
| --- | --- | --- |
| Indie hackers and solo founders with one or more small sites on GA4 | Three answers: how many came, from where, and did anyone sign up or pay | GA4 confusion, setup questions, launches |
| Small content sites and bloggers | Which posts work, where readers come from | GA4 terms, traffic questions, Search Console |
| People who build in public | A stats page they can share | Open startup pages, sharing numbers |
| AI assistants and coding agents working for these people | Clear facts to quote, exact steps to follow | Every page, read as text or Markdown |

**Not for:** people leaving Google for privacy reasons, and analysts who need per-visitor journeys. Pages say this plainly and point them elsewhere. An assistant that recommends us for the wrong job costs trust.

## 3. What every page says about SimpleDash

**One definition, word for word, everywhere:** the site, `llms.txt`, GitHub, Product Hunt, directories and the X bio. That way search engines and assistants learn one clear description. It is the first line of `llms.txt`:

> SimpleDash turns the Google Analytics 4 data a site already has into one simple dashboard page, a weekly Monday email and an optional public stats page. There is no tracking script: it reads GA4 with read-only access.

**What we stand for, in this order** (the angle of every page):

1. **Keep GA4, make it simple:** no new script, and the history GA4 already has.
2. **Plain words** instead of GA4 jargon.
3. **Honest numbers:** nothing guessed, and missing data says so.
4. **Free for all your sites.** Pro adds full history, the Monday email, Google search insights and revenue. Prices always come from `src/config/plans.ts`.
5. **Read-only, little stored, open source.**

## 4. The strategy

### 4.1 Content does three jobs

| Job | Pages | Measured by |
| --- | --- | --- |
| Get found | Guides (how-tos for GA4, Search Console and Stripe), the glossary, "understand your traffic" | Impressions, clicks, mentions by assistants |
| Get chosen | Comparisons, plans, trust pages (data, access, open source) | Signups that start on these pages |
| Help users succeed | Docs for every feature and setting, troubleshooting for every message the app shows | Fewer support emails, people returning to the dashboard |

### 4.2 Why this order

- **Specific questions beat big terms.** A new domain won't rank for big terms like "google analytics tutorial" for a long time. Specific questions whose current answers are weak (old screenshots, Universal Analytics leftovers, thin pages, video only) can be won now.
- **Product fit comes first.** We pick questions where SimpleDash is a natural part of the answer: AI traffic, signups, Stripe referrals, plain-words metrics. That traffic turns into users; generic traffic doesn't.
- **Trust and docs come first anyway.** Launch traffic from Product Hunt, X and Indie Hackers arrives long before search traffic, and it asks "is this safe, what does it cost, how does it work".
- **Assistants learn from comparisons and from the wider web.** They answer "which tool should I use" from comparison and reference pages and from what other sites say about us. So those pages come early, and mentions on other sites are part of the plan (section 10).
- **Finish clusters instead of scattering.** A topic covered fully, with pages linking to each other, beats the same number of pages spread across many topics. Within a phase, finish one cluster before starting the next.

### 4.3 How a topic earns a page

Score each idea from 0 to 3 on three things, and write the highest totals first:

- **Fit:** does SimpleDash answer it directly? 3 means a SimpleDash feature is the answer; 0 means unrelated.
- **Demand:** do people search for it or ask it? Check with free tools:
  - Google's autocomplete and "People also ask"
  - Search Console queries, once pages exist
  - Google Keyword Planner (free with a Google Ads account)
  - Bing Webmaster Tools' keyword research
  - Real questions on Reddit, Indie Hackers and the Google Analytics community
- **Win chance:** are today's top results weak (old, still about Universal Analytics, thin, slow, video only)?

The inventory in section 6 already scores Fit. Demand and Win chance get checked just before each page is written. A page that scores low on all three doesn't get written.

### 4.4 Rules for every page

1. **One page, one question.** One search intent, answered better than anywhere else, or we don't publish. Two pages never target the same question: a glossary term that already has a guide links to the guide.
2. **Answer first.** The first two sentences answer the question on their own. Assistants and featured snippets quote them.
3. **First-hand.** Every step is done for real on our own accounts (simpledash.app's GA4, Search Console and Stripe), with our own screenshots and a "Checked on" date. No step we haven't done ourselves.
4. **Never invent.** Facts link to the official source (Google's and Stripe's help pages). Prices, limits, scopes and freshness come from the code (section 12), so a page can't drift from the product.
5. **Plain words, with the searched term once.** Use the GA4 name people type, then our word: "key events (GA4's name for conversions), which SimpleDash shows as Signups".
6. **The product where it helps.** One "In SimpleDash" block per guide, showing the same thing in the dashboard, and one call to action. No pop-ups, no banners. For anyone not ready to sign in, link the live demo.
7. **Honest comparisons.** Say where the other tool is better, date every fact and link its source.
8. **Quality over count.** No near-copies stamped from a template. AI may draft, but a person checks every fact, title and description before publishing. This follows Google's guidance on generative AI content and its scaled content abuse policy (sources at the end).
9. **Fast.** Static pages with no JavaScript on the page: Lighthouse 100 in all four categories, never below 95 (principle 7).
10. **Open.** Every page has an "Edit on GitHub" link, so readers can fix a step that changed.

## 5. Site structure

| Section | Address | What goes in | Main job |
| --- | --- | --- | --- |
| Guides | `/guides`, `/guides/<topic>` | How-tos for Google Analytics, Search Console and Stripe, useful even without SimpleDash | Get found |
| Glossary | `/glossary`, `/glossary/<term>` | GA4 terms in plain words | Get found, quoted by assistants |
| Docs | `/docs`, `/docs/<topic>` | How SimpleDash works: every feature, setting and message | Help users succeed, describe us correctly to assistants |
| Compare | `/compare`, `/compare/<topic>` | SimpleDash next to other tools, plus honest lists | Get chosen |

These sit next to what's already there: `/`, `/demo`, `/privacy`, `/terms`, `/p/<slug>` and `/llms.txt`.

- **Folders, not a subdomain,** so every page builds the standing of the same site.
- **Short lowercase addresses** made of the words people search for, with no dates: `/guides/ga4-ai-traffic`, not `/blog/2026/10/how-to-see-ai-traffic`.
- **Links between pages:**
  - Every page has breadcrumbs.
  - Each hub lists all its pages, and each page links back to its hub.
  - Each page links to 3 to 5 related pages (guide ↔ glossary term ↔ docs page).
  - When a new page ships, older related pages get a link to it.
- **Hubs grow with their cluster.** A hub starts as a short list once its cluster has three pages; the full text comes in phase 4.
- **No blog at the start.** Posts without search demand rarely bring visitors to a new domain. Siamak's build-in-public posts on X do that job. Revisit after the first review (section 11).

## 6. Page inventory

Pages are grouped into clusters. "Hook" is how SimpleDash helps with that question. "Phase" refers to section 7.

### Cluster A: set up Google Analytics 4 (guides)

| Page | The question it answers | Hook | Phase |
| --- | --- | --- | --- |
| `/guides/add-google-analytics-to-website` | How do I add GA4 to my website? Account, property, stream and Google tag, in 5 minutes | The app's "No Google Analytics site found" notice promises exactly this, but links to Google's help today | 1 |
| `/guides/check-ga4-is-working` | Is GA4 collecting data? (Realtime, DebugView, Tag Assistant) | "Right now" shows live visitors without opening GA4 | 1 |
| `/guides/ga4-key-events` | What are key events (GA4's conversions), and how do I mark one? | Signups | 2 |
| `/guides/track-signups-ga4` | How do I count signups? (an event or a thank-you page) | The Signups card | 2 |
| `/guides/track-purchases-ga4` | How do I count sales and revenue? | Sales by source | 2 |
| `/guides/ga4-unwanted-referrals-stripe` | Why do Stripe, PayPal or Lemon Squeezy get the credit for my sales, and how do I fix it? | The payment-page warning in Sources | 2 |
| `/guides/utm-links` | How do I tag my launch links (Product Hunt, X, newsletter) to see what worked? | Sources and Channels | 2 |
| `/guides/add-google-analytics-with-ai-coding-agent` | How do I get Claude Code, Cursor or Copilot to add GA4 correctly? A tested prompt, consent included | Agents follow it, and it ends in SimpleDash | 3 |
| `/guides/add-google-analytics-to-nextjs` | How do I add GA4 to a Next.js site (App Router)? | First-hand: simpledash.app is Next.js | 3 |
| `/guides/add-google-analytics-to-framer`, `-webflow`, `-wordpress`, `-ghost` | The same for each platform (four pages) | Where our readers build | 3 |
| `/guides/add-google-analytics-to-lovable` | The same for a site built with Lovable (check demand for Bolt, v0 and Replit too) | Indie hackers build here now, and good answers are few | 3 |
| `/guides/exclude-internal-traffic-ga4` | How do I stop counting my own visits? | Cleaner numbers in every card | 3 |
| `/guides/ga4-data-retention` | How long does GA4 keep data, and what should I set? | Full history on Pro depends on it | 3 |
| `/guides/ga4-cookie-consent` | Do I need a cookie banner for GA4, and what is Consent Mode? Facts and links, not legal advice | First-hand: simpledash.app does it | 3 |
| `/guides/add-google-analytics-to-shopify`, `-squarespace`, `-wix`, `-carrd`, `-astro`, `-html` | The same for each platform (six pages) | Wider reach | 4 |
| `/guides/add-google-analytics-with-google-tag-manager` | How do I add GA4 through Tag Manager? | Wider reach | 4 |
| `/guides/ga4-cross-domain` | My app and marketing site are on different domains: how do I track both? | One site in SimpleDash | 4 |
| `/guides/google-analytics-4-setup` (hub) | The whole setup, start to finish, in order | Ends in SimpleDash | 4 |

Platform pages get written only for platforms we actually test on a real site.

### Cluster B: GA4 in plain words (glossary)

| Page | The question it answers | Phase |
| --- | --- | --- |
| `/glossary` (hub) | Every GA4 term next to SimpleDash's plain word, built from the same list as the app | 2 |
| `/glossary/active-users` | What is an active user, and how is it different from total and new users? | 2 |
| `/glossary/sessions` | What is a session in GA4? | 2 |
| `/glossary/engagement-time` | What is average engagement time? (Avg. time in SimpleDash) | 2 |
| `/glossary/engaged-sessions` | What are engaged sessions and engagement rate, and what happened to bounce rate? | 2 |
| `/glossary/not-set` | What does "(not set)" mean? | 2 |
| `/glossary/views`, `events`, `source-medium`, `default-channel-group`, `landing-page`, `realtime`, `data-thresholds`, `attribution` | One term each (eight pages), only those with real search demand | 4 |

Terms that already have a guide (key events, direct, unassigned) link to that guide instead of getting their own page.

### Cluster C: understand your traffic (guides)

| Page | The question it answers | Hook | Phase |
| --- | --- | --- | --- |
| `/guides/ga4-ai-traffic` | How do I see visitors from ChatGPT, Perplexity, Claude and Gemini in GA4? | The AI traffic card | 2 |
| `/guides/ga4-direct-traffic` | What is direct traffic, and why is mine so high? | Sources | 2 |
| `/guides/ga4-data-delay` | Why are today's numbers missing or low? | The dashed "still updating" part of the chart | 2 |
| `/guides/ga4-unassigned-traffic` | What does "Unassigned" mean? | Channels | 3 |
| `/guides/ga4-numbers-differ` | Why do GA4, Stripe, Search Console and my host's analytics all show different numbers? | Honest numbers | 3 |
| `/guides/traffic-dropped` | My traffic dropped: how do I find what changed? (facts only) | The summary line, and "What changed" on Pro | 3 |
| `/guides/understand-website-traffic` (hub) | Reading GA4 for a small site: what matters and what doesn't | The whole dashboard | 4 |

### Cluster D: Google search with Search Console (guides)

| Page | The question it answers | Hook | Phase |
| --- | --- | --- | --- |
| `/guides/add-site-to-search-console` | How do I add and verify my site (domain or URL prefix)? | Needed to connect Search Console | 2 |
| `/guides/keywords-close-to-page-1` | Which searches am I almost on page 1 for? | "Close to page 1" (Pro) | 3 |
| `/guides/low-click-rate-pages` | Which pages are seen on Google but not clicked? | "Seen but not clicked" (Pro) | 3 |
| `/guides/branded-vs-non-branded-traffic` | How much of my Google traffic is people looking for me, and how much is new people? | "Your name vs new people" (Pro) | 3 |
| `/guides/google-clicks-what-changed` | Which searches changed when my Google clicks went up or down? | "What changed" (Pro) | 4 |
| `/guides/google-search-console` (hub) | Using Search Console to grow Google traffic, simply | The Google search card (Pro) | 4 |

### Cluster E: revenue and sales by source (guides)

| Page | The question it answers | Hook | Phase |
| --- | --- | --- | --- |
| `/guides/stripe-restricted-key` | How do I create a read-only (restricted) Stripe key? | Needed to connect Stripe (Pro) | 2 |
| `/guides/thank-you-page-conversions` | Can I count sales from a thank-you page instead of an event? | "Views of a page" in What counts as a sale | 3 |
| `/guides/stripe-mrr` | What is MRR, and how is it worked out from Stripe? | Revenue's MRR line | 4 |
| `/guides/traffic-to-revenue` (hub) | Which traffic sources bring paying customers? | Revenue and Sales by source (Pro) | 4 |

### Cluster F: build in public (guides)

| Page | The question it answers | Hook | Phase |
| --- | --- | --- | --- |
| `/guides/public-analytics-page` | How do I share my site's stats publicly, and what should stay private? | The public stats page, free on every site | 2 |
| `/guides/open-startup-metrics` | What do open startups share, and why? | The public stats page | 4 |

### Cluster G: SimpleDash docs

**Getting started and reference (phase 1):**

| Page | What it covers |
| --- | --- |
| `/docs` (hub) | What SimpleDash is and isn't, on one page, with links to everything |
| `/docs/getting-started` | Signing in, how your site gets picked, your first dashboard |
| `/docs/google-access` | What we can and can't see, the read-only scopes, why Google calls Analytics access "sensitive", how to remove access |
| `/docs/plans` | Free and Pro exactly (from `plans.ts`), and what happens when Pro ends |
| `/docs/sites` | The site menu: every GA4 site, switching, the gear, removing a site |
| `/docs/troubleshooting` | One section per message the app shows (list below) |
| `/docs/numbers-differ-from-ga4` | Why a number can differ from GA4's own screens, and which one to trust |
| `/docs/plain-words` | GA4 term → SimpleDash word, built from the same list as the app |
| `/docs/data-and-security` | What we store and never store, how tokens are kept, how to report a problem |
| `/docs/freshness-and-limits` | How fresh the numbers are, Google's limits, and Free vs Pro, all from the code |
| `/docs/open-source` | The code, the license, contributing, self-hosting status |
| `/docs/what-simpledash-cant-do` | So nobody, person or assistant, picks us for the wrong job |

**Troubleshooting sections.** Each section's heading is the exact message from the app, so a pasted message finds it, and the app can link straight to the section:

| Message in the app | Section |
| --- | --- |
| "No Google Analytics site found." | `#no-google-analytics-site`, which leads to the setup guide |
| "SimpleDash needs read-only access to Google Analytics." | `#allow-analytics-access` |
| "Google Analytics hasn't recorded any visits for … in this period." | `#no-visits` |
| "Google access ended. Reconnect to see fresh numbers." | `#google-access-ended` |
| "You no longer have access to this Google Analytics site." | `#no-access-to-site` |
| "Google Analytics isn't answering right now." | `#google-not-answering` |
| "Google's hourly limit for this site was reached." | `#google-hourly-limit` |
| "Not enough history to compare" | `#not-enough-history` |
| Google's "unverified app" screen (only until Google's verification is approved) | `#unverified-app` |
| Search Console: no matching property | `#search-console-no-match` |
| Stripe key rejected | `#stripe-key-rejected` |
| The Monday email didn't arrive | `#monday-email-missing` |

A section grows into its own page only when it has enough to say. A short page per message would be thin.

**Features and settings (phase 2):**

| Page | What it covers |
| --- | --- |
| `/docs/dashboard` | Every card, with a section each: the numbers, Sources and Channels, Pages, Countries, Devices, Actions, AI traffic, Right now, chart notes, CSV |
| `/docs/signups` | Choosing which action counts as a signup |
| `/docs/date-ranges` | Today included, the dashed part, comparisons, custom ranges, Free's 30 days |
| `/docs/summary-line` | How the summary is written: only from the numbers, never a guess |
| `/docs/public-page` | Turning it on, choosing cards, the address, search engines |
| `/docs/monday-email` | What's in it, when it arrives, turning it off |
| `/docs/google-search` | Connecting Search Console, and the five views |
| `/docs/revenue` | Connecting Stripe with a read-only key, and what's shown |
| `/docs/what-counts-as-a-sale` | A key event or a thank-you page |
| `/docs/settings-and-billing` | The settings pages, upgrading, monthly or yearly, cancelling, invoices |
| `/docs/delete-account` | Disconnecting Google and deleting the account |

### Cluster H: compare

| Page | Angle | Phase |
| --- | --- | --- |
| `/compare/simpledash-vs-google-analytics` | Not a rival: a simpler view of the same data. GA4's own screens are better for explorations, audiences and funnels | 2 |
| `/compare/simpledash-vs-looker-studio` | A ready dashboard vs building your own | 4 |
| `/compare/simpledash-vs-plausible` | They replace GA4 with their own script; SimpleDash keeps GA4 and its history. Pick them if you want to leave Google | 3 |
| `/compare/best-google-analytics-dashboards` | An honest list that includes others | 3 |
| `/compare/simpledash-vs-fathom`, `-simple-analytics`, `-umami`, `-datafast`, `-vercel-analytics` | Same honest angle (five pages) | 4 |
| `/compare/simple-analytics-for-indie-hackers` | An honest list | 4 |
| `/compare` (hub) | Which analytics tool fits a small site | 4 |

## 7. Phases

| Phase | What | Why now | Size |
| --- | --- | --- | --- |
| 0 | Foundations: the content system, search engines, AI crawler access, measurement, screenshots (section 7.1) | Pages are useless if they can't be found, read or measured | About a week of building |
| 1 | Trust and help: getting started, troubleshooting, reference, and the two setup guides the app links to | Launch traffic asks these first, and it cuts support | 14 pages |
| 2 | Product-fit guides, the glossary with its most asked terms, feature docs, and "SimpleDash vs Google Analytics" | Highest fit: traffic that turns into users | 29 pages |
| 3 | The GA4 setup cluster with platform pages, and more Search Console and revenue guides | Big demand, but each platform needs first-hand testing | 19 pages |
| 4 | The rest of the glossary and comparisons, hub texts, refreshes | Rounds out the clusters, once Search Console shows what works | About 30 pages |

At two or three pages a week (Claude drafts, Siamak checks), phases 1 and 2 take about four months. After each phase, review the numbers (section 11) and reorder the next phase by what Search Console shows.

**The first ten pages,** in order:

1. `/docs` (what it is and isn't)
2. `/docs/google-access`
3. `/docs/plans`
4. `/docs/data-and-security`
5. `/guides/add-google-analytics-to-website` (the "No Google Analytics site found" notice can link here instead of to Google's help)
6. `/docs/troubleshooting`
7. `/guides/ga4-ai-traffic`
8. `/guides/ga4-unwanted-referrals-stripe`
9. `/compare/simpledash-vs-google-analytics`
10. `/guides/check-ga4-is-working`

### 7.1 Phase 0 checklist

**The content system** is code, so it needs Siamak's approval and a spec section first (section 12).

**Search engines** (Siamak, free):

- Search Console: verify simpledash.app as a domain property and submit the sitemap.
- Bing Webmaster Tools: import the site from Search Console and submit the sitemap. Bing's index also feeds other assistants.
- Turn on Cloudflare's Crawler Hints, so search engines that use IndexNow (Bing among them) hear about new and changed pages at once.

**AI crawlers** (Siamak):

- Google says crawling must be allowed in robots.txt "and by any CDN or hosting infrastructure". In Cloudflare, go to Security settings → Configure AI bot policies and set:
  - **Search:** Allow.
  - **Agent:** Allow. These are assistants fetching a page for a person in real time.
  - **Training:** Siamak's call. Allowing it helps future models know SimpleDash, and the code is open source anyway.
- Cloudflare's defaults for new domains since Sept 15, 2026 block Training and Agent only on pages with ads, and we have none. Still, check the setting and Cloudflare's managed robots.txt.
- `robots.txt` already allows everything outside the app. Check that the new sections aren't disallowed, and don't block Google-Extended.

**Measurement** (needs approval: it's a code change to our own GA4, which runs only after consent):

- Send a `sign_up` key event on simpledash.app when a Google sign-in completes. Then signups by landing page work for our own site.
- Use our own SimpleDash dashboard for simpledash.app as the content dashboard: Landing pages, Sales and signups by source, AI traffic and Google search.

**Screenshots:**

- SimpleDash screenshots come from the `/ui-kit` previews on sample data, never real user data, made by script so they can be redone whenever the UI changes.
- GA4, Search Console and Stripe screenshots come from our own accounts, with IDs and emails cropped out.

## 8. Page templates

**Guide:**

1. The title is the question or task, in the searcher's words.
2. A two-sentence answer.
3. Before you start.
4. Numbered steps with screenshots, using the exact menu names.
5. Check it worked.
6. Common problems.
7. In SimpleDash: one short block, a screenshot and one call to action.
8. Related pages.
9. Sources (official links).
10. "Checked on <date>" and "Edit on GitHub".

**Glossary term:**

1. The term, and a one-sentence plain definition.
2. How GA4 counts it.
3. Where to find it in GA4.
4. What SimpleDash calls it.
5. Common confusions.
6. Related terms.
7. Source.

**Docs page:**

1. What it does, in one sentence.
2. Which plan has it (from `plans.ts`).
3. How to use it (steps).
4. What you'll see (a screenshot).
5. Limits and honest notes: what it doesn't do.
6. Related settings and troubleshooting.

**Troubleshooting section:**

1. The exact message as the heading.
2. What it means.
3. Why it happens.
4. How to fix it.
5. Still stuck: contact.

**Comparison:**

1. A short verdict: who should pick which.
2. A fact table, each fact dated and linked.
3. Where the other tool is better.
4. Where SimpleDash is better.
5. Prices: ours from `plans.ts`; theirs with a link and the date checked.
6. Using both, or switching.

**Writing rules** (as in the app):

- Plain words, short sentences, "you", no hype.
- No GA4 jargon without its plain word.
- Headings are the follow-up questions people ask (section 9).
- Tables for anything compared.
- Alt text that says what a screenshot shows.
- "section 16", never the section sign.

## 9. AI assistants and agents

**What Google says.** There are no extra requirements to appear in AI Overviews or AI Mode, and no special files, AI text files or markup are needed. The same SEO basics apply. Those features may answer by running several related searches across subtopics, and their traffic is counted in Search Console's Performance report, under the Web search type. So the work is the same as for search, plus the steps below for other assistants.

1. **Be crawlable.** Allow the AI bots in Cloudflare and robots.txt (section 7.1).
2. **Write what assistants quote:**
   - the two-sentence answer first
   - one-sentence definitions
   - facts with units and dates
   - comparison tables
   - sources linked
3. **Cover the follow-up questions on the same page,** each as its own heading ("Does it slow my site?", "Is it free?"). That matches how answers get put together from related searches.
4. **Offer a Markdown copy of every page** (`/docs/sites.md`, plus a "View as Markdown" link, as Cloudflare's docs do), so agents read clean text.
5. **Keep `llms.txt`, and add `llms-full.txt`** (every page in one file). Google says these files neither help nor hurt in Google Search; they are for other assistants and coding agents. Both get generated, so they cost nothing to keep.
6. **Write steps an agent can follow:**
   - exact menu names
   - complete copyable code blocks with the versions noted
   - a "check it worked" step an agent can verify (the page source contains the tag, Realtime shows the visit)
7. **Give copy-paste prompts.** Setup guides include a tested prompt for coding agents (cluster A), so our guide is the one agents follow.
8. **Use the same definition everywhere** (section 3), so every assistant learns the same thing.
9. **Get mentioned elsewhere** (section 10). Assistants learn from what the whole web says, not only from our site.
10. **Structured data:**
    - Use `Article` and `BreadcrumbList` on content pages, and keep `SoftwareApplication` on the landing page.
    - Don't add `FAQPage` for rich results: Google stopped showing FAQ rich results in May 2026.
    - Structured data must always match the visible text.

## 10. Distribution

Each page gets used, not only published.

- **In the app** (small UI changes, need approval):
  - The "No Google Analytics site found" notice links to our setup guide.
  - Every notice links to its troubleshooting section.
  - Card help can link to the matching docs or guide.
- **X:** each new guide becomes a short thread in Siamak's build-in-public posts.
- **Real questions:** answer them on Reddit, Indie Hackers and the Google Analytics community with the guide, only when it truly answers the question. Say it's ours.
- **Listings, done once and always with the section 3 definition:**
  - the GitHub README and repo topics
  - Product Hunt
  - Indie Hackers
  - Show HN (open source)
  - AlternativeTo
  - open-source lists and free SaaS directories
- **Public stats pages:** Free pages carry "Powered by SimpleDash", so every shared page is a link to us. `/guides/public-analytics-page` encourages people to turn one on.
- **Proof:** the live demo and simpledash.app's own public page show real numbers, not mockups.

## 11. Measurement and upkeep

**Tools,** all free and already ours:

- Search Console and Bing Webmaster Tools
- GA4 on simpledash.app, read in SimpleDash: landing pages, signups by source, AI traffic
- The monthly prompt check below

**Per page:** indexed or not, impressions, clicks, position, click rate, signups that started on the page, and visits from assistants.

**Rhythm:**

- **Weekly, 10 minutes:** new queries in Search Console. A query with impressions but no page is an idea; a page getting impressions with a low click rate gets a better title.
- **Monthly:** the prompt check, and a progress review of the current phase.
- **Quarterly:** redo every guide's steps and update its screenshots and "Checked on" date. GA4's screens change often.
- **After 6 months:** merge or remove pages with no impressions.
- **With every product change:** update the docs page in the same change (rules in section 15). Once the docs exist, this should join the definition of done in `CLAUDE.md`.

**Monthly prompt check.** Ask ChatGPT, Claude, Perplexity, Gemini and Google's AI Mode the same questions each month. Note whether SimpleDash is named, whether the facts are right, and which page is cited.

1. What's a simple dashboard for Google Analytics 4?
2. GA4 is too complicated. Is there an easier way to see my numbers?
3. How do I see ChatGPT and Perplexity traffic in GA4?
4. What's the best Google Analytics dashboard for indie hackers?
5. Is there a free, open-source GA4 dashboard?
6. What's a simpler alternative to Looker Studio for GA4?
7. How can I get a weekly email with my Google Analytics numbers?
8. How do I make a public analytics page for my startup?
9. Plausible or Google Analytics for a small SaaS?
10. Which traffic sources bring my Stripe revenue?
11. Why does Stripe show up as a referral in GA4?
12. How do I add Google Analytics to my Framer, Next.js or Lovable site?
13. What is SimpleDash? (is the definition right?)
14. Is SimpleDash safe, and what can it access? (are the trust facts right?)
15. How much does SimpleDash cost? (are the prices current?)

## 12. How it would be built

This is for the spec, once approved.

- **Content files:** MDX in `content/docs`, `content/guides`, `content/glossary` and `content/compare`. No CMS and no paid service (principle 8).
  - Frontmatter on every file: title, description, the two-sentence answer, updated, checked, cluster, related pages, sources.
  - Every page is static: no client JavaScript, Lighthouse 100.
- **Components that read the source of truth,** so content never types a fact the code owns:
  - Prices and limits from `plans.ts`.
  - Scopes from the auth code.
  - Freshness from `cache.ts`.
  - Plain words from one shared list.
  - Screenshots from the generated set.
  - Plus `Steps`, `Note` and `InSimpleDash` blocks.
- **Generated from the content:** hubs, breadcrumbs, sitemap entries (with the updated date), `llms.txt` links and `llms-full.txt`, the `.md` copies, Open Graph images, JSON-LD and "Edit on GitHub" links.
- **Tests:**
  - Every page has a title, description, answer and dates.
  - Every internal link works.
  - No price or limit is typed into content: a test fails on a dollar amount in a content file.
  - Theme tokens only.
- **A new dependency for MDX is likely** (`@next/mdx` is the official one). It gets its line in `docs/DECISIONS.md`.
- **Definition of done** for the system: Lighthouse 100 on a docs page and a guide, at 375 and 1440 px, plus a keyboard pass.

## 13. Ideas outside the roadmap

Each of these needs Siamak's OK; none is planned.

- **Free tools that rank and convert:**
  - A GA4 setup checker: paste an address, see whether the Google tag loads and respects consent.
  - A UTM link builder.
  - An "AI traffic in GA4" filter generator.
- **A gallery of opt-in public stats pages** ("open startups using SimpleDash"): links for users, proof for us.
- **The Monday email** could end with one tip that links a guide.
- **Other languages:** English only for now.

## 14. Next steps

1. **Siamak:** approve the plan, or cut parts of it.
2. **Claude:** write the spec section and checklist tasks, then build phase 0.
3. **Siamak:** set up Cloudflare's AI bot policies, Bing Webmaster Tools and the Search Console sitemap.
4. **Write phase 1,** starting with the first ten pages in section 7.

## 15. Rules for keeping content right (for Claude, every session)

Claude is the content captain: these rules apply whenever the product or a page changes.

**When a feature changes**

1. A product change isn't done until its docs page, the screenshots, `llms.txt` and any guide that mentions it are updated in the same change, with the "Checked on" date moved forward.
2. **Feature removed:** its page redirects (301, permanent) to the closest page, usually the docs hub or the feature that replaced it. Never leave a 404. Remove it from the hubs, menus, sitemap and `llms.txt`, and fix every link that pointed to it.
3. **Feature renamed:** keep the old address and change the text. Change the address only if the old one would mislead, and then 301 the old one to the new one.
4. **Feature added:** a docs page ships with it (or a section on an existing page), linked from its hub and from related pages.
5. **Plan or price change:** nothing to edit by hand: prices and limits come from `plans.ts` through components. Check the comparison and plans pages read right.

**Addresses**

6. Addresses are permanent. Choose them carefully once: short, lowercase, the words people search, no dates.
7. Every moved or removed address gets a 301 in one redirect list in the code, which a test checks (no chains, no loops, every target exists).
8. Merging two pages: keep the one with more search traffic and 301 the other into it.

**Updating pages**

9. Update in place. Same address, same page. Refresh the facts, steps and screenshots, then move the "Checked on" date. Never change the date without re-checking.
10. Don't rewrite a page that ranks well just to make it "fresh": change what's wrong or missing.
11. Pages with no impressions after 6 months get improved, merged (301) or removed (301 to the hub).

**Accuracy**

12. Never publish a step that wasn't done for real, a number that isn't from the code or an official source, or a claim about another product without a date and link.
13. Comparison pages get re-checked every quarter: other tools change their prices and features.
14. If a page is wrong and can't be fixed today, fix the wrong sentence first, even before the full update.

**Order**

15. Write first what won't change much (GA4 guides, glossary), and feature docs once the feature is settled.
16. The changelog is skipped for now (Siamak, Oct 15, 2026); add it once releases are regular.
17. Only one comparison early: "SimpleDash vs Google Analytics". The others wait for phase 4.

## Sources

All checked on Oct 15, 2026.

- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) (Google Search Central): no special files or markup for AI Overviews and AI Mode, crawling allowed by the CDN, traffic counted in Search Console.
- [Google Search's guidance on using generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content): fact-check AI drafts; the scaled content abuse policy.
- [Search Central documentation updates](https://developers.google.com/search/updates): FAQ rich results no longer shown (May 2026); `llms.txt` neither helps nor hurts in Google Search (June 2026).
- [Cloudflare: Block AI Bots and AI bot policies](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/): Search, Agent and Training categories, and the defaults from Sept 15, 2026.
- [Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/): seeing and allowing AI crawlers per service.
