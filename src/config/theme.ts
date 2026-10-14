/**
 * THE theme and brand file (docs/SPEC.md section 18).
 *
 * Every colour, the corner radius, the shadows and the brand facts live here,
 * and nowhere else. Editing this file re-themes the site, the weekly email,
 * the Open Graph images, the favicons and the live globe.
 *
 * - Plain data with no imports, so pages, emails, images and tests can all use it.
 * - Colours are hex, because email clients and the image renderer need plain values.
 * - `npm run check` tests WCAG AA contrast for every text and background pair here.
 */

/** The main colour. It feeds `primary`, `ring` and `brand`. */
const brandColor = "#4A42DB";

/** The neutral scale. It feeds surfaces, borders and quiet text. */
const neutral = {
  0: "#FFFFFF",
  50: "#FAFAFB",
  100: "#F4F4F6",
  200: "#E7E7EB",
  300: "#D4D4DA",
  400: "#A1A1AA",
  500: "#71717A",
  600: "#5F5F6B",
  700: "#3F3F46",
  800: "#27272A",
  900: "#18181B",
  950: "#0B0B0F",
} as const;

export const brand = {
  name: "SimpleDash",
  tagline: "Google Analytics, in a dash.",
  description:
    "Connect your Google account and see your visitors, sources and top pages on one page. No setup, no new tracking code, and the history GA4 already has.",
  url: "https://simpledash.app",
  supportEmail: "hello@simpledash.app",
  /** The open-source code (AGPL-3.0). */
  sourceUrl: "https://github.com/sramezani/simpledash",
} as const;

/** Light theme only in V1. A `dark` palette with the same keys can be added later. */
export const colors = {
  light: {
    // Surfaces and text
    background: neutral[50],
    foreground: neutral[950],
    card: neutral[0],
    "card-foreground": neutral[950],
    popover: neutral[0],
    "popover-foreground": neutral[950],
    muted: neutral[100],
    "muted-foreground": neutral[600],
    secondary: neutral[100],
    "secondary-foreground": neutral[900],
    accent: neutral[100],
    "accent-foreground": neutral[900],
    // Actions
    primary: brandColor,
    "primary-foreground": neutral[0],
    ring: brandColor,
    destructive: "#C81E1E",
    "destructive-foreground": neutral[0],
    // Lines
    border: neutral[200],
    input: neutral[300],
    // Brand
    brand: brandColor,
    // Changes: always shown with an arrow and a word too
    positive: "#15803D",
    negative: "#B91C1C",
    // Notes such as "Still updating"
    warning: "#B45309",
    // Charts: chart-1 is the visitors line, a light clear blue (also the soft bars in lists)
    "chart-1": "#2F94E4",
    "chart-2": "#0284C7",
    "chart-3": "#D97706",
    "chart-4": "#059669",
    "chart-5": "#DB2777",
    // Layers: the dim layer behind dialogs (used with an opacity, e.g. bg-overlay/50)
    overlay: neutral[950],
    // Decoration: the three dots of the browser window around the landing demo
    "window-close": "#FF5F57",
    "window-minimize": "#FEBC2E",
    "window-zoom": "#28C840",
  },
} as const;

export type ColorToken = keyof (typeof colors)["light"];

/** The base corner radius. Smaller and larger radii are worked out from it. */
export const radius = "0.625rem";

/** Shadows, only for raised layers such as menus and dialogs. Cards stay flat. */
export const shadows = {
  xs: "0 1px 2px 0 #0B0B0F0D",
  sm: "0 1px 3px 0 #0B0B0F14, 0 1px 2px -1px #0B0B0F14",
  md: "0 4px 6px -1px #0B0B0F14, 0 2px 4px -2px #0B0B0F14",
  lg: "0 10px 15px -3px #0B0B0F1A, 0 4px 6px -4px #0B0B0F1A",
} as const;

/**
 * Text and background pairs that must reach WCAG AA (4.5:1).
 * The contrast test reads this list, so a new pair is checked as soon as it is added.
 */
export const textPairs: ReadonlyArray<readonly [text: ColorToken, background: ColorToken]> = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "card"],
  ["muted-foreground", "background"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["primary-foreground", "primary"],
  ["destructive-foreground", "destructive"],
  ["primary", "card"],
  ["primary", "background"],
  ["destructive", "card"],
  ["positive", "card"],
  ["negative", "card"],
  ["warning", "card"],
  ["positive", "background"],
  ["negative", "background"],
  ["warning", "background"],
];

/** Non-text pairs that must reach 3:1 (WCAG 1.4.11): focus ring and the visitors line. */
export const uiPairs: ReadonlyArray<readonly [ColorToken, ColorToken]> = [
  ["ring", "card"],
  ["ring", "background"],
  ["chart-1", "card"],
  ["chart-2", "card"],
  // Searches with the site's name, next to chart-1 in the Google search card.
  ["chart-3", "card"],
  // Revenue bars under the visitors line (Pro).
  ["chart-4", "card"],
];

export const theme = { brand, brandColor, colors, radius, shadows } as const;
