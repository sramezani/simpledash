/**
 * The live demo (docs/SPEC.md section 17): the landing page shows /demo in a
 * browser frame, and /demo shows this public stats page with its real numbers.
 * Change the slug to show another site's public page. If that page is missing
 * or paused, the demo falls back to sample data, so the landing page never breaks.
 */
export const demo = {
  slug: "meetline-me",
  /** The range the demo opens with: pick one where the site has visitors. */
  defaultRange: "12m",
} as const;
