import type { CSSProperties, ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RankedRow = {
  key: string;
  label: string;
  /** The first value sets the order and the share bar. */
  values: number[];
  /** Shown instead of formatNumber(values[i]) when set, e.g. "25%". */
  display?: (string | null)[];
  icon?: ReactNode;
};

type RankedListProps = {
  /** Unique on the page: names the "Show more" switch. */
  id: string;
  /** What each row is: "Source", "Page", "Country". */
  itemLabel: string;
  /** Column headings for the values: ["Visitors"] or ["Views", "Visitors"]. */
  columns: string[];
  rows: RankedRow[];
  /** Shown in the list's place when there are no rows (it keeps the same height). */
  empty?: ReactNode;
  /** Rows that fit before "Show more". The list is always this tall. */
  initial?: number;
};

/**
 * The ranked list used by Sources, Pages, Countries, Devices, Actions and AI traffic
 * (docs/SPEC.md section 18): icon, label and value, a soft blue share bar behind the
 * row that grows in, the full label on hover and for screen readers.
 *
 * The list has a fixed height of `initial` rows, whatever the number of rows, so the
 * cards line up and nothing moves. "Show more" turns it into a scrolling list in
 * place, without JavaScript.
 */
export function RankedList({ id, itemLabel, columns, rows, empty, initial = 10 }: RankedListProps) {
  const max = Math.max(1, ...rows.map((r) => r.values[0] ?? 0));
  const more = rows.length - initial;
  const viewport = { "--rows": initial } as CSSProperties;

  if (rows.length === 0) {
    return (
      <div
        style={viewport}
        className="flex h-[calc(var(--rows)*2.375rem+3.375rem)] flex-col justify-center pointer-coarse:h-[calc(var(--rows)*2.375rem+4.125rem)]"
      >
        {empty}
      </div>
    );
  }

  return (
    <div className="group/list flex flex-col gap-1">
      <div
        className="flex items-center justify-between gap-3 px-2 text-xs text-muted-foreground group-has-[[data-show-more]:checked]/list:pr-4"
        aria-hidden="true"
      >
        <span>{itemLabel}</span>
        <span className="flex gap-2 @sm:gap-4">
          {columns.map((c) => (
            <span key={c} className="w-12 text-right @sm:w-14">
              {c}
            </span>
          ))}
        </span>
      </div>
      <ol
        id={`${id}-list`}
        style={viewport}
        className="flex h-[calc(var(--rows)*2.375rem-0.125rem)] [scrollbar-width:thin] flex-col gap-0.5 overflow-hidden group-has-[[data-show-more]:checked]/list:overflow-y-auto group-has-[[data-show-more]:checked]/list:overscroll-contain group-has-[[data-show-more]:checked]/list:pr-2"
      >
        {rows.map((row, index) => {
          const share = (row.values[0] ?? 0) / max;
          const spoken = columns
            .map((c, i) => `${c}: ${row.display?.[i] ?? formatNumber(row.values[i] ?? 0)}`)
            .join(", ");
          return (
            <li
              key={row.key}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150 ease-out hover:bg-muted",
                index >= initial &&
                  "hidden animate-in duration-300 fade-in-0 group-has-[[data-show-more]:checked]/list:flex",
              )}
            >
              <span
                aria-hidden="true"
                style={{ "--share": `${Math.max(share * 100, 1)}%` } as CSSProperties}
                className="absolute inset-y-0 left-0 w-(--share) rounded-md bg-chart-1/12 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] starting:w-0"
              />
              {row.icon ? (
                <span className="relative flex size-4 shrink-0 items-center justify-center">
                  {row.icon}
                </span>
              ) : null}
              <span className="relative min-w-0 flex-1 truncate" title={row.label}>
                {row.label}
                <span className="sr-only">, {spoken}</span>
              </span>
              <span
                className="relative flex shrink-0 gap-2 tabular-nums @sm:gap-4"
                aria-hidden="true"
              >
                {columns.map((c, i) => (
                  <span
                    key={c}
                    className={cn("w-12 text-right @sm:w-14", i > 0 && "text-muted-foreground")}
                  >
                    {row.display?.[i] ?? formatNumber(row.values[i] ?? 0)}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
      {more > 0 ? (
        <label className="inline-flex h-8 cursor-pointer items-center self-start rounded-md px-2 text-sm font-medium text-primary transition-colors duration-150 hover:bg-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring pointer-coarse:h-11">
          <input type="checkbox" data-show-more className="sr-only" aria-controls={`${id}-list`} />
          <span className="group-has-[[data-show-more]:checked]/list:hidden">Show {more} more</span>
          <span className="hidden group-has-[[data-show-more]:checked]/list:inline">
            Show fewer
          </span>
        </label>
      ) : (
        // Keeps the height of the "Show more" line, so every list card is as tall.
        <span aria-hidden="true" className="h-8 pointer-coarse:h-11" />
      )}
    </div>
  );
}
