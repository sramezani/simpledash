/**
 * THE theme and brand file (docs/SPEC.md section 18).
 *
 * Every colour, the corner radius, the shadows and the brand facts live here,
 * and nowhere else. Editing this file re-themes the site, the weekly email,
 * the Open Graph images, the favicons and the live globe.
 *
 * - Plain data with no imports, so pages, emails, images and tests can all use it.
 * - Colours are hex, because email clients and the image renderer need plain values.
 * - Two palettes with the same tokens: `light` and `dark`. The page follows the device's
 *   setting unless the visitor picks one (the theme switch). Emails and images stay light.
 * - `npm run check` tests WCAG AA contrast for every text and background pair, in both.
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
  /** Who makes SimpleDash: "Made by Sia" in the footer, linking to X. */
  makerName: "Sia",
  makerUrl: "https://x.com/siaramzee",
} as const;

/** The light palette: the default, and the one emails and images use. */
const light = {
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
  // The live globe (docs/SPEC.md section 11.10): a deep blue night around a light map
  "globe-space": "#121936",
  "globe-ocean": "#3F7FDC",
  "globe-land": "#F1EEE4",
  "globe-border": "#C9C1AC",
  "globe-label": "#57524A",
  "globe-glow": "#8CC0FF",
  // Decoration: the three dots of the browser window around the landing demo
  "window-close": "#FF5F57",
  "window-minimize": "#FEBC2E",
  "window-zoom": "#28C840",
  // The footer band (docs/SPEC.md section 17): the brand colour, with white on it.
  footer: brandColor,
  "footer-foreground": neutral[0],
  "footer-muted": "#E2E0FC",
  "footer-border": "#6660E3",
  // The footer word's dim letters, a little lighter than the band.
  "footer-ghost": "#6C65E8",
  // The footer word's bars and the band's focus ring.
  "footer-accent": neutral[0],
  // The live dot in the footer's live band.
  "footer-live-dot": "#86EFAC",
} as const;

export type ColorToken = keyof typeof light;

/**
 * The dark palette: deep blue-grey surfaces (never pure black), raised layers a step
 * lighter, and the brand as a brighter periwinkle so it reads on dark. Buttons in the
 * brand colour carry dark text, which keeps them at AA.
 */
const dark: Record<ColorToken, string> = {
  // Surfaces and text
  background: "#101117",
  foreground: "#ECEDF3",
  card: "#16171F",
  "card-foreground": "#ECEDF3",
  popover: "#1B1C26",
  "popover-foreground": "#ECEDF3",
  muted: "#1E1F2A",
  "muted-foreground": "#9D9FB2",
  secondary: "#22232F",
  "secondary-foreground": "#E3E4EC",
  accent: "#262836",
  "accent-foreground": "#E3E4EC",
  // Actions
  primary: "#8580FF",
  "primary-foreground": "#100E2E",
  ring: "#8580FF",
  destructive: "#F2726E",
  "destructive-foreground": "#1F0A0A",
  // Lines
  border: "#272936",
  input: "#363849",
  // Brand
  brand: "#8580FF",
  // Changes
  positive: "#4CD38A",
  negative: "#F87171",
  // Notes
  warning: "#F2B33D",
  // Charts: the same families as light, brighter so they glow on dark cards
  "chart-1": "#4FA3F7",
  "chart-2": "#38BDF8",
  "chart-3": "#F5A524",
  "chart-4": "#34D399",
  "chart-5": "#F472B6",
  // Layers
  overlay: "#05060A",
  // The live globe keeps its own night sky in both themes
  "globe-space": light["globe-space"],
  "globe-ocean": light["globe-ocean"],
  "globe-land": light["globe-land"],
  "globe-border": light["globe-border"],
  "globe-label": light["globe-label"],
  "globe-glow": light["globe-glow"],
  // Decoration
  "window-close": light["window-close"],
  "window-minimize": light["window-minimize"],
  "window-zoom": light["window-zoom"],
  // The footer band: a deep brand indigo, so it still ends the page without glaring
  footer: "#2E2A8F",
  "footer-foreground": "#FFFFFF",
  "footer-muted": "#CFCCF7",
  "footer-border": "#3F3AAE",
  "footer-ghost": "#3A35A6",
  "footer-accent": "#FFFFFF",
  "footer-live-dot": light["footer-live-dot"],
};

export const colors = { light, dark } as const;

/** The two palettes, by name. */
export type ThemeName = keyof typeof colors;

/** Soft backgrounds for the faces on the live globe, picked per face so each keeps its colour. */
export const avatarBackgrounds = ["#FDE7B0", "#CFE3FF", "#DCD9FF", "#FAD4E4", "#CDEFD9", "#FFD9C2"];

/** The base corner radius. Smaller and larger radii are worked out from it. */
export const radius = "0.625rem";

/** Shadows, only for raised layers such as menus and dialogs. Cards stay flat. */
export const shadows = {
  xs: "0 1px 2px 0 #0B0B0F0D",
  sm: "0 1px 3px 0 #0B0B0F14, 0 1px 2px -1px #0B0B0F14",
  md: "0 4px 6px -1px #0B0B0F14, 0 2px 4px -2px #0B0B0F14",
  lg: "0 10px 15px -3px #0B0B0F1A, 0 4px 6px -4px #0B0B0F1A",
} as const;

/** The same shadows on the dark palette: deeper, or they vanish into the page. */
export const darkShadows: Record<keyof typeof shadows, string> = {
  xs: "0 1px 2px 0 #00000059",
  sm: "0 1px 3px 0 #00000073, 0 1px 2px -1px #00000073",
  md: "0 4px 6px -1px #00000080, 0 2px 4px -2px #00000080",
  lg: "0 10px 15px -3px #00000099, 0 4px 6px -4px #00000099",
};

/**
 * Text and background pairs that must reach WCAG AA (4.5:1), in both palettes.
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
  // Country names on the live globe.
  ["globe-label", "globe-land"],
  // The footer band: its text, quiet text, the light button, and letters cut out of a bar.
  ["footer-foreground", "footer"],
  ["footer-muted", "footer"],
  ["footer", "footer-foreground"],
  ["footer", "footer-accent"],
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
  // The footer's bars, its focus ring and its live dot, on the band.
  ["footer-accent", "footer"],
  ["footer-live-dot", "footer"],
];

export const theme = { brand, brandColor, colors, radius, shadows, darkShadows } as const;
