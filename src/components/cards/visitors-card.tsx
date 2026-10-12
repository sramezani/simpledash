import type { ReactNode } from "react";
import { CardShell } from "@/components/shared/card-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { cardById } from "@/config/cards";
import type { ChartPoint } from "@/lib/charts/series";
import { formatNumber } from "@/lib/format";

type VisitorsCardProps = {
  points: ChartPoint[] | null;
  /** The text alternative, e.g. "Visitors per day, 4 Oct – 10 Oct. Highest: 312 on Wed 7 Oct." */
  caption: string;
  /** The chart itself: Recharts on the dashboard, a static SVG elsewhere. */
  chart: ReactNode;
  dimmed?: boolean;
  actions?: ReactNode;
  /** Under the chart: the notes panel (dashboard only). */
  footer?: ReactNode;
  /** Shown inside an empty chart area: "Add a note, like …" (dashboard only). */
  hint?: string;
};

/**
 * Visitors over time (docs/SPEC.md section 11.3), with a caption for screen readers
 * and a "View as table" switch that needs no JavaScript.
 */
export function VisitorsCard({
  points,
  caption,
  chart,
  dimmed,
  actions,
  footer,
  hint,
}: VisitorsCardProps) {
  const card = cardById.chart;
  const hasPending = points?.some((p) => p.pending !== null && p.solid === null) ?? false;
  return (
    <CardShell
      id="chart"
      title={card.title}
      help={card.help}
      dimmed={dimmed}
      actions={
        <>
          {actions}
          {points ? (
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring pointer-coarse:h-11">
              <input type="checkbox" data-as-table className="peer sr-only" />
              <span className="peer-checked:hidden">View as table</span>
              <span className="hidden peer-checked:inline">View as chart</span>
            </label>
          ) : null}
        </>
      }
      className="group/chart"
    >
      {!points ? (
        <EmptyState title="No chart for this period yet." />
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
          <div className="hidden max-h-72 overflow-auto rounded-lg border group-has-[[data-as-table]:checked]/chart:block">
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
          {footer}
          {hasPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
              <svg width="20" height="4" viewBox="0 0 20 4" className="text-chart-1">
                <line
                  x1="0"
                  y1="2"
                  x2="20"
                  y2="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
              Still updating
            </p>
          ) : null}
        </figure>
      )}
    </CardShell>
  );
}
