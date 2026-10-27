import { brand } from "./theme";

/**
 * The footer's word is a chart (docs/SPEC.md section 17): its letters are SimpleDash's own
 * last days of visitors, read from this public stats page. Not the demo's site
 * (src/config/demo.ts): the footer says "our numbers". The footer shows only what this page
 * shows, and when the page is missing, off or paused it shows the plain word.
 */
export const footer = {
  slug: "simpledash-app",
  /** One day per letter of the name, today last. */
  days: brand.name.length,
} as const;
