import { useId } from "react";
import { smoothPath } from "@/lib/charts/path";
import { cn } from "@/lib/utils";

/**
 * A small line of daily visitors, rendered on the server with no chart JavaScript
 * (the All sites cards, docs/SPEC.md section 28.1). The same smooth light-blue curve
 * and fading fill as the main chart; the last segment is dashed while Google may
 * still be adding to it. Decorative: the card says the numbers in words.
 */
export function Sparkline({
  values,
  pendingLast = false,
  className,
}: {
  values: number[];
  pendingLast?: boolean;
  className?: string;
}) {
  const gradient = useId();
  if (values.length < 2) return <div className={cn("h-12", className)} aria-hidden="true" />;
  const top = Math.max(...values, 1);
  const n = values.length - 1;
  // A little room at the top and bottom, so the stroke isn't cut off.
  const xy = values.map((v, i) => ({ x: (i / n) * 100, y: 30 - (v / top) * 26 }));
  const line = smoothPath(xy);
  const solid = pendingLast ? smoothPath(xy, 0, n - 1) : line;
  const pending = pendingLast ? smoothPath(xy, n - 1, n) : "";
  const area = `${line}L100,32L0,32Z`;
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-12 w-full overflow-visible text-chart-1", className)}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradient})`} />
      <path
        d={solid}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {pending ? (
        <path
          d={pending}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
