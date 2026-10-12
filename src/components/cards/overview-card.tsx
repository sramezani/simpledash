import type { ReactNode } from "react";
import { Delta } from "@/components/shared/delta";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpTip } from "@/components/shared/help-tip";
import { cardById, type CardId } from "@/config/cards";
import type { ChartPoint } from "@/lib/charts/series";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type OverviewMetric = {
  id: Extract<CardId, "visitors" | "page-views" | "avg-time" | "signups">;
  /** The formatted value, or null for "—". */
  value: string | null;
  change: number | null;
  /** A small control next to the label, e.g. "Change the signup event". */
  action?: ReactNode;
  /** Replaces the number, e.g. the button that picks a signup event. */
  children?: ReactNode;
};

type OverviewCardProps = {
  /** Visitors, Page views, Avg. time and Signups (docs/SPEC.md section 11.2). Empty: no number row. */
  metrics: OverviewMetric[];
  /** "vs the previous 7 days", for screen readers. */
  versus: string;
  /** Why there is no % change. */
  missing?: string;
  /** The chart's points, or null when there is no series. */
  points: ChartPoint[] | null;
  /** Leave the chart out (a public page that didn't choose it). */
  showChart?: boolean;
  /** The text alternative, e.g. "Visitors per day, 4 Oct – 10 Oct. Highest: 312 on Wed 7 Oct." */
  caption: string;
  /** The chart itself: Recharts on the dashboard, a static SVG elsewhere. */
  chart: ReactNode;
  dimmed?: boolean;
  /** Next to "View as table", e.g. "Download CSV". */
  actions?: ReactNode;
  /** Under the chart: the notes panel (dashboard only). */
  footer?: ReactNode;
  /** Shown inside the chart area: "Add a note, like …" (dashboard only). */
  hint?: string;
};

/**
 * The overview (docs/SPEC.md section 11.2 and 11.3): the numbers in a row with
 * soft dividers, and visitors over time underneath, in one card. The chart has a
 * caption for screen readers and a "View as table" switch that needs no JavaScript.
 */
export function OverviewCard({
  metrics,
  versus,
  missing,
  points,
  showChart = true,
  caption,
  chart,
  dimmed,
  actions,
  footer,
  hint,
}: OverviewCardProps) {
  const chartCard = cardById.chart;
  const hasPending = points?.some((p) => p.pending !== null && p.solid === null) ?? false;
  return (
    <section
      aria-label="Overview"
      className="group/chart @container overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs"
    >
      <div className={cn(dimmed && "opacity-55 grayscale")}>
        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 @3xl:flex">
            {metrics.map((m) => (
              <Metric key={m.id} metric={m} versus={versus} missing={missing} />
            ))}
          </div>
        ) : null}
        {showChart ? (
          <div
            id="chart"
            className={cn(
              "flex flex-col gap-2 px-3 pb-4 @2xl:px-5",
              metrics.length > 0 ? "pt-1" : "pt-4",
            )}
          >
            <div className="flex min-h-8 items-center justify-between gap-2 pl-1">
              <h2 className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden="true" className="size-2 rounded-full bg-chart-1" />
                <span>
                  Visitors<span className="sr-only"> over time</span>
                </span>
                <HelpTip id="chart" label={chartCard.title}>
                  {chartCard.help}
                </HelpTip>
              </h2>
              <div className="flex items-center gap-1">
                {actions}
                {points ? (
                  <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring pointer-coarse:h-11">
                    <input type="checkbox" data-as-table className="peer sr-only" />
                    <span className="peer-checked:hidden">View as table</span>
                    <span className="hidden peer-checked:inline">View as chart</span>
                  </label>
                ) : null}
              </div>
            </div>
            {!points || points.length === 0 ? (
              <EmptyState
                title="No chart for this period yet."
                className="h-56 items-center @2xl:h-64"
              />
            ) : (
              <figure className="flex flex-col gap-2">
                <figcaption className="sr-only">{caption}</figcaption>
                <div className="relative group-has-[[data-as-table]:checked]/chart:hidden">
                  {chart}
                  {hint ? (
                    <p className="pointer-events-none absolute top-1 left-12 text-xs text-muted-foreground">
                      {hint}
                    </p>
                  ) : null}
                </div>
                <div className="hidden h-56 animate-in overflow-auto rounded-lg border duration-200 fade-in-0 group-has-[[data-as-table]:checked]/chart:block @2xl:h-64">
                  <table className="w-full text-sm">
                    <caption className="sr-only">{caption}</caption>
                    <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">
                          When
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">
                          Visitors
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((p) => (
                        <tr key={p.key} className="border-t">
                          <td className="px-3 py-1.5">
                            {p.label}
                            {p.solid === null && p.pending !== null ? (
                              <span className="text-warning"> · still updating</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {formatNumber(p.visitors)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasPending ? (
                  <p
                    className="flex items-center gap-2 pl-1 text-xs text-muted-foreground"
                    aria-hidden="true"
                  >
                    <svg width="20" height="4" viewBox="0 0 20 4" className="text-chart-1">
                      <line
                        x1="0"
                        y1="2"
                        x2="20"
                        y2="2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="5 5"
                      />
                    </svg>
                    Still updating
                  </p>
                ) : null}
              </figure>
            )}
          </div>
        ) : null}
      </div>
      {footer ? <div className="border-t px-4 py-3 @2xl:px-5">{footer}</div> : null}
    </section>
  );
}

/**
 * One number of the overview. On a wide card the numbers sit in one row with short
 * dividers between them; on a narrow one, two by two.
 */
function Metric({
  metric,
  versus,
  missing,
}: {
  metric: OverviewMetric;
  versus: string;
  missing?: string;
}) {
  const card = cardById[metric.id];
  return (
    <div
      id={metric.id}
      className={cn(
        "relative flex min-w-0 flex-col gap-1.5 px-4 py-4 @2xl:px-5 @3xl:flex-1",
        // Short vertical dividers: between the two columns, or between every number in a row.
        "before:absolute before:inset-y-4 before:left-0 before:hidden before:w-px before:bg-border even:before:block @3xl:before:block @3xl:first:before:hidden",
        // A line above the second row on narrow cards.
        "after:absolute after:inset-x-4 after:top-0 after:hidden after:h-px after:bg-border [&:nth-child(n+3)]:after:block @3xl:[&:nth-child(n+3)]:after:hidden",
      )}
    >
      <div className="flex h-6 items-center gap-1">
        <h2 id={`${metric.id}-title`} className="text-sm font-medium text-muted-foreground">
          {card.title}
        </h2>
        <HelpTip id={metric.id} label={card.title}>
          {card.help}
        </HelpTip>
        {metric.action ? (
          <div className="-my-1 ml-auto flex items-center">{metric.action}</div>
        ) : null}
      </div>
      {metric.children ?? (
        <>
          <p className="text-2xl leading-tight font-semibold tracking-tight tabular-nums @md:text-3xl">
            {metric.value ?? "—"}
          </p>
          {metric.value === null ? (
            // No value means no comparison either; keep the line's height so nothing moves.
            <span className="h-4" aria-hidden="true" />
          ) : (
            <Delta
              change={metric.change}
              missing={missing}
              versus={versus}
              size="compact"
              className="min-h-4"
            />
          )}
        </>
      )}
    </div>
  );
}
