import { useId, type CSSProperties } from "react";
import { formatCompact, formatNumber } from "@/lib/format";
import { niceTicks, type ChartPoint } from "@/lib/charts/series";
import { smoothPath } from "@/lib/charts/path";
import { cn } from "@/lib/utils";

/**
 * The visitors line as plain SVG, rendered on the server: no chart JavaScript
 * (landing demo and public pages, docs/SPEC.md sections 15 and 17). A smooth
 * light-blue line over a soft fill. The lines stretch with the card while the
 * labels stay crisp HTML, and hovering a point shows its tooltip with CSS only.
 * Screen readers get the caption and the "View as table" switch instead.
 */
export function StaticLineChart({ points }: { points: ChartPoint[] }) {
  const gradient = useId();
  const ticks = niceTicks(Math.max(...points.map((p) => p.visitors), 0));
  const top = ticks.at(-1) ?? 1;
  const n = Math.max(points.length - 1, 1);
  const x = (i: number) => (points.length === 1 ? 50 : (i / n) * 100);
  const y = (v: number) => 100 - (v / top) * 100;

  const xy = points.map((p, i) => ({ x: x(i), y: y(p.visitors) }));
  const lastSolid = points.reduce((last, p, i) => (p.solid !== null ? i : last), -1);
  const firstPending = points.findIndex((p) => p.pending !== null);
  const solid = lastSolid >= 0 ? smoothPath(xy, 0, lastSolid) : "";
  const pending = firstPending >= 0 ? smoothPath(xy, firstPending, points.length - 1) : "";
  const line = smoothPath(xy);
  const area = points.length > 1 ? `${line}L${x(points.length - 1)},100L${x(0)},100Z` : "";
  const last = xy.at(-1);
  // On a narrow card, every other label is left out so they don't run into each other.
  let ordinal = -1;

  return (
    <div className="relative h-56 w-full pb-7 pl-10 text-xs text-muted-foreground @2xl:h-64">
      {ticks.map((t) => (
        <span
          key={t}
          aria-hidden="true"
          className="absolute left-0 w-8 -translate-y-1/2 text-right tabular-nums"
          style={{ top: `calc((100% - 1.75rem) * ${y(t) / 100})` }}
        >
          {formatCompact(t)}
        </span>
      ))}
      <div className="relative h-full">
        {ticks.map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 border-t",
              t === 0 ? "border-border" : "border-dashed border-border/80",
            )}
            style={{ top: `${y(t)}%` }}
          />
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full animate-chart-reveal overflow-visible text-chart-1"
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.26" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {area ? <path d={area} fill={`url(#${gradient})`} /> : null}
          <path
            d={solid}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={pending}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeDasharray="5 5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {last ? (
          <span
            aria-hidden="true"
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1 ring-4 ring-chart-1/20"
            style={{ left: `${last.x}%`, top: `${last.y}%` }}
          />
        ) : null}
        {points.map((p, i) =>
          p.tick ? (
            <span
              key={p.key}
              aria-hidden="true"
              className={cn(
                "absolute top-full mt-2 whitespace-nowrap",
                i === 0 ? "" : i === points.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                ++ordinal % 2 === 1 && "hidden @lg:inline",
              )}
              style={{ left: `${x(i)}%` }}
            >
              {p.tick}
            </span>
          ) : null,
        )}
        <HoverPoints points={points} xy={xy} />
      </div>
    </div>
  );
}

/**
 * One invisible column per point. Hovering a column shows a guide line, a dot and
 * the point's tooltip, with CSS only.
 */
function HoverPoints({ points, xy }: { points: ChartPoint[]; xy: { x: number; y: number }[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {points.map((p, i) => {
        const at = xy[i]!;
        const left = i === 0 ? 0 : (xy[i - 1]!.x + at.x) / 2;
        const right = i === points.length - 1 ? 100 : (at.x + xy[i + 1]!.x) / 2;
        const width = Math.max(right - left, 0.01);
        const dot = ((at.x - left) / width) * 100;
        const below = at.y < 32;
        const align = at.x < 15 ? "start" : at.x > 85 ? "end" : "center";
        const stillUpdating = p.solid === null && p.pending !== null;
        return (
          <div
            key={p.key}
            className="group/point absolute inset-y-0 hover:z-10"
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            <span
              className="absolute inset-y-0 border-l border-dashed border-chart-1/50 opacity-0 transition-opacity duration-150 group-hover/point:opacity-100"
              style={{ left: `${dot}%` }}
            />
            <span
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 scale-50 rounded-full border-2 border-chart-1 bg-card opacity-0 transition duration-150 ease-out group-hover/point:scale-100 group-hover/point:opacity-100"
              style={{ left: `${dot}%`, top: `${at.y}%` }}
            />
            <span
              className={cn(
                "pointer-events-none absolute flex translate-y-1 flex-col gap-0.5 rounded-lg border bg-popover px-3 py-2 whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition duration-150 ease-out group-hover/point:translate-y-0 group-hover/point:opacity-100",
                align === "center" && "-translate-x-1/2",
                align === "end" && "-translate-x-full",
              )}
              style={
                {
                  left: `${dot}%`,
                  ...(below
                    ? { top: `calc(${at.y}% + 0.75rem)` }
                    : { bottom: `calc(${100 - at.y}% + 0.75rem)` }),
                } as CSSProperties
              }
            >
              <span className="text-muted-foreground">{p.label}</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatNumber(p.visitors)} {p.visitors === 1 ? "visitor" : "visitors"}
              </span>
              {stillUpdating ? <span className="text-warning">Still updating</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
