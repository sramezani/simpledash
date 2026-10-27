import { MousePointerClickIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { Delta } from "@/components/shared/delta";
import { brand } from "@/config/theme";
import { formatLongDay, formatNumber, formatShortDay } from "@/lib/format";
import {
  dayFacts,
  dayShares,
  daySentence,
  type FooterDay,
  type FooterStats,
} from "@/lib/public-page/footer-data";
import { cn } from "@/lib/utils";

const LETTERS = [...brand.name];

/** The footer's width: wider than the page's container, so the word runs nearly edge to edge. */
export const FOOTER_FRAME = "mx-auto w-full max-w-[100rem] px-4 sm:px-6";

/**
 * The footer's word is a chart (docs/SPEC.md section 17): each letter of the name is one of
 * the last days of visitors, today last. Each letter is as wide as it is in the name, and a
 * glass bar rises in its column, from zero to that day against the busiest one; the letter
 * shows softly inside the bar and stays dim above it, and turns bright white on hover, focus
 * or while its card is open. A letter opens a card about its day.
 * Without numbers it is the plain dim word, at the same size, so nothing moves when the
 * numbers stream in.
 */
export function FooterWord({ stats }: { stats: FooterStats | null }) {
  return (
    <div className={cn("footer-word relative", FOOTER_FRAME)}>
      <div className="flex h-16 items-center justify-between gap-4 text-sm sm:h-14">
        {stats ? (
          <>
            <p id="footer-word-caption" className="footer-caption text-pretty text-footer-muted">
              This word is a chart: each letter is a day of visitors to{" "}
              <span className="text-footer-foreground">{stats.label}</span>.
            </p>
            <p className="footer-caption inline-flex shrink-0 items-center gap-1.5 text-footer-muted max-sm:hidden">
              <MousePointerClickIcon className="size-4" aria-hidden="true" />
              <span className="pointer-coarse:hidden">Click a letter</span>
              <span className="hidden pointer-coarse:inline">Tap a letter</span>
            </p>
          </>
        ) : null}
      </div>
      {stats ? <Chart stats={stats} /> : <PlainWord />}
    </div>
  );
}

function Chart({ stats }: { stats: FooterStats }) {
  const { shares, busiest } = dayShares(stats.days);
  return (
    <ul aria-labelledby="footer-word-caption" className="footer-word-grid">
      {stats.days.map((day, i) => {
        const sentence = daySentence(day, i === busiest, stats.days.length);
        const id = `footer-day-${i}`;
        const style = {
          "--share": shares[i],
          "--i": i,
          "--anchor": `--${id}`,
        } as CSSProperties;
        return (
          <li key={day.date} className="footer-col" style={style}>
            <button
              type="button"
              popoverTarget={id}
              aria-label={`${sentence}. Show this day`}
              className="footer-day relative flex h-full items-end rounded-[var(--bar-r)] outline-offset-4"
            >
              <span aria-hidden="true" className="footer-letter text-footer-ghost">
                {LETTERS[i]}
              </span>
              {day.visitors === null ? null : (
                <span
                  aria-hidden="true"
                  className={cn(
                    "footer-bar border-x border-t border-b-0 bg-linear-to-b",
                    day.today
                      ? "border-dashed border-footer-accent/40 from-footer-accent/10 to-footer-accent/0"
                      : "border-footer-accent/20 border-t-footer-accent/50 from-footer-accent/20 to-footer-accent/5",
                  )}
                >
                  <span className={cn("footer-letter footer-lit", day.today && "footer-lit-today")}>
                    {LETTERS[i]}
                  </span>
                </span>
              )}
              <Label day={day} />
            </button>
            <span
              aria-hidden="true"
              className="footer-day-note pointer-events-none absolute inset-x-4 top-0 flex h-16 items-center text-sm text-pretty text-footer-foreground sm:inset-x-6 sm:h-14"
            >
              {sentence}
            </span>
            <DayCard id={id} days={stats.days} i={i} />
          </li>
        );
      })}
    </ul>
  );
}

/** The day's number and short name, riding on top of its bar. */
function Label({ day }: { day: FooterDay }) {
  const [weekday, dayNumber] = formatShortDay(day.date).split(" ");
  return (
    <span aria-hidden="true" className="footer-label">
      <span className="footer-label-inner flex flex-col items-center leading-tight">
        <span className="footer-num text-sm font-semibold text-footer-muted tabular-nums sm:text-base">
          {day.visitors === null ? "–" : formatNumber(day.visitors)}
        </span>
        <span className="text-xs whitespace-nowrap text-footer-muted">
          {day.today ? (
            "Today"
          ) : (
            <>
              <span className="max-md:hidden">{weekday} </span>
              {dayNumber}
            </>
          )}
        </span>
      </span>
    </span>
  );
}

/**
 * A frosted card above a letter, opened by clicking it (a native popover: no JavaScript, Esc
 * or a click outside closes it). The number rolls up like an odometer as it opens.
 */
function DayCard({ id, days, i }: { id: string; days: FooterDay[]; i: number }) {
  const day = days[i]!;
  const { change, previous, rank } = dayFacts(days, i);
  const previousDay = previous ? formatLongDay(previous).split(" ")[0] : null;
  return (
    <div
      id={id}
      popover="auto"
      className="footer-day-card w-64 rounded-2xl border border-footer-foreground/60 bg-footer-foreground/90 p-4 text-left text-footer shadow-lg backdrop-blur-xl"
    >
      <p className="text-sm font-medium text-muted-foreground">
        {day.today ? "Today, so far" : formatLongDay(day.date)}
      </p>
      {day.visitors === null ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No numbers: Google Analytics wasn&apos;t counting yet.
        </p>
      ) : (
        <>
          <p className="mt-1 flex items-baseline gap-2">
            <RollingNumber
              value={formatNumber(day.visitors)}
              className="text-5xl font-semibold tracking-tight"
            />
            <span className="text-sm text-muted-foreground">
              {day.visitors === 1 ? "visitor" : "visitors"}
            </span>
          </p>
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
            {change !== null && previousDay ? (
              <span className="inline-flex items-center gap-1.5">
                <Delta change={change} versus={`vs ${previousDay}`} />
                <span aria-hidden="true" className="text-muted-foreground">
                  vs {previousDay}
                </span>
              </span>
            ) : null}
            {day.today ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2 animate-pulse rounded-full bg-positive"
                  aria-hidden="true"
                />
                Still updating
              </span>
            ) : null}
            {rank ? <span className="text-muted-foreground">{rank}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A number whose digits roll up from 0 like an odometer each time its card opens (CSS:
 * `@starting-style` under `:popover-open`). Screen readers get the plain number.
 */
function RollingNumber({ value, className }: { value: string; className?: string }) {
  const chars = [...value];
  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex leading-none">
        {chars.map((c, i) =>
          c >= "0" && c <= "9" ? (
            <span key={i} className="inline-block h-[1em] overflow-hidden">
              <span
                className="footer-reel flex flex-col"
                style={
                  {
                    "--to": `${-Number(c) * 10}%`,
                    transitionDelay: `${(chars.length - 1 - i) * 80}ms`,
                  } as CSSProperties
                }
              >
                {DIGITS.map((d) => (
                  <span key={d} className="h-[1em]">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i}>{c}</span>
          ),
        )}
      </span>
    </span>
  );
}

function PlainWord() {
  return (
    <div aria-hidden="true" className="footer-word-grid">
      {LETTERS.map((letter, i) => (
        <span key={i} className="footer-col">
          <span className="flex h-full items-end">
            <span className="footer-letter text-footer-ghost">{letter}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
