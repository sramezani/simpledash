import { formatNumber } from "@/lib/format";

/**
 * The lines at the top of What brings customers (docs/SPEC.md section 31.1), from
 * GA4's whole counts only. They say what the counts show, never why. The counts are
 * events (signups or sales), not people, so the lines name the events.
 */

export type SourceCounts = {
  source: string;
  label: string;
  /** Events by people who first came from this source. */
  first: number;
  /** Events on a visit from this source. */
  last: number;
};

export type PathCount = { first: string; last: string; lastLabel: string; count: number };

/** A source needs this many events by people it first brought, and this big a gap. */
export const FOUND_MIN = { first: 3, gap: 2 } as const;
/** A last visit needs this many events by people who first came from elsewhere. */
export const BROUGHT_BACK_MIN = 3;

/** Sources that say nothing about who found the person. */
const UNNAMED = new Set(["(not set)", "(direct)", "(none)", ""]);

/**
 * Up to two lines, or none when nothing stands out:
 * 1. A source that first brought the people behind more events than happened on its visits.
 * 2. A last-visit source whose events mostly came from people who first came from elsewhere.
 */
export function customerHighlights(input: {
  /** Plural event noun: "signups" or "sales". */
  noun: string;
  sources: SourceCounts[];
  /** Null when GA4's paths aren't available. */
  paths: PathCount[] | null;
}): string[] {
  const lines: string[] = [];
  const total = input.sources.reduce((a, s) => a + s.first, 0);

  const found = input.sources
    .filter(
      (s) =>
        !UNNAMED.has(s.source) && s.first >= FOUND_MIN.first && s.first - s.last >= FOUND_MIN.gap,
    )
    .sort((a, b) => b.first - b.last - (a.first - a.last) || b.first - a.first)[0];
  if (found) {
    const on = found.last === 0 ? "none happened" : `${formatNumber(found.last)} happened`;
    lines.push(
      `${formatNumber(found.first)} of your ${formatNumber(total)} ${input.noun} came from people who first found you through ${found.label}; ${on} on a visit from ${found.label}.`,
    );
  }

  if (input.paths) {
    const byLast = new Map<string, { label: string; all: number; elsewhere: number }>();
    for (const p of input.paths) {
      if (p.last === "(not set)") continue;
      const entry = byLast.get(p.last) ?? { label: p.lastLabel, all: 0, elsewhere: 0 };
      entry.all += p.count;
      if (p.first !== p.last && p.first !== "(not set)") entry.elsewhere += p.count;
      byLast.set(p.last, entry);
    }
    const back = [...byLast.values()]
      .filter((e) => e.elsewhere >= BROUGHT_BACK_MIN && e.elsewhere * 2 >= e.all)
      .sort((a, b) => b.elsewhere - a.elsewhere)[0];
    if (back) {
      lines.push(
        `${back.label} was the last visit for ${formatNumber(back.all)} ${input.noun}; for ${formatNumber(back.elsewhere)} of them, the person first found you somewhere else.`,
      );
    }
  }
  return lines;
}
