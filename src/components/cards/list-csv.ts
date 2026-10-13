import type { RankedRow } from "@/components/shared/ranked-list";
import { toCsv } from "@/lib/csv";

/**
 * The CSV a list card's Details downloads: the rows shown, with a plain-word header.
 * Numbers stay numbers; shown text (like "34%") is kept as text. Made safe for
 * spreadsheets by toCsv.
 */
export function listCsv(
  itemLabel: string,
  columns: string[],
  rows: RankedRow[],
  /** The second line's column, e.g. "Page" for a list of searches. */
  sublabelHeader?: string,
): string {
  return toCsv(
    [itemLabel, ...(sublabelHeader ? [sublabelHeader] : []), ...columns],
    rows.map((r) => [
      r.label,
      ...(sublabelHeader ? [r.sublabel ?? ""] : []),
      ...columns.map((_, i) => r.display?.[i] ?? r.values[i] ?? 0),
    ]),
  );
}
