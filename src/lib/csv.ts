/**
 * CSV for "Download CSV" (docs/SPEC.md section 13): a plain-word header row,
 * RFC 4180 quoting, and formula-looking cells made safe. Page titles and sources
 * come from the open internet and could carry spreadsheet formulas.
 */

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Numbers are written as numbers; anything else starting like a formula gets a leading '.
  if (typeof value !== "number" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** simpledash-<domain>-<card>-<start>-<end>.csv, with only safe filename characters. */
export function csvFilename(domain: string, card: string, start: string, end: string): string {
  const safe = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "site";
  return `simpledash-${safe(domain)}-${safe(card)}-${start}-${end}.csv`;
}
