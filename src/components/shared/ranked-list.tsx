import type { CSSProperties, ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RankedRow = {
  key: string;
  label: string;
  /** A second, quieter line: the page a search led to, a position. */
  sublabel?: string;
  /** The first value sets the order and the share bar. */
  values: number[];
  /** Shown instead of formatNumber(values[i]) when set, e.g. "25%". */
  display?: (string | null)[];
  icon?: ReactNode;
};

type RankedListProps = {
  /** What each row is: "Source", "Page", "Country". */
  itemLabel: string;
  /** Column names for the values: ["Visitors"] or ["Views", "Visitors"]. */
  columns: string[];
  rows: RankedRow[];
  /** Shown in the list's place when there are no rows (it keeps the same height). */
  empty?: ReactNode;
  /** Rows shown. The list is always this tall; the rest are in the card's Details. */
  initial?: number;
  /** `tall`: two-line rows, for rows with a second line (`sublabel`). */
  size?: "default" | "tall";
};

/** A row's value as shown: its display text, or the number. */
export function cellText(row: RankedRow, column: number): string {
  return row.display?.[column] ?? formatNumber(row.values[column] ?? 0);
}

/** The column names at the right of a card's tabs, lined up with the list's values. */
export function ColumnNames({ columns }: { columns: string[] }) {
  return (
    <span
      className="flex gap-2 pr-2 text-xs font-medium text-muted-foreground @sm:gap-4"
      aria-hidden="true"
    >
      {columns.map((c) => (
        <span key={c} className="w-12 text-right @sm:w-14">
          {c}
        </span>
      ))}
    </span>
  );
}

/**
 * The ranked list used by Sources, Pages, Countries, Devices, Actions and AI traffic
 * (docs/SPEC.md section 18): icon, label and values, a soft blue share bar behind
 * the row that grows in, the full label on hover and for screen readers.
 *
 * It shows the top `initial` rows at a fixed height, whatever the number of rows,
 * so the cards line up and nothing moves. The full list is in the card's Details.
 */
export function RankedList({
  itemLabel,
  columns,
  rows,
  empty,
  initial = 10,
  size = "default",
}: RankedListProps) {
  const max = Math.max(1, ...rows.map((r) => r.values[0] ?? 0));
  const viewport = { "--rows": initial } as CSSProperties;
  const tall = size === "tall";

  return (
    <div
      style={viewport}
      className={
        tall ? "h-[calc(var(--rows)*3.125rem-0.125rem)]" : "h-[calc(var(--rows)*2.375rem-0.125rem)]"
      }
    >
      {rows.length === 0 ? (
        <div className="flex h-full flex-col justify-center">{empty}</div>
      ) : (
        <ol aria-label={`Top ${itemLabel.toLowerCase()} list`} className="flex flex-col gap-0.5">
          {rows.slice(0, initial).map((row) => {
            const share = (row.values[0] ?? 0) / max;
            const spoken = columns.map((c, i) => `${c}: ${cellText(row, i)}`).join(", ");
            return (
              <li
                key={row.key}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150 ease-out hover:bg-muted",
                  tall ? "h-12" : "h-9",
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
                <span className="relative flex min-w-0 flex-1 flex-col">
                  <span className="truncate" title={row.label}>
                    {row.label}
                    <span className="sr-only">
                      {row.sublabel ? `, ${row.sublabel}` : ""}, {spoken}
                    </span>
                  </span>
                  {row.sublabel ? (
                    <span
                      className="truncate text-xs leading-tight text-muted-foreground"
                      aria-hidden="true"
                    >
                      {row.sublabel}
                    </span>
                  ) : null}
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
                      {cellText(row, i)}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
