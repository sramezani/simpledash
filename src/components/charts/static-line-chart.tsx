import { formatCompact } from "@/lib/format";
import { niceTicks, type ChartPoint } from "@/lib/charts/series";
import { cn } from "@/lib/utils";

/**
 * The visitors line as plain SVG, rendered on the server: no chart JavaScript
 * (landing demo and public pages, docs/SPEC.md sections 15 and 17). The lines
 * stretch with the card while the labels stay crisp HTML.
 */
export function StaticLineChart({ points }: { points: ChartPoint[] }) {
  const ticks = niceTicks(Math.max(...points.map((p) => p.visitors), 0));
  const top = ticks.at(-1) ?? 1;
  const n = Math.max(points.length - 1, 1);
  const x = (i: number) => (points.length === 1 ? 50 : (i / n) * 100);
  const y = (v: number) => 100 - (v / top) * 100;

  const path = (key: "solid" | "pending") => {
    let d = "";
    let pen = false;
    points.forEach((p, i) => {
      const v = p[key];
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`;
      pen = true;
    });
    return d;
  };
  const solid = path("solid");
  const lastSolid = points.reduce((last, p, i) => (p.solid !== null ? i : last), -1);
  const area =
    lastSolid > 0 ? `${solid}L${x(lastSolid).toFixed(2)},100L${x(0).toFixed(2)},100Z` : "";
  // On a narrow card, every other label is left out so they don't run into each other.
  let ordinal = -1;

  return (
    <div
      className="relative h-56 w-full pb-6 pl-10 text-xs text-muted-foreground @2xl:h-64"
      aria-hidden="true"
    >
      {ticks.map((t) => (
        <span
          key={t}
          className="absolute left-0 w-8 -translate-y-1/2 text-right tabular-nums"
          style={{ top: `calc((100% - 1.5rem) * ${y(t) / 100})` }}
        >
          {formatCompact(t)}
        </span>
      ))}
      <div className="relative h-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {ticks.map((t) => (
            <line
              key={t}
              x1="0"
              x2="100"
              y1={y(t)}
              y2={y(t)}
              className="stroke-border"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {area ? <path d={area} className="fill-chart-1/10" /> : null}
          <path
            d={solid}
            fill="none"
            className="stroke-chart-1"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path("pending")}
            fill="none"
            className="stroke-chart-1"
            strokeWidth="2"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {points.map((p, i) =>
          p.tick ? (
            <span
              key={p.key}
              className={cn(
                "absolute top-full mt-1.5 whitespace-nowrap",
                i === 0 ? "" : i === points.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
                ++ordinal % 2 === 1 && "hidden @lg:inline",
              )}
              style={{ left: `${x(i)}%` }}
            >
              {p.tick}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
