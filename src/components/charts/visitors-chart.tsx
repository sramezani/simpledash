"use client";

import { Area, Bar, CartesianGrid, ComposedChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { formatCompact, formatMoney, formatNumber } from "@/lib/format";
import type { ChartNoteMark, ChartPoint } from "@/lib/charts/series";
import { editNote, pickDay } from "./chart-events";

const config = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
  revenue: { label: "Revenue", color: "var(--chart-4)" },
} satisfies ChartConfig;

type TooltipProps = {
  active?: boolean;
  payload?: { payload?: ChartPoint }[];
  /** The revenue's currency, when the points carry revenue. */
  currency?: string;
};

/** The same tooltip as the server-rendered chart's (StaticLineChart), plus revenue on Growth. */
function VisitorsTooltip({ active, payload, currency }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="text-muted-foreground">{point.label}</p>
      <p className="font-medium tabular-nums">
        {formatNumber(point.visitors)} {point.visitors === 1 ? "visitor" : "visitors"}
      </p>
      {currency && point.revenue !== undefined ? (
        <p className="flex items-center gap-1.5 tabular-nums">
          <span aria-hidden="true" className="size-2 rounded-sm bg-chart-4/60" />
          {formatMoney(point.revenue, currency)} revenue
        </p>
      ) : null}
      {point.pending !== null && point.solid === null ? (
        <p className="text-warning">Still updating</p>
      ) : null}
    </div>
  );
}

/**
 * The visitors line on the dashboard (shadcn charts, Recharts): a smooth light-blue
 * line over a soft fill, drawn in from the left, matching the server-rendered chart
 * on public pages. The last part is dashed while it is still updating.
 */
type VisitorsChartProps = {
  points: ChartPoint[];
  /** Chart notes (dashboard only): a marker on their day; clicking one opens it. */
  notes?: ChartNoteMark[];
  /** Clicking a day starts a note on it (dashboard only). */
  canAddNotes?: boolean;
  /** Revenue's currency: the points' `revenue` shows as bars under the line (Growth). */
  revenueCurrency?: string;
};

/** A note marker: a small dot at the top of a dashed line, with the note as its tooltip. */
function NoteMarker({
  viewBox,
  note,
}: {
  viewBox?: { x?: number; y?: number };
  note: ChartNoteMark;
}) {
  const x = viewBox?.x ?? 0;
  const y = (viewBox?.y ?? 0) + 6;
  return (
    <g className="cursor-pointer" onClick={() => editNote(note.id)}>
      <title>{note.text}</title>
      <circle cx={x} cy={y} r={9} fill="transparent" />
      <circle cx={x} cy={y} r={4.5} className="fill-card stroke-warning" strokeWidth={2} />
    </g>
  );
}

export default function VisitorsChart({
  points,
  notes = [],
  canAddNotes = false,
  revenueCurrency,
}: VisitorsChartProps) {
  const revenue = !!revenueCurrency && points.some((p) => p.revenue !== undefined);
  const ticks = points.filter((p) => p.tick).map((p) => p.key);
  const tickLabel = new Map(points.map((p) => [p.key, p.tick]));
  const activeDot = { r: 5, strokeWidth: 2.5, className: "fill-card stroke-chart-1" };
  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-56 w-full animate-chart-reveal @2xl:h-64 [&_.recharts-cartesian-grid_line]:stroke-border"
    >
      <ComposedChart
        data={points}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        accessibilityLayer
        onClick={
          canAddNotes
            ? (state) => {
                const key = state?.activeLabel;
                if (typeof key === "string" || typeof key === "number") pickDay(String(key));
              }
            : undefined
        }
        className={canAddNotes ? "cursor-crosshair" : undefined}
      >
        <defs>
          <linearGradient id="visitors-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-visitors)" stopOpacity={0.26} />
            <stop offset="100%" stopColor="var(--color-visitors)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis
          dataKey="key"
          ticks={ticks}
          tickFormatter={(key: string) => tickLabel.get(key) ?? ""}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={12}
        />
        <YAxis
          width={40}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        {revenue ? (
          // Revenue keeps to the lower quarter, under the line, on its own hidden scale.
          <YAxis
            yAxisId="revenue"
            hide
            domain={[0, (max: number) => Math.max(max, 1) * 4]}
          />
        ) : null}
        <ChartTooltip
          cursor={{ stroke: "var(--color-visitors)", strokeOpacity: 0.5, strokeDasharray: "3 3" }}
          content={<VisitorsTooltip currency={revenue ? revenueCurrency : undefined} />}
        />
        {revenue ? (
          <Bar
            dataKey="revenue"
            yAxisId="revenue"
            fill="var(--color-revenue)"
            fillOpacity={0.35}
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        ) : null}
        {notes.map((note) => (
          <ReferenceLine
            key={note.id}
            x={note.key}
            className="stroke-warning"
            strokeDasharray="2 3"
            label={<NoteMarker note={note} />}
          />
        ))}
        {/* One soft fill under the whole line, then the solid and dashed parts on top. */}
        <Area
          dataKey="visitors"
          type="monotone"
          stroke="none"
          fill="url(#visitors-fill)"
          isAnimationActive={false}
          dot={false}
          activeDot={false}
          tooltipType="none"
        />
        <Area
          dataKey="solid"
          type="monotone"
          stroke="var(--color-visitors)"
          strokeWidth={2.25}
          strokeLinecap="round"
          fill="none"
          isAnimationActive={false}
          dot={false}
          activeDot={activeDot}
        />
        <Area
          dataKey="pending"
          type="monotone"
          stroke="var(--color-visitors)"
          strokeWidth={2.25}
          strokeDasharray="5 5"
          strokeLinecap="round"
          fill="none"
          isAnimationActive={false}
          dot={false}
          activeDot={activeDot}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
