"use client";

import dynamic from "next/dynamic";
import type { ChartNoteMark, ChartPoint } from "@/lib/charts/series";

/** Recharts loads in its own chunk, after the page. The placeholder has the chart's size. */
const VisitorsChart = dynamic(() => import("./visitors-chart"), {
  ssr: false,
  loading: () => <div className="h-56 w-full rounded-lg bg-muted/40 @2xl:h-64" />,
});

export function VisitorsChartLazy(props: {
  points: ChartPoint[];
  notes?: ChartNoteMark[];
  canAddNotes?: boolean;
  revenueCurrency?: string;
}) {
  return <VisitorsChart {...props} />;
}
