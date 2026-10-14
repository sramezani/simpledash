import { brand } from "./theme";

/**
 * SimpleDash's own Google Analytics (docs/SPEC.md section 17). It loads only after a visitor
 * allows it in the consent banner, and only on `host`, so local development never sends
 * anything to it.
 */
export const analytics = {
  /**
   * The public ID (G-…) from NEXT_PUBLIC_GA_MEASUREMENT_ID, written into the browser code at build
   * time, so it isn't in this open-source repo. Empty: no banner and no analytics. This is the one
   * env read outside src/lib/env.ts, because the browser needs it and env.ts is server-only.
   */
  measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  host: new URL(brand.url).hostname,
  /** How long Google Analytics' cookies last: 13 months, the most EU regulators accept. */
  cookieDays: 395,
} as const;
