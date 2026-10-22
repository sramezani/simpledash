import type { ReactNode } from "react";
import { RangePicker, type RangePickerProps } from "./range-picker";

/**
 * The row above the overview (docs/SPEC.md section 11): the site, the date range
 * menu, the period in words, and the live count at the right. Shared by the dashboard,
 * public pages and the demo.
 */
export function OverviewToolbar({
  site,
  menu,
  period,
  note,
  live,
}: {
  /** The site chip, or the site switcher on the dashboard. */
  site: ReactNode;
  /** The date menu (rangeMenu in src/lib/ga4/ranges.ts). */
  menu: RangePickerProps;
  /** "4 Oct – 10 Oct", or null when the menu's label already says it (a custom range). */
  period: string | null;
  /** "Google may still be adding to yesterday." */
  note?: string | null;
  /** "● 3 live", which opens the live view. */
  live?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <div className="flex max-w-full min-w-0 items-center">{site}</div>
      <RangePicker {...menu} />
      {period || note ? (
        // On a phone the period wraps to its own line under the rest, so the live count stays up top.
        <p className="w-full text-xs text-pretty text-muted-foreground max-sm:order-last sm:ml-1 sm:w-auto">
          {period}
          {period && note ? " · " : null}
          {note}
        </p>
      ) : null}
      {live ? <div className="ml-auto flex">{live}</div> : null}
    </div>
  );
}
