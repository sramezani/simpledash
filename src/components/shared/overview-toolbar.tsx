import type { ReactNode } from "react";
import { RangePicker, type RangeOption } from "./range-picker";

/**
 * The row above the overview (docs/SPEC.md section 11): the site, the date range
 * menu, and the period in words. Shared by the dashboard, public pages and the demo.
 */
export function OverviewToolbar({
  site,
  range,
  options,
  period,
  note,
}: {
  /** The site chip, or the site switcher on the dashboard. */
  site: ReactNode;
  /** The range shown now. */
  range: string;
  /** The date menu's options (rangeMenu in src/lib/ga4/ranges.ts). */
  options: RangeOption[];
  /** "4 Oct – 10 Oct". */
  period: string;
  /** "Google may still be adding to yesterday." */
  note?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <div className="flex max-w-full min-w-0 items-center">{site}</div>
      <RangePicker value={range} options={options} />
      <p className="w-full text-sm text-pretty text-muted-foreground sm:ml-1 sm:w-auto">
        <span className="font-medium text-foreground">{period}</span>
        {note ? ` · ${note}` : null}
      </p>
    </div>
  );
}
