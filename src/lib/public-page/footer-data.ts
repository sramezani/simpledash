import { brand } from "@/config/theme";
import { formatLongDay, formatNumber, percentChange } from "@/lib/format";
import type { LiveData, LivePlace } from "@/lib/ga4/live";
import { addDays, keyToDate, type Granularity } from "@/lib/ga4/ranges";

/**
 * The footer's numbers (docs/SPEC.md section 17): pure, so they are tested.
 * `getFooterStats()` in ./footer.ts fetches them.
 */

export type FooterDay = {
  /** YYYY-MM-DD in the site's time zone. */
  date: string;
  /** Visitors that day, or null before the GA4 property existed: never a fake zero. */
  visitors: number | null;
  /** Today, so far: still updating. */
  today: boolean;
};

/** One line of the live band: a number, then words ("23", "visitors in the last 30 minutes"). */
export type TickerItem = {
  id: string;
  value: number;
  text: string;
  /** ISO code: the line starts with this country's flag. */
  countryCode?: string;
  /** The first line, with the live dot. */
  live?: boolean;
};

export type FooterStats = {
  /** The site, as its public page names it: "simpledash.app". */
  label: string;
  slug: string;
  /** The last days, today last. At least one of them has a number. */
  days: FooterDay[];
  /** Empty when the live band is off or nobody was there. */
  ticker: TickerItem[];
  /** When the live numbers were checked (ISO), or null without them. */
  checkedAt: string | null;
};

/**
 * The last `count` days of a daily chart, today last. Days before the property existed
 * (`firstDay`) or outside the chart have no number. Null when no day has one.
 */
export function lastDays(
  series: { granularity: Granularity; points: readonly { key: string; visitors: number }[] },
  count: number,
  today: string,
  firstDay: string | null,
): FooterDay[] | null {
  if (series.granularity !== "date") return null;
  const byDate = new Map(series.points.map((p) => [keyToDate(p.key), p.visitors]));
  const days: FooterDay[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const date = addDays(today, -back);
    const known = byDate.get(date);
    const before = firstDay !== null && date < firstDay;
    days.push({ date, visitors: before || known === undefined ? null : known, today: back === 0 });
  }
  return days.some((d) => d.visitors !== null) ? days : null;
}

/**
 * Each day's bar, 0 to 1 of the busiest day (bars start from zero), and which day was
 * the busiest. A day without a number gets no bar; nobody on any day means no busiest.
 */
export function dayShares(days: readonly FooterDay[]): {
  shares: number[];
  busiest: number | null;
} {
  const max = Math.max(0, ...days.map((d) => d.visitors ?? 0));
  if (max === 0) return { shares: days.map(() => 0), busiest: null };
  return {
    shares: days.map((d) => (d.visitors ?? 0) / max),
    busiest: days.findIndex((d) => d.visitors === max),
  };
}

const plural = (n: number) => (n === 1 ? "visitor" : "visitors");
const visitorsWord = (n: number) => `${formatNumber(n)} ${plural(n)}`;

/** The plain sentence for one letter: "Friday 23 October: 254 visitors, the busiest of these 10 days". */
export function daySentence(day: FooterDay, busiest: boolean, count: number): string {
  const most = busiest ? `, the busiest of these ${count} days` : "";
  if (day.visitors === null) {
    return `${formatLongDay(day.date)}: no numbers, Google Analytics wasn't counting yet`;
  }
  if (day.today) {
    return `Today so far: ${visitorsWord(day.visitors)}, still updating${busiest ? `, already the busiest of these ${count} days` : ""}`;
  }
  return `${formatLongDay(day.date)}: ${visitorsWord(day.visitors)}${most}`;
}

const ORDINALS = ["", "", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

/**
 * What a letter's card says besides its number: the % change from the day before (never for
 * today, which isn't over), and where the day ranks. Ties share a rank. Today can only be
 * "already the busiest": it is still filling up, so "quietest" would be unfair.
 */
export function dayFacts(
  days: readonly FooterDay[],
  i: number,
): { change: number | null; previous: string | null; rank: string | null } {
  const day = days[i]!;
  const before = days[i - 1];
  const change =
    day.visitors === null || day.today || !before
      ? null
      : percentChange(day.visitors, before.visitors);
  if (day.visitors === null) return { change, previous: null, rank: null };
  const counted = days.filter((d) => d.visitors !== null);
  const place = 1 + counted.filter((d) => d.visitors! > day.visitors!).length;
  const last =
    place === counted.length &&
    counted.length > 1 &&
    !counted.every((d) => d.visitors === day.visitors);
  const n = days.length;
  let rank: string | null;
  if (place === 1)
    rank = day.today ? `Already the busiest of these ${n} days` : `Busiest of these ${n} days`;
  else if (day.today) rank = null;
  else if (last) rank = `Quietest of these ${n} days`;
  else rank = `${ORDINALS[place] ?? `${place}th`} busiest of these ${n} days`;
  return { change, previous: change === null ? null : before!.date, rank };
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

/** Live places are cities; the band counts countries. Busiest first, unknown codes left out. */
export function liveCountries(
  places: readonly LivePlace[],
): { code: string; name: string; visitors: number }[] {
  const byCode = new Map<string, number>();
  for (const p of places) {
    // "ZZ" is Unicode's "Unknown Region".
    if (!/^[A-Z]{2}$/.test(p.countryCode) || p.countryCode === "ZZ") continue;
    byCode.set(p.countryCode, (byCode.get(p.countryCode) ?? 0) + p.visitors);
  }
  return [...byCode]
    .flatMap(([code, visitors]) => {
      const name = regionNames.of(code);
      return name ? [{ code, name, visitors }] : [];
    })
    .sort((a, b) => b.visitors - a.visitors || a.name.localeCompare(b.name));
}

const TITLE_SUFFIX = new RegExp(`\\s+[·|–—-]\\s+${brand.name}$`);
const MAX_TITLE = 40;

/** "Pricing · SimpleDash" → "Pricing"; long titles are cut with "…". */
export function shortTitle(title: string): string {
  const plain = title.replace(TITLE_SUFFIX, "").trim();
  return plain.length > MAX_TITLE ? `${plain.slice(0, MAX_TITLE - 1).trimEnd()}…` : plain;
}

/**
 * The live band's lines, from what the public page shows: the count, then countries,
 * pages and devices when their cards are on. Empty when nobody was there.
 */
export function tickerItems(
  live: Pick<LiveData, "total" | "minutes" | "places" | "pages" | "devices">,
  show: { countries: boolean; pages: boolean; devices: boolean },
): TickerItem[] {
  if (live.total <= 0) return [];
  const items: TickerItem[] = [
    {
      id: "total",
      live: true,
      value: live.total,
      text: `${plural(live.total)} in the last ${live.minutes} minutes`,
    },
  ];
  if (show.countries) {
    for (const c of liveCountries(live.places).slice(0, 5)) {
      items.push({
        id: `country-${c.code}`,
        countryCode: c.code,
        value: c.visitors,
        text: `in ${c.name}`,
      });
    }
  }
  if (show.pages) {
    for (const p of live.pages.filter((p) => p.title !== "Unknown").slice(0, 3)) {
      items.push({
        id: `page-${p.title}`,
        value: p.visitors,
        text: `reading “${shortTitle(p.title)}”`,
      });
    }
  }
  if (show.devices) {
    for (const d of live.devices.filter((d) => d.device !== "other")) {
      items.push({
        id: `device-${d.device}`,
        value: d.visitors,
        text: `on ${d.label.toLowerCase()}`,
      });
    }
  }
  return items;
}
