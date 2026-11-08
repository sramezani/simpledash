# Keyword research: search and AI assistants

Researched Nov 8, 2026, for Siamak. Goal: find the words people really type (into Google) and ask (ChatGPT, Claude, Perplexity, Gemini, Google AI Mode) when they need what SimpleDash does, and use them in the landing page, page titles and content.

This adds to `docs/CONTENT-PLAN.md` (which already sets the rules for every page).

**Built on Nov 8, 2026** (Siamak: "pick the best one"): title option 1 and headline option 1 (section 4), the six questions, sections 6 and 7 (the "how to read" page is the existing `/guides/understand-website-traffic`, retitled, so six new guides), and section 8.3 points 1, 2 and 6. What only Siamak can do is in section 11 and `docs/CHECKLIST.md`.

## 1. The short answer

1. **Our page title and headline use no word anyone searches for.** "Google Analytics, in a dash." has no "GA4", no "dashboard", no "simple" and no problem in it. Every competitor that ranks puts its category in the title (section 3).
2. **The words to own are "simple GA4 dashboard" and "Google Analytics made simple".** They are real searches, they describe exactly what we do, and they are not "Google Analytics alternative" (people searching that mostly want to leave Google, which is the wrong reader for us).
3. **New title:** `SimpleDash: Simple GA4 Dashboard, Free for All Your Sites` (57 characters). **New headline:** "Google Analytics, made simple." (or one of the options in section 4).
4. **The strongest feelings people search with are pain:** "why is ga4 so hard to use", "why is ga4 so bad", "i hate ga4", "how to read google analytics". We have no page for them yet. That is the biggest content gap (section 7).
5. **Our name is shared** with at least five other products (a Minecraft mod, simpledash.com, simpledash.co, simpledash.co.uk, and an old client-portal listing on simpledash.app). Assistants learn brands by name, so "SimpleDash" must always travel with "GA4 dashboard" (section 9).
6. **For AI assistants, the evidence says:** titles and paragraphs that match the questions people ask get cited more, and assistants name brands they already know. So: question-shaped titles, and being named on the "best GA4 dashboard" and "analytics for indie hackers" lists that assistants search (section 8).

## 2. How this was researched

- **Google autocomplete**, about 430 seed phrases (with a–z expansions), US English. Autocomplete only shows phrases that people really search, so every phrase marked as searched below came from it. Raw lists are not kept in the repo.
- **Search results** for about 25 key phrases (DuckDuckGo, which mostly shows Bing's results, the index ChatGPT's search is often said to lean on), plus the titles and headlines of 11 competitors.
- **Google's official guide** to generative AI search (updated Jul 10, 2026) and a study of 158,099 AI answers and 468,037 citations (arXiv 2610.15033, Oct 2026).

**What's missing: search volumes.** Exact monthly numbers need Google Keyword Planner (free with a Google Ads account) or a paid tool, and Google Trends refused automated requests. So nothing below guesses a number. Demand is "searched" (in autocomplete) or "not seen". Before writing a new page, check its main phrase in Keyword Planner and, once pages exist, in Search Console (as `docs/CONTENT-PLAN.md` section 4.3 already says).

## 3. Why the current title doesn't work

| | Title tag today | Has the category? |
| --- | --- | --- |
| **SimpleDash** | SimpleDash: Google Analytics, in a dash. | No |
| MetriBee | MetriBee: Open-Source GA4 Dashboard for All Your Sites | Yes |
| SitePulse | Simple GA4 Dashboard for Agencies | Yes |
| OwlInsight | OwlInsight: Simple Google Analytics Alternative | Yes |
| Ramprt | Free GA4 dashboard, the way Plausible shows it | Yes |
| BetterGA | BetterGA - Google Analytics, without the headache | Half (meta says "one-screen Google Analytics dashboard") |
| Plausible | Simple, privacy-friendly Google Analytics alternative | Yes |
| DataFast | Find out which marketing channels drive your revenue | Yes (a job, not a category) |

Three problems with "Google Analytics, in a dash.":

- **Nobody searches for it.** Google matches meaning, but the title is still the strongest signal of what a page is, and the study in section 8 found AI assistants cite pages whose titles match the question.
- **It is a pun on our own name.** It only works once you already know us. A hook works on a stranger.
- **It doesn't say the benefit or the pain.** People arrive confused by GA4 ("why is ga4 so hard to use"). The headline should meet them there.

**Also new:** GA4 itself now has a built-in "dashboard" (Google's help page "About Google Analytics dashboard": drag-and-drop score cards and charts, Editor role needed). So plain "GA4 dashboard" will mean Google's own builder more and more. Our edge is **ready-made, nothing to build**, which belongs in the subheadline.

## 4. New landing title, headline and description

The `<title>` and the visible headline can be different. The title is for search and assistants (keywords), the headline is for people (the hook). Today both come from `brand.tagline`.

**Title tag** (pick one; my pick first):

1. `SimpleDash: Simple GA4 Dashboard, Free for All Your Sites` (57 characters)
2. `SimpleDash: Google Analytics made simple, on one page` (53)
3. `Simple Google Analytics dashboard for GA4 · SimpleDash` (55)

**Headline (H1)** (my pick first):

1. **Google Analytics, made simple.** Plain, matches "google analytics made simple / easy", keeps the shape of the old line.
2. **Your GA4 numbers, finally easy to read.** Speaks to "how to read ga4".
3. **GA4 is hard. Your numbers don't have to be.** The strongest hook; meets the pain head on.

**Subheadline** (157 characters), with the searched words in it:

> A simple GA4 dashboard for all your sites. See visitors, where they came from, top pages and signups on one page. No tracking script, nothing to build. Free.

**Meta description** (150 characters), an "X is a Y" sentence assistants can quote:

> SimpleDash is a simple dashboard for Google Analytics 4 (GA4). Sign in with Google and see visitors, sources, top pages and signups on one page. Free.

**The pill above the headline** stays: "Works with the Google Analytics 4 you already have".

**Questions section:** rename "Questions" to "Questions about SimpleDash and GA4", and add these, each written the way people search it (they are what the search results and autocomplete show people asking):

- Is SimpleDash a Google Analytics alternative? (No: it's a simpler way to read the GA4 you have. Catches "simple google analytics alternative" honestly.)
- GA4 has its own dashboard now. Why use SimpleDash? (Nothing to build, plain words, all sites, the Monday email.)
- Can I see all my GA4 sites in one place?
- Can I get a weekly Google Analytics report by email?
- How is it different from a Looker Studio template?
- Can I share my Google Analytics stats publicly?

**Where it changes:** the headline is written in `docs/ROADMAP.md` ("H1 Google Analytics, in a dash."), which is Siamak's brief, and in `docs/SPEC.md`, `README.md` and the GitHub repo description. Siamak edits the roadmap; the rest follows. In code, add a separate title to `brand` in `src/config/theme.ts` so the title and headline can differ.

## 5. The keyword map

**Fit** is how directly SimpleDash answers it (3 = a feature is the answer). **Competition** is from what the first results look like today: high (big brands and many guides), medium (vendor blogs), low (thin or old pages). All phrases are from autocomplete unless marked "seen in results".

### 5.1 Core: what SimpleDash is (the landing page)

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| simple ga4 dashboard / simple google analytics dashboard | Find a tool | 3 | Medium (MetriBee, SitePulse, Ramprt, BetterGA) |
| google analytics made simple / made easy, easy google analytics | Find a tool or a guide | 3 | Medium |
| simple google analytics, google analytics simple | Find a tool | 3 | Medium |
| ga4 dashboard, ga4 dashboard free, google analytics dashboard free | Mixed: tool, template, Google's own | 3 | High |
| ga4 analytics dashboard, google analytics dashboard tool | Find a tool | 3 | Medium |
| google analytics simple alternative, simple google analytics alternative | Mostly leaving Google | 2 | High |

### 5.2 Pain: "GA4 is too hard" (biggest gap)

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| why is ga4 so hard to use, why is ga4 so bad, i hate ga4 | Vent, look for a way out | 3 | Medium (vendor blogs: Clickport, Graphed, Zenovay) |
| is ga4 easy to learn, is google analytics hard to learn | Decide whether to bother | 3 | Low to medium |
| google analytics too complicated (seen in results) | Same | 3 | Medium |
| how to read google analytics (report, dashboard, data), how to read ga4 reports | Learn | 3 | High |
| how to understand google analytics, what to look at in google analytics, what to check in google analytics | Learn the few numbers that matter | 3 | Medium |
| ga4 key metrics, ga4 important metrics, ga4 metrics explained | Learn | 3 | Medium |

### 5.3 Beginners: "how many people visit my site"

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| how many people visited my website, how to see how many people visit my website | Answer one question | 3 | Medium |
| how to see website traffic in google analytics, how to check website visitors in google analytics | Learn | 3 | Medium |
| how to see where website traffic is coming from | Learn | 3 | Medium |
| check my website traffic (free), see website traffic | Find a checker (often a competitor's site) | 1 | High (Semrush, Similarweb) |

### 5.4 All my sites in one place

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| ga4 multiple properties one dashboard (seen in results), ga4 multiple domains | Find a way | 3 | Medium (MetriBee, StatPilot, small blogs) |
| google analytics for multiple websites, dashboard for multiple websites | Find a way | 3 | Medium |

Free already covers all sites with no limit. Say so in the title and on this page.

### 5.5 Looker Studio and Google's own dashboard

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| looker studio ga4 template (free), ga4 dashboard looker studio | Want a ready dashboard | 3 | High (template sellers) |
| looker studio slow / very slow, looker studio alternatives | Frustrated | 2 | Medium |
| ga4 dashboard template / examples / sample | Want a ready dashboard | 3 | High |
| ga4 dashboard without looker studio (seen in results) | Want a ready dashboard | 3 | Low |

### 5.6 Weekly report by email (the Monday email)

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| google analytics weekly report, google analytics email report | Get it in the inbox | 3 | Medium (MonsterInsights, Analytify, Databox) |
| google analytics automated email reports, automated google analytics report, google analytics send report email | Same | 3 | Medium |

### 5.7 Sharing and public stats

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| share google analytics (dashboard, report, access, with someone), how to share ga4 report | Give someone a view | 3 | Medium |
| embed google analytics dashboard in website, how to publicly display google analytics data (seen in results), public website analytics | Show numbers publicly | 3 | Low (old Stack Overflow, dev blogs) |
| open startup, build in public (seen in results) | Learn the idea | 2 | Low to medium |

### 5.8 AI traffic

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| how to track chatgpt traffic in ga4, how to check chatgpt traffic in ga4, how to track traffic from chatgpt | Learn | 3 | High (many guides in 2026) |
| ai traffic google analytics, llm traffic ga4, track llm traffic in ga4, chatgpt referral traffic | Learn | 3 | High |

### 5.9 Revenue and customers (Pro)

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| google analytics stripe, stripe google analytics integration | Connect them | 3 | Medium |
| which marketing channel brings customers, revenue by source (seen in results, DataFast's whole pitch) | Find the channel | 3 | Medium |

### 5.10 Comparisons and lists

| Phrase | Intent | Fit | Competition |
| --- | --- | --- | --- |
| best analytics tools for saas / for startups, best analytics for indie hackers (seen in results) | Pick a tool | 2 | Medium |
| ga4 alternatives (free, reddit, open source), best ga4 alternatives | Leave GA4 | 1 | High |
| plausible vs google analytics, umami vs google analytics, fathom alternatives, datafast alternative | Compare | 2 | Medium |

### 5.11 Signals, not for now

- **connect google analytics to claude / ga4 connect to claude / google analytics ai summary:** searched, with many 2026 guides. SitePulse, MetriBee, DataFast and Clickport all pitch "ask your AI about your traffic". SimpleDash has no such feature, so this is only an idea (section 10).
- **google analytics iphone app / widget iphone / app for mac:** searched. The dashboard works on phones; a short guide could rank, but fit is lower.

## 6. Retitle existing pages

Small changes that match the searched phrasing better. Addresses stay the same (no redirects needed).

| Page | Today | Suggested |
| --- | --- | --- |
| `/guides/public-analytics-page` | How to share your website stats publicly | How to share your Google Analytics stats publicly |
| `/compare/simple-analytics-for-indie-hackers` | Simple analytics for indie hackers: the options | Best analytics for indie hackers: simple options compared |
| `/compare/simpledash-vs-looker-studio` | SimpleDash vs Looker Studio for GA4 dashboards | A Looker Studio alternative for GA4: SimpleDash vs Looker Studio |
| `/compare/best-google-analytics-dashboards` | The best Google Analytics 4 dashboards for small sites | Best GA4 dashboards for small sites, with no template to build |
| `/guides/ga4-ai-traffic` | How to see ChatGPT, Perplexity and Claude traffic in GA4 | How to track ChatGPT, Perplexity and Claude traffic in GA4 |
| `/docs/sites` | Switch between your Google Analytics sites | All your Google Analytics sites in one place |

Also update `best-google-analytics-dashboards` itself: add GA4's own new built-in dashboard and the GA4-on-top tools that now rank (MetriBee, BetterGA, OwlInsight, SitePulse, Ramprt), honestly and dated, as the content plan's comparison rules say. That list is the kind of page assistants search for "best GA4 dashboard" (section 8), so it must be the most complete one on the web.

## 7. New pages worth writing

Ranked by fit, gap and how directly they lead to signing in. Each is one question (content plan section 4.4, rule 1). Check the main phrase in Keyword Planner first.

1. **`/guides/ga4-too-complicated`: "Why is GA4 so hard to use? And the 5 numbers to look at instead."** The pain cluster (5.2). Must be first-hand and non-commodity (Google's guide asks for exactly that): what changed from Universal Analytics, the renamed words (conversions became key events on Mar 21, 2024), which 5 numbers a small site needs and where each one hides in GA4, then the same in SimpleDash.
2. **`/guides/how-to-read-google-analytics`: "How to read Google Analytics: what to look at, and what to ignore."** The "how to read / what to look at / key metrics" cluster. Different question from page 1 (how, not why). Links to the glossary.
3. **`/guides/see-website-traffic-google-analytics`: "How to see how many people visit your website in Google Analytics."** The beginners cluster (5.3), with exact GA4 menu steps and screenshots.
4. **`/guides/google-analytics-weekly-email-report`: "How to get a weekly Google Analytics report by email."** GA4's own scheduled emails, step by step, honestly (they exist, they're raw), then the Monday email.
5. **`/guides/ga4-multiple-properties-one-dashboard`: "How to see all your GA4 sites in one dashboard."** Cluster 5.4.
6. **`/guides/share-google-analytics`: "How to share Google Analytics: give access, send a report, or make a public page."** Cluster 5.7; links to the public page guide, which keeps the "publicly" question.
7. **`/guides/ga4-built-in-dashboard`: "How to use GA4's new built-in dashboard (and when it's not enough)."** An honest how-to on Google's own feature, which will soon own "ga4 dashboard". Better to be the best guide to it than to pretend it doesn't exist.

Later, if demand checks out: checking Google Analytics on an iPhone, and connecting Stripe to Google Analytics.

## 8. Generative engine optimisation (AI assistants)

### 8.1 What the evidence says

- **Google:** "optimizing for generative AI search is optimizing for the search experience, and thus still SEO." AI Overviews and AI Mode retrieve pages with the normal ranking systems, then run "fan-out" searches on related subtopics. What helps: unique first-hand content ("non-commodity"), clear headings, crawlable pages. What doesn't matter for Google: llms.txt, special markup, "chunking", rewriting for AI, inauthentic mentions. Making a page per question variation to game it breaks the scaled content abuse policy.
- **Google, two practical things:** a site must be included in "Search generative AI features" in Search Console to appear in them, and the **Generative AI performance report** in Search Console measures it.
- **The citation study** (158,099 answers, 468,037 citations, ChatGPT, Gemini, Perplexity):
  - Within one site, **pages whose title and paragraphs match the questions people ask are cited more.** FAQ blocks, structured data, summary boxes and speed only helped across sites, not between pages of one site.
  - What a page is cited for depends mostly on whether the assistant's own rewritten searches find it (32% of the difference, against 2.8% for page properties). Those searches rarely match Google's or Bing's results.
  - **ChatGPT writes brands it already knows into its searches**, prefers sites it knows, and names brands with no page behind them. Brand names alone changed its rankings of products with identical facts.
- **Reddit:** one tracking firm (Otterly) reports ChatGPT cut Reddit citations by at least 73% in Aug 2026. Treat Reddit as a place to help people, not a citation trick.
- **llms.txt:** 2026 studies agree it does little for AI search visibility; it helps coding agents read docs. We already have `llms.txt`, `llms-full.txt` and a Markdown copy of every page, which is the right amount.

### 8.2 What we already do well

AI crawlers can read the site (checked: GPTBot, ClaudeBot and PerplexityBot get 200, robots.txt allows all content). Two-sentence answers first, comparison pages, one definition everywhere, Markdown copies, `Article` and `BreadcrumbList` data, dated facts. This is ahead of most competitors.

### 8.3 What to do

1. **Question-shaped titles and headings.** The single best-supported tactic. Section 6 and 7 titles already follow it. Every H2 on a guide should be a question someone asks ("Does it slow my site?").
2. **Teach assistants what SimpleDash is, in one "X is a Y" sentence.** Start the definition (content plan section 3) with the category: "SimpleDash (simpledash.app) is a simple dashboard for Google Analytics 4 (GA4)." Then the existing sentence. Use it in the meta description, GitHub, X bio, AlternativeTo, Product Hunt and every listing.
3. **Get named on the lists assistants search.** For "best GA4 dashboard", "simple Google Analytics", "analytics for indie hackers", the results today are listicles: Analytify, MetricsWatch (10 GA4 templates compared), StatPilot (multi-property dashboards compared), Usefold and Sleek (indie hacker tools), Seline and The CTO Club (alternatives), and the "awesome-google-analytics-alternatives" list on GitHub. Write to their authors, honestly, asking to be considered; open a pull request on the GitHub list. Real mentions, not paid or fake ones.
4. **Be the best answer to the "fan-out" questions.** When someone asks "what's a simple way to read my GA4", assistants also search "ga4 key metrics", "ga4 too complicated", "looker studio ga4 template". The new pages in section 7 cover exactly those.
5. **Non-commodity content only we can write.** Siamak's own numbers from simpledash.app's own GA4 (the public page is already real), what we learned building on the GA4 Data API, first-hand screenshots with "Checked on" dates. Never visitor data from users (principle 3).
6. **Add `Organization` structured data with `sameAs`** (GitHub, X, AlternativeTo) and `alternateName` on `SoftwareApplication`. It helps tell our SimpleDash apart from the others (section 9). Not a ranking trick; Google says structured data is optional for AI features.
7. **Bing Webmaster Tools and IndexNow.** Free, a few minutes, and several assistants use Bing's index. Nothing in the repo sets them up yet. (The content plan already lists Bing Webmaster Tools for keyword research.)
8. **Turn on "Search generative AI features" in Search Console** if it isn't, and watch the Generative AI performance report.

### 8.4 What to skip

New AI text files beyond what we have, FAQ markup for rich results (Google stopped showing them), pages for every phrasing of one question, paid "GEO tools" that claim to know Google's internals, and buying mentions.

## 9. The name problem

Searching "simpledash" shows a Minecraft mod, simpledash.com (a HighLevel guide), simpledash.co (a new tab extension), simpledash.co.uk (custom AI dashboards), GitHub projects, and a Founderkit listing describing simpledash.app as "a comprehensive client management solution" (an old product on our domain). Our AlternativeTo page and GitHub repo do show up for "simpledash.app".

What to do:

- Always pair the name with the category: "SimpleDash, the simple GA4 dashboard". In the title, the GitHub repo description (today "Google Analytics, in a dash."), its topics, the X bio and every listing.
- Ask Founderkit to update or remove the old "client management" listing; it teaches assistants the wrong thing about our domain.
- Organization `sameAs` (8.3 point 6).

## 10. Ideas outside the roadmap

Logged in `docs/STORY.md` too.

- **Ask an AI about your numbers.** "connect google analytics to claude" is searched, and four competitors sell it. SimpleDash could offer a read-only MCP server over the same cached reports. Needs a roadmap decision.

## 11. Next steps

**Needs Siamak:**

1. Pick a title tag and headline (section 4) and update `docs/ROADMAP.md`'s H1 line. Then the spec, README, code (`src/config/theme.ts`, a separate title), the OG image and the GitHub description follow.
2. Yes or no to the six retitles (section 6) and the seven new pages (section 7).
3. Check the main phrase of each new page in Google Keyword Planner before it's written.
4. Search Console: "Search generative AI features" on; Bing Webmaster Tools and IndexNow set up.
5. Outreach to the lists in 8.3 point 3, and the Founderkit fix.

**How to measure** (with the content plan's section 11):

- Search Console: impressions and clicks per new page, and the Generative AI performance report.
- SimpleDash's own AI traffic card on simpledash.app: visits from ChatGPT, Perplexity, Claude, Gemini.
- Once a month, ask ChatGPT, Claude, Perplexity, Gemini and Google AI Mode these questions in a fresh chat, and write down whether SimpleDash is named and which page is cited:
  1. What's a simple dashboard for Google Analytics 4?
  2. GA4 is too complicated. Is there an easier way to see my numbers?
  3. How can I see all my GA4 sites in one place?
  4. What's a free alternative to a Looker Studio template for GA4?
  5. How do I get a weekly Google Analytics report by email?
  6. What analytics should an indie hacker use?
  7. How can I share my website stats publicly?
  8. How do I see ChatGPT traffic in GA4?
  9. What is SimpleDash? (checks the name problem)
  10. SimpleDash vs Plausible?

## 12. Second round: questions people ask (Nov 8, 2026)

Siamak asked for the six standard sources, done carefully. What the first round missed is now covered.

### 12.1 What was done

| Source | How | Result |
| --- | --- | --- |
| Google autocomplete with how, why, what, when, which, can, does, is, where | 16 core topics × 15 question starts, plus "vs", "not" and "without" (288 seeds, about 2,300 phrases) | Done |
| Google "People also ask" | Real Google results in Siamak's Chrome (US English), 20 searches | Done. Google now shows an "AI Mode reply" first on most of these searches, and "People also ask" appeared on about half |
| Google "related searches" | The same 20 searches | Done |
| Competitors | Headings of 9 competitor guides on the same questions | Done |
| Reddit | `site:reddit.com` searches on Google (Reddit itself blocks automated reading, so the wording comes from titles and snippets) | Done |
| AI engines | Google AI Mode and ChatGPT (Siamak's account, web search on); Perplexity needed a sign-in | Done |

### 12.2 What people ask that we didn't answer

| Question, in their words | Where it came from | What we do |
| --- | --- | --- |
| What's the difference between Google Analytics and Search Console? Is Search Console part of Google Analytics? Can you use them together? | Autocomplete (many "vs" and "is … the same as" forms), People also ask, ChatGPT's list | **New page** `/guides/google-analytics-vs-search-console` |
| What is GA4, what is it used for, is it free, is it the same as Google Analytics, what can it tell you? | People also ask, autocomplete, the first questions in both AI engines' lists | **New page** `/guides/what-is-google-analytics-4` |
| Does GA4 filter out bot traffic? How do I filter suspected bots? | Autocomplete, People also ask, related searches | **New page** `/guides/ga4-bot-traffic` |
| Users vs sessions vs views: what's the difference, which should I use, what counts as a session? | Autocomplete (about 15 "vs" forms), People also ask, ChatGPT's list | The glossary page on sessions gets a question title and a fuller comparison (one page, not two) |
| "All I want to see is unique visitors", "how many visits each page got", daily average visitors, today, this month vs last, countries, mobile or desktop | Reddit titles and snippets, ChatGPT's list | New sections in `/guides/see-website-traffic-google-analytics` |
| How do I add a second website to Google Analytics? Can I see several Google accounts in one dashboard? | People also ask, a competitor's questions | New sections in the all-sites guide |
| How do I share a report with someone who has no access? How do agencies manage client access? | People also ask, result titles | New sections in the sharing guide |
| Can GA4 show traffic from Google's AI Overviews or AI Mode? | Autocomplete ("how to track ai overview traffic in ga4") | Its own question heading in the AI traffic guide |
| Do I need Google Analytics for my small website? Is it worth it? | People also ask, autocomplete | The "worth learning" heading in the GA4-is-hard guide becomes this question |

Already covered and checked against the new questions: key events, data delay, numbers that differ, cookie banners, direct and unassigned traffic, (not set), engagement and bounce rate, measurement ID and setup, Looker Studio.

### 12.3 What the AI engines say today

- **Asked by name** ("What is SimpleDash (simpledash.app)?"), Google AI Mode describes us correctly: an open-source, read-only GA4 dashboard, no script, all sites, public pages. The definition work is reaching it.
- **Asked by category** ("GA4 is too complicated, is there an easier way?", "a simple GA4 dashboard for a small site", "all my GA4 sites in one dashboard"), Google AI Mode doesn't name us. It answers in three paths: switch to Plausible or Fathom; keep GA4 and use Looker Studio, Site Kit or MonsterInsights (citing Reddit's r/webdev); or Cloudflare's own analytics. The "keep GA4, simpler view" path is the one to win, and it is built from Reddit threads and lists.
- **ChatGPT** ("I already use GA4 but it's too complicated; what tools give me a simple dashboard without a new script?") named SimpleDash first, citing simpledash.app, then Owl Insight, AnalyticsMade and Calm Analytics. It ran in Siamak's own signed-in account, which may lean on his history: check again signed out.
- **Both engines' "20 beginner questions"** lists match what the pages now cover. The ones not ours to answer (Google Ads linking, Tag Manager, event parameters) stay out.

### 12.4 Other findings

- **"… reddit" is a related search on almost every query** ("ga4 users vs sessions reddit", "why is ga4 so hard to use reddit"). People want answers from other people. Helpful, honest Reddit answers that link the right guide are worth more than another page.
- **"does google analytics have mcp", "does ga4 have a claude connector", "how to connect search console to claude"** are searched. Still only an idea (section 10).
- **WordPress plugins** (Site Kit by Google, MonsterInsights) are what AI Mode suggests for "keep GA4, simpler". The dashboards list now names them honestly.

## Sources

- Google: [Known bot-traffic exclusion](https://support.google.com/analytics/answer/9888366)
- Google: [Connect Search Console to Google Analytics](https://support.google.com/analytics/answer/10737381)

- Google Search Central, "Optimizing your website for generative AI features on Google Search", updated Jul 10, 2026: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Analytics Help, "About Google Analytics dashboard": https://support.google.com/analytics/answer/17217303
- "What Drives AI Citations? Content, Retrieval and Model…", arXiv 2610.15033, Oct 10, 2026: https://arxiv.org/abs/2610.15033
- Otterly, "ChatGPT cut Reddit citations by at least 73% in August 2026": https://otterly.ai/blog/chatgpt-reddit-citations/
- Competitor pages read Nov 8, 2026: metribee.com, sitepulseanalytics.com, owlinsight.dev, ramprt.io, better-ga.com, clickport.io, datafa.st, plausible.io, usefathom.com
- Reddit r/GoogleAnalytics: "How can GA4 become so difficult to read?" and "Honestly GA4 has terrible UX"
