const SECOND = 1000;
const MINUTE = 60 * SECOND;
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

/**
 * How long a live answer counts as fresh, and how often the live count and the live view
 * ask again (docs/SPEC.md section 11.10). Shared by the server cache, the browser and the docs.
 */
export const LIVE_REFRESH = 20 * SECOND;

/**
 * The dashboard asks for the live count once more this soon after it opens, and that ask
 * takes an answer at most this old, so an owner who just opened their own site sees
 * themselves without waiting for the next 20-second round.
 */
export const LIVE_EARLY = 5 * SECOND;

/** "20 seconds", "30 minutes", "1 hour", "12 hours". */
export function durationWords(ms: number): string {
  if (ms < MINUTE) {
    const seconds = Math.round(ms / SECOND);
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  if (ms < HOUR) {
    const minutes = Math.round(ms / MINUTE);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  const hours = Math.round(ms / HOUR);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
