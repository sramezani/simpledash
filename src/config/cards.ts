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
    help: `${COUNT_HELP} The last part is dashed while Google is still adding to yesterday.`,
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
    id: "live",
    title: "Right now",
    help: "Visitors in the last 30 minutes, by place, and the pages they're on (shown by page title). Places on the globe: GeoNames, CC BY 4.0.",
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
