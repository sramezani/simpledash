import { plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { formatPrice } from "@/lib/format";
import { monthsFreeOnYearly } from "@/lib/billing/prices";

/** llms.txt (docs/SPEC.md section 17): a short plain-text summary for AI assistants. */
export function llmsText(appUrl: string): string {
  const { starter, growth } = plans;
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
- A Monday email with last week's numbers.
- An optional public stats page.
- Zero setup: sign in with Google and ${brand.name} picks your GA4 site. Full history from day one.

## Pricing

- ${starter.name}: ${formatPrice(starter.prices.month)} a month or ${formatPrice(starter.prices.year)} a year (${monthsFreeOnYearly()} months free), VAT included. One GA4 site, no traffic limits, every feature. ${starter.trialDays}-day free trial, no card needed.
- ${growth.name}: ${formatPrice(growth.prices.month)} a month, coming soon. Adds several sites, Search Console, traffic alerts, mentions on the chart, revenue next to traffic, and asking your data in plain English.

## What ${brand.name} stores

Users and settings, encrypted Google access tokens, chart notes, public page settings and short-lived report summaries. Never visitor-level data.

## Links

- [Home](${appUrl}/): what ${brand.name} is, with a sample dashboard
- [Pricing](${appUrl}/#pricing): the plans and the free trial
- [Sign in](${appUrl}/signin): start with a Google account
- [Privacy policy](${appUrl}/privacy): what is stored and what is read from Google
- [Terms](${appUrl}/terms): billing, cancelling and refunds
- [Contact](mailto:${brand.supportEmail}): ${brand.supportEmail}
`;
}
