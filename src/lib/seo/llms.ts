import { FREE_HISTORY_DAYS, plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { formatPrice } from "@/lib/format";
import { monthsFreeOnYearly } from "@/lib/billing/prices";

/** llms.txt (docs/SPEC.md section 17): a short plain-text summary for AI assistants. */
export function llmsText(appUrl: string): string {
  const { free, pro } = plans;
  return `# ${brand.name}

> ${brand.name} turns the Google Analytics 4 data a site already has into one simple dashboard page, a weekly Monday email and an optional public stats page. There is no tracking script: it reads GA4 with read-only access.

${brand.name} is for indie hackers, solo founders and small SaaS or content sites that already run GA4 and find it confusing. It is not for people leaving Google for privacy reasons, or for teams that need per-visitor journeys or session replay.

## Features

- One-page dashboard: visitors, page views, average time and signups with % change; a visitors chart; sources and channels; top pages and landing pages; countries; devices.
- AI traffic: visitors from ChatGPT, Perplexity, Claude, Gemini and other assistants, and the pages they landed on.
- Actions: downloads, outbound clicks, form submits and signups.
- A live globe of visitors right now.
- A plain-words summary of what changed, built only from the numbers.
- Chart notes and CSV download on every card.
- A Monday email with last week's numbers, one block per site.
- An optional public stats page per site.
- On ${pro.name}: several sites, 12 months and any dates, the Monday email, Google search insights (searches close to page 1, what changed, your name vs new people, pages seen but not clicked, searches that lead to signups), revenue and new customers from Stripe, and sales by source.
- Zero setup: sign in with Google and ${brand.name} picks your GA4 site, with the history GA4 already has.
- Open source under the AGPL-3.0 license.

## Pricing

- ${free.name}: ${formatPrice(0)}, no card needed, no time limit. One GA4 site, the last ${FREE_HISTORY_DAYS} days, no traffic limits, a public stats page.
- ${pro.name}: ${formatPrice(pro.prices.month)} a month or ${formatPrice(pro.prices.year)} a year (${monthsFreeOnYearly()} months free), tax included. Up to ${pro.limits.sites} sites with an All sites overview, 12 months and any dates, the Monday email, Google search insights from Search Console, revenue from Stripe (read-only) and sales by source.

## What ${brand.name} stores

Users and settings, encrypted Google access tokens, chart notes, public page settings and short-lived report summaries (from Google Analytics, and from Search Console when it's connected), and, if a ${pro.name} user connects Stripe with a read-only key, that key encrypted and daily revenue totals. Never visitor-level or customer-level data.

## Links

- [Home](${appUrl}/): what ${brand.name} is, with a live demo
- [Live demo](${appUrl}/demo): a real public stats page made with ${brand.name}
- [Pricing](${appUrl}/#pricing): ${free.name} and ${pro.name}
- [Sign in](${appUrl}/signin): start with a Google account
- [Privacy policy](${appUrl}/privacy): what is stored and what is read from Google
- [Terms](${appUrl}/terms): billing, cancelling and refunds
- [Contact](mailto:${brand.supportEmail}): ${brand.supportEmail}
`;
}
