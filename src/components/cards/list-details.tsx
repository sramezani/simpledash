"use client";

import { DownloadIcon, ScanIcon, XIcon } from "lucide-react";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { cellText, type RankedRow } from "@/components/shared/ranked-list";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/text";
import { cn } from "@/lib/utils";
import { listCsv } from "./list-csv";

type ListDetailsProps = {
  /** The view's name: "City", "Browser". */
  title: string;
  /** What the list counts, in plain words (the card's help). */
  description: string;
  /** What each row is, for the first column: "City". */
  itemLabel: string;
  columns: string[];
  rows: RankedRow[];
  /** "simpledash-mysite-com-cities-2026-10-05-2026-10-11.csv". */
  fileName: string;
  /** The second line's column in the CSV, e.g. "Page" (rows show it under the label). */
  sublabelHeader?: string;
  /** The trigger's words. */
  triggerLabel?: string;
};

/**
 * A list card's "Details" (DataFast-style): a modal with every row of the view,
 * a search box, and a CSV download of the rows shown. Centred on wide screens,
 * nearly full height on phones; Escape, the X and a click outside close it.
 */
export function ListDetails({
  title,
  description,
  itemLabel,
  columns,
  rows,
  fileName,
  sublabelHeader,
  triggerLabel = "Details",
}: ListDetailsProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const shown = useMemo(
    () => rows.filter((r) => matchesSearch(deferred, r.label, r.sublabel)),
    [rows, deferred],
  );

  function download() {
    const csv = listCsv(itemLabel, columns, shown, sublabelHeader);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  const count = `${formatNumber(rows.length)} ${rows.length === 1 ? "row" : "rows"}`;

  return (
    <Dialog onOpenChange={(open) => !open && setQuery("")}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mx-auto inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground data-[state=open]:bg-muted pointer-coarse:h-11"
        >
          <ScanIcon className="size-3.5" aria-hidden="true" />
          {triggerLabel}
          <span className="sr-only">: every {itemLabel.toLowerCase()}</span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // On touch screens, don't open the keyboard straight away.
          if (window.matchMedia("(pointer: coarse)").matches) {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }
        }}
        className={cn(
          "flex max-h-[min(46rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-lg sm:max-w-2xl",
          // A long list keeps its height while searching, so the modal doesn't jump.
          rows.length > 8 && "h-[min(46rem,calc(100dvh-2rem))]",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 border-b px-4 py-3.5 sm:flex-nowrap sm:px-5">
          <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
          <SearchInput
            id={`${id}-search`}
            label={`Search ${title.toLowerCase()}`}
            value={query}
            onChange={setQuery}
            className="order-last w-full sm:order-none sm:w-60"
          />
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 px-3 pointer-coarse:h-11"
              onClick={download}
              disabled={shown.length === 0}
            >
              <DownloadIcon className="size-4" aria-hidden="true" />
              CSV
              <span className="sr-only">
                : download {shown.length === rows.length ? "the list" : "the rows found"}
              </span>
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="size-9 p-0 pointer-coarse:size-11">
                <XIcon className="size-5" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </div>
        <DialogDescription className="border-b px-4 py-2 text-xs sm:px-5">
          {description}
        </DialogDescription>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-popover text-xs text-muted-foreground shadow-[0_1px_0_var(--border)]">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-medium sm:px-5">
                  {itemLabel}
                </th>
                {columns.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="w-20 px-4 py-2.5 text-right font-medium sm:w-28 sm:px-5"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr
                  key={row.key}
                  className="transition-colors duration-100 odd:bg-muted/40 hover:bg-muted"
                >
                  <td className="max-w-0 px-4 py-2.5 sm:px-5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      {row.icon ? (
                        <span className="flex size-4 shrink-0 items-center justify-center">
                          {row.icon}
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate" title={row.label}>
                          {row.label}
                        </span>
                        {row.sublabel ? (
                          <span
                            className="truncate text-xs text-muted-foreground"
                            title={row.sublabel}
                          >
                            {row.sublabel}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  {columns.map((c, i) => (
                    <td
                      key={c}
                      className={cn(
                        "px-4 py-2.5 text-right tabular-nums sm:px-5",
                        i > 0 && "text-muted-foreground",
                      )}
                    >
                      {cellText(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          ) : null}
        </div>
        <p
          className="border-t px-4 py-2.5 text-xs text-muted-foreground sm:px-5"
          aria-live="polite"
        >
          {shown.length === rows.length ? count : `${formatNumber(shown.length)} of ${count}`}
        </p>
      </DialogContent>
    </Dialog>
  );
}
