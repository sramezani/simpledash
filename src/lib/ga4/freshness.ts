const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * How long a cached report counts as fresh, in milliseconds (docs/SPEC.md section 10), for
 * the dashboard (`owner`) and public pages (`public`). The docs page on freshness reads them
 * from here too, so it can't drift from the code.
 */
export const FRESHNESS = {
  /** A period that ends today keeps changing: every preset but Yesterday. */
  endsToday: { owner: HOUR / 2, public: HOUR },
  /** A period that includes yesterday, which Google may still be adding to. */
  recent: { owner: 3 * HOUR, public: 12 * HOUR },
  /** A period that ended before yesterday: it won't change any more. */
  settled: { owner: 24 * HOUR, public: 24 * HOUR },
} as const;

export type FreshnessKind = keyof typeof FRESHNESS;

/** "30 minutes", "1 hour", "12 hours". */
export function durationWords(ms: number): string {
  if (ms < HOUR) {
    const minutes = Math.round(ms / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  const hours = Math.round(ms / HOUR);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
