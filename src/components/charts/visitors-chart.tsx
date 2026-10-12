"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { formatCompact, formatNumber } from "@/lib/format";
import type { ChartNoteMark, ChartPoint } from "@/lib/charts/series";
import { editNote, pickDay } from "./chart-events";

const config = { visitors: { label: "Visitors", color: "var(--chart-1)" } } satisfies ChartConfig;

type TooltipProps = { active?: boolean; payload?: { payload?: ChartPoint }[] };

function VisitorsTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="text-muted-foreground">{point.label}</p>
      <p className="font-medium tabular-nums">
        {formatNumber(point.visitors)} {point.visitors === 1 ? "visitor" : "visitors"}
        {point.pending !== null && point.solid === null ? " · still updating" : ""}
      </p>
    </div>
  );
}

/**
 * The visitors line on the dashboard (shadcn charts, Recharts). The last part is
 * dashed while Google is still adding to yesterday. Nothing animates on load.
 */
type VisitorsChartProps = {
  points: ChartPoint[];
  /** Chart notes (dashboard only): a marker on their day; clicking one opens it. */
  notes?: ChartNoteMark[];
  /** Clicking a day starts a note on it (dashboard only). */
  canAddNotes?: boolean;
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
}: VisitorsChartProps) {
  const ticks = points.filter((p) => p.tick).map((p) => p.key);
  const tickLabel = new Map(points.map((p) => [p.key, p.tick]));
  // A week or a year has few points: show each one as a dot.
  const dot = points.length <= 12 ? { r: 3, strokeWidth: 2 } : false;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full @2xl:h-64">
      <AreaChart
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
            <stop offset="0%" stopColor="var(--color-visitors)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-visitors)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
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
        <ChartTooltip cursor content={<VisitorsTooltip />} />
        {notes.map((note) => (
          <ReferenceLine
            key={note.id}
            x={note.key}
            className="stroke-warning"
            strokeDasharray="2 3"
            label={<NoteMarker note={note} />}
          />
        ))}
        <Area
          dataKey="solid"
          type="linear"
          stroke="var(--color-visitors)"
          strokeWidth={2}
          fill="url(#visitors-fill)"
          isAnimationActive={false}
          dot={dot}
          activeDot={{ r: 4 }}
        />
        <Area
          dataKey="pending"
          type="linear"
          stroke="var(--color-visitors)"
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="url(#visitors-fill)"
          fillOpacity={0.5}
          isAnimationActive={false}
          dot={dot}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
