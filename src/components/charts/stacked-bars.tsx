import { formatCompact, formatDay, formatMonth, formatNumber } from "@/lib/format";
import { niceTicks } from "@/lib/charts/series";
import { cn } from "@/lib/utils";

export type StackedDay = { date: string; a: number; b: number };

/** Long periods are grouped: a bar per day up to 62 days, per week up to 26 weeks, then per month. */
export function groupBars(days: StackedDay[]): { label: string; a: number; b: number }[] {
  if (days.length <= 62) return days.map((d) => ({ label: formatDay(d.date), ...d }));
  const size = days.length <= 182 ? 7 : 0;
  const groups = new Map<string, { label: string; a: number; b: number }>();
  days.forEach((d, i) => {
    const key = size ? String(Math.floor(i / size)) : d.date.slice(0, 7);
    const g = groups.get(key) ?? {
      label: size ? `Week of ${formatDay(d.date)}` : formatMonth(d.date),
      a: 0,
      b: 0,
    };
    g.a += d.a;
    g.b += d.b;
    groups.set(key, g);
  });
  return [...groups.values()];
}

/**
 * Two counts stacked per day, rendered on the server with no chart JavaScript (the
 * Google search card's "Your name vs others", docs/SPEC.md section 28.2). Hovering a
 * bar shows its numbers with CSS only. Decorative for screen readers: the caption and
 * the totals next to it say the same in words.
 */
export function StackedBars({
  days,
  labels,
  caption,
}: {
  days: StackedDay[];
  /** What `a` and `b` are: ["Your name", "Other searches"]. */
  labels: [string, string];
  caption: string;
}) {
  const bars = groupBars(days);
  const ticks = niceTicks(Math.max(0, ...bars.map((b) => b.a + b.b)));
  const top = ticks.at(-1) ?? 1;
  const every = Math.ceil(bars.length / 6);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="relative h-44 pb-6 pl-9 text-xs text-muted-foreground" aria-hidden="true">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute left-0 w-7 -translate-y-1/2 text-right tabular-nums"
            style={{ top: `calc((100% - 1.5rem) * ${1 - t / top})` }}
          >
            {formatCompact(t)}
          </span>
        ))}
        <div className="relative flex h-full items-end gap-[2px]">
          {ticks.map((t) => (
            <span
              key={t}
              className={cn(
                "pointer-events-none absolute inset-x-0 border-t",
                t === 0 ? "border-border" : "border-dashed border-border/80",
              )}
              style={{ top: `${(1 - t / top) * 100}%` }}
            />
          ))}
          {bars.map((bar, i) => (
            <div
              key={bar.label}
              className="group/bar relative flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <div
                className="flex w-full flex-col justify-end overflow-hidden rounded-t-[3px] transition-opacity duration-150 group-hover/bar:opacity-80"
                style={{ height: `${((bar.a + bar.b) / top) * 100}%` }}
              >
                <span className="w-full bg-chart-3" style={{ flexGrow: bar.a }} />
                <span className="w-full bg-chart-1" style={{ flexGrow: bar.b }} />
              </div>
              {i % every === 0 ? (
                <span className="absolute top-full mt-1.5 hidden whitespace-nowrap @md:inline">
                  {bar.label.replace("Week of ", "")}
                </span>
              ) : null}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover/bar:block">
                <span className="block font-medium">{bar.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-chart-3" />
                  {labels[0]}: {formatNumber(bar.a)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-chart-1" />
                  {labels[1]}: {formatNumber(bar.b)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
