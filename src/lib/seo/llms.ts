import { FREE_HISTORY_DAYS, plans } from "@/config/plans";
import { brand } from "@/config/theme";
import { formatPrice } from "@/lib/format";
import { monthsFreeOnYearly } from "@/lib/billing/prices";

/** A docs page, guide, glossary term or comparison, as llms.txt lists it. */
export type LlmsContentPage = { section: string; title: string; url: string; description: string };

const SECTION_TITLES: Record<string, string> = {
  docs: "Docs: how SimpleDash works",
  guides: "Guides: Google Analytics, Search Console and Stripe",
  glossary: "Glossary: GA4 terms in plain words",
  compare: "Compare",
};

/** The content pages, grouped by section, each with its Markdown copy (docs/SPEC.md section 30). */
function contentSections(appUrl: string, pages: LlmsContentPage[]): string {
  return Object.entries(SECTION_TITLES)
    .map(([section, heading]) => {
      const inSection = pages.filter((p) => p.section === section);
      if (inSection.length === 0) return "";
      const lines = inSection.map(
        (p) =>
          `- [${p.title}](${appUrl}${p.url}) ([Markdown](${appUrl}${p.url}.md)): ${p.description}`,
      );
      return `\n## ${heading}\n\n${lines.join("\n")}\n`;
    })
    .join("");
}

/** llms.txt (docs/SPEC.md section 17): a short plain-text summary for AI assistants. */
export function llmsText(appUrl: string, pages: LlmsContentPage[] = []): string {
  const { free, pro } = plans;
  return `# ${brand.name}

> ${brand.name} turns the Google Analytics 4 data a site already has into one simple dashboard page, a weekly Monday email and an optional public stats page. There is no tracking script: it reads GA4 with read-only access.

${brand.name} is for indie hackers, solo founders and small SaaS or content sites that already run GA4 and find it confusing. It is not for people leaving Google for privacy reasons, or for teams that need per-visitor journeys or session replay.

## Features

- One-page dashboard: visitors, page views, average time and signups with % change; a visitors chart; sources and channels; top pages and landing pages; countries; devices.
- AI traffic: visitors from ChatGPT, Perplexity, Claude, Gemini and other assistants, and the pages they landed on.
- Actions: downloads, outbound clicks, form submits and signups.
- A live globe of visitors right now.
- What changed and where: the sources and landing pages behind a change, built only from the numbers.
- Chart notes and CSV download on every card.
- A Monday email with last week's numbers, one block per site.
- An optional public stats page per site.
- On ${pro.name}: 12 months and any dates, the Monday email, what brings customers (where the people behind signups and sales first found you, next to the visit it happened on), what moved signups and sales, Google search insights (pages that bring signups and their searches, searches close to page 1, what changed, your name vs new people, pages seen but not clicked) with one page to work on each week, and revenue and new customers from Stripe.
- Zero setup: sign in with Google and ${brand.name} picks your GA4 site, with the history GA4 already has.
- Open source under the AGPL-3.0 license.

## Pricing

- ${free.name}: ${formatPrice(0)}, no card needed, no time limit. All your GA4 sites, switched with one click, the last ${FREE_HISTORY_DAYS} days, no traffic limits, a public stats page.
- ${pro.name}: ${formatPrice(pro.prices.month)} a month or ${formatPrice(pro.prices.year)} a year (${monthsFreeOnYearly()} months free), tax included. Everything in ${free.name}, plus 12 months and any dates, the Monday email, what brings customers (first and last visit), Google search insights from Search Console with one page to work on each week, and revenue from Stripe (read-only).

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
- [Everything in one file](${appUrl}/llms-full.txt): every docs page and guide as Markdown
${contentSections(appUrl, pages)}`;
}
