import type { RankedRow } from "@/components/shared/ranked-list";
import { toCsv } from "@/lib/csv";

/**
 * The CSV a list card's Details downloads: the rows shown, with a plain-word header.
 * Numbers stay numbers; shown text (like "34%") is kept as text. Made safe for
 * spreadsheets by toCsv.
 */
export function listCsv(itemLabel: string, columns: string[], rows: RankedRow[]): string {
  return toCsv(
    [itemLabel, ...columns],
    rows.map((r) => [r.label, ...columns.map((_, i) => r.display?.[i] ?? r.values[i] ?? 0)]),
  );
}
