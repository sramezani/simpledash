import { formatNumber, formatPercent, percentChange } from "@/lib/format";
import { sourceLabel } from "@/lib/ga4/labels";
import type { RangeType } from "@/lib/ga4/ranges";
import type { Payloads } from "@/lib/ga4/reports";

/**
 * The summary line (docs/SPEC.md section 11.1), built only from the numbers.
 * It states what changed. It never guesses why: no "because".
 */

export type SummaryInput = {
  range: RangeType;
  totals: Payloads["totals"] | null;
  sources: Payloads["sources"] | null;
  actions: Payloads["actions"] | null;
  /** The chosen signup event, or null. Pass null too when Signups is hidden (public page). */
  signupEvent: string | null;
  /** False when the previous period started before the property existed. */
  comparable: boolean;
  /** The weekly email says "the week before" and "last week". */
  audience?: "dashboard" | "email";
};

const PREVIOUS: Record<RangeType, string> = {
  "7d": "the previous 7 days",
  "30d": "the previous 30 days",
  "12m": "the previous 12 months",
};
const LAST: Record<RangeType, string> = {
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "12m": "the last 12 months",
};

/** Changes smaller than this read as "about the same". */
const SAME_BAND = 3;

/** How a source reads in the summary, or null when it has no useful name ("(not set)"). */
function sourceWords(source: string): string | null {
  if (source === "(direct)" || source === "(none)") return "direct visits";
  const label = sourceLabel(source);
  return label === "Unknown" || label === "Other" ? null : label;
}

/** The source behind 50% or more of the net change, in the same direction. */
function mainSourceOfChange(sources: Payloads["sources"] | null, netChange: number): string | null {
  if (!sources || netChange === 0) return null;
  let best: { source: string; delta: number } | null = null;
  for (const row of sources.rows) {
    const delta = row.visitors - row.previous;
    if (Math.sign(delta) !== Math.sign(netChange)) continue;
    if (Math.abs(delta) < 0.5 * Math.abs(netChange)) continue;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { source: row.source, delta };
  }
  return best ? sourceWords(best.source) : null;
}

/** The source that brought 50% or more of this period's visitors. */
function mainSourceOfVisitors(sources: Payloads["sources"] | null, total: number): string | null {
  if (!sources || total <= 0) return null;
  const top = [...sources.rows].sort((a, b) => b.visitors - a.visitors)[0];
  return top && top.visitors >= 0.5 * total ? sourceWords(top.source) : null;
}

function signupsSentence(input: SummaryInput): string | null {
  const event = input.signupEvent;
  if (!event || !input.actions) return null;
  const now = input.actions.current[event] ?? 0;
  const before = input.actions.previous[event] ?? 0;
  if (now === 0 && before === 0) return null;
  const count = `${formatNumber(now)} ${now === 1 ? "signup" : "signups"}`;
  if (!input.comparable) return `${count}.`;
  if (now > before) return `${count}, up from ${formatNumber(before)}.`;
  if (now < before) return `${count}, down from ${formatNumber(before)}.`;
  return `${count}, same as before.`;
}

export function buildSummary(input: SummaryInput): string | null {
  if (!input.totals) return null;
  const email = input.audience === "email";
  const { current, previous } = input.totals;
  const change = input.comparable ? percentChange(current.visitors, previous.visitors) : null;

  let first: string;
  if (change === null) {
    // Rule 3: no comparison possible.
    const period = email ? "last week" : `in ${LAST[input.range]}`;
    const noun = current.visitors === 1 ? "visitor" : "visitors";
    first = `${formatNumber(current.visitors)} ${noun} ${period}`;
    const main = mainSourceOfVisitors(input.sources, current.visitors);
    if (main) first += `, mostly from ${main}`;
  } else {
    // Rules 1 and 2.
    const versus = email ? "the week before" : PREVIOUS[input.range];
    if (Math.abs(change) < SAME_BAND) {
      first = `Visitors about the same as ${versus}`;
    } else {
      first = `Visitors ${change > 0 ? "up" : "down"} ${formatPercent(change)} vs ${versus}`;
      const main = mainSourceOfChange(input.sources, current.visitors - previous.visitors);
      if (main) first += `, mostly from ${main}`;
    }
  }

  const signups = signupsSentence(input);
  return signups ? `${first}. ${signups}` : `${first}.`;
}
