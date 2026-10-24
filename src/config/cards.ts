/**
 * The card list (docs/SPEC.md sections 4, 11 and 15). It feeds the dashboard, the
 * public page, the card picker in settings and the CSV route. No other list of cards exists.
 * Plain values only: the code that renders each card lives in src/components/cards.
 */

const COUNT_HELP =
  "Visitors that Google Analytics counted. People who refuse cookies or block GA aren't included.";

export const cards = [
  {
    // Shown only in the weekly email now; the pages show the numbers alone (Siamak, 12 Oct).
    id: "summary",
    title: "Summary",
    help: "What changed, worked out from the numbers. No guesses about why.",
    csv: false,
    publicAllowed: false,
    publicDefault: false,
  },
  {
    // Owner only, under the four numbers (docs/SPEC.md section 31.2).
    id: "what-changed",
    title: "What changed",
    help: "Which sources moved a number against the period before, and the landing pages behind each move. For Google, the searches whose clicks moved, from Search Console (a few days behind). Counts from Google only; no guesses about why.",
    csv: false,
    publicAllowed: false,
    publicDefault: false,
  },
  {
    id: "visitors",
    title: "Visitors",
    help: COUNT_HELP,
    csv: true,
    publicAllowed: true,
    publicDefault: true,
  },
  {
    id: "page-views",
    title: "Page views",
    help: "How many times your pages were viewed. One visitor can view many pages.",
    csv: true,
    publicAllowed: true,
    publicDefault: true,
  },
  {
    id: "avg-time",
    title: "Avg. time",
    help: "How long a visitor spends with your site open and in view, on average.",
    csv: true,
    publicAllowed: true,
    publicDefault: false,
  },
  {
    id: "signups",
    title: "Signups",
    help: "How many times the action you picked as a signup happened.",
    csv: true,
    publicAllowed: true,
    publicDefault: false,
  },
  {
    id: "chart",
    title: "Visitors over time",
    help: `${COUNT_HELP} The last part is dashed while it is still filling up (today, or yesterday that Google is still adding to).`,
    csv: true,
    publicAllowed: true,
    publicDefault: true,
  },
  {
    id: "sources",
    title: "Sources",
    help: "Where visitors came from. Direct means they typed your address or used a bookmark.",
    csv: true,
    publicAllowed: true,
    publicDefault: true,
  },
  {
    id: "ai",
    title: "AI traffic",
    help: "Visitors who came from AI assistants such as ChatGPT, Perplexity and Claude. Google's AI Overviews count as Google search.",
    csv: true,
    publicAllowed: true,
    publicDefault: false,
  },
  {
    id: "pages",
    title: "Pages",
    help: "Top pages by views. Landing pages are where visits started.",
    csv: true,
    publicAllowed: true,
    publicDefault: true,
  },
  {
    id: "countries",
    title: "Countries",
    help: `${COUNT_HELP} Places come from the visitor's network, so a city can be a nearby one.`,
    csv: true,
    publicAllowed: true,
    publicDefault: true,
  },
  {
    id: "devices",
    title: "Devices",
    help: `${COUNT_HELP} Browsers, systems and devices as Google Analytics names them; in-app browsers (like Instagram's) are listed on their own.`,
    csv: true,
    publicAllowed: true,
    publicDefault: false,
  },
  {
    id: "actions",
    title: "Actions",
    help: "Downloads, outbound clicks, form submits and signups that Google Analytics recorded.",
    csv: true,
    publicAllowed: false,
    publicDefault: false,
  },
  {
    // Pro with Stripe connected (docs/SPEC.md section 28.3). Private: never on public pages.
    id: "revenue",
    title: "Revenue",
    help: "What customers paid through Stripe minus refunds, before Stripe's fees, in your main currency. Read from your Stripe account (read-only) and counted in your site's time zone. MRR is the monthly price of active and past-due subscriptions, before discounts, at the last sync.",
    csv: false,
    publicAllowed: false,
    publicDefault: false,
  },
  {
    id: "customers",
    title: "New customers",
    help: "Customers Stripe created in this period. “1 per 412 visitors” is visitors divided by new customers, for the same days.",
    csv: false,
    publicAllowed: false,
    publicDefault: false,
  },
  {
    id: "sales",
    title: "What brings customers",
    help: "Signups and sales that Google Analytics recorded. First: where the person came from the first time GA4 saw their browser. Last: where the visit with the signup or sale came from; GA4 skips direct visits there when it knows an earlier source. Someone who changes device or clears cookies starts over. Revenue is GA4's own purchase value, shown only when GA4 has one.",
    csv: false,
    publicAllowed: false,
    publicDefault: false,
  },
  {
    id: "live",
    title: "Right now",
    help: "Visitors in the last 30 minutes, the last number of the overview. Click it for the live view: a globe of places, the pages they're on (by page title), devices and actions. Places on the globe: GeoNames, CC BY 4.0.",
    csv: false,
    publicAllowed: true,
    publicDefault: false,
  },
] as const;

export type Card = (typeof cards)[number];
export type CardId = Card["id"];

export const cardById = Object.fromEntries(cards.map((c) => [c.id, c])) as Record<CardId, Card>;

export const publicCardIds = cards.filter((c) => c.publicAllowed).map((c) => c.id);
export const defaultPublicCardIds = cards.filter((c) => c.publicDefault).map((c) => c.id);
export const csvCardIds = cards.filter((c) => c.csv).map((c) => c.id);
