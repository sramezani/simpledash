import type { ReactNode } from "react";
import { ColumnNames, RankedList, type RankedRow } from "@/components/shared/ranked-list";
import { ViewToggle } from "@/components/shared/view-toggle";
import { csvFilename } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { ListDetails } from "./list-details";

/** What the Details download is named after: the site and the period's days. */
export type ListExport = { site: string; start: string; end: string };

export type ListView = {
  value: string;
  /** The tab: "City". */
  label: string;
  /** What each row is: "City". */
  itemLabel: string;
  columns: string[];
  rows: RankedRow[];
  /** Shown in the list's place when there are no rows. */
  empty: ReactNode;
  /** Two-line rows (with a `sublabel`), and the second line's column in the CSV. */
  sublabelHeader?: string;
  /** Replaces the ranked list in the card (the rows still feed Details). */
  content?: ReactNode;
  /** A line of plain words above the list. */
  intro?: ReactNode;
  /** Rows in the card for this view (the card's `initial` otherwise). */
  initial?: number;
  /** Leave the column names out of the tab row (the view says them itself). */
  hideColumns?: boolean;
  /** The columns the card shows, when Details and its CSV have more (the first ones of `columns`). */
  cardColumns?: string[];
};

type ListCardProps = {
  id: string;
  /** Read by screen readers only; the tabs name the card on screen. */
  title: string;
  /** A visible heading instead (the Google search card): it replaces the hidden title. */
  heading?: ReactNode;
  /** What the card counts, in plain words: shown in Details. */
  help: string;
  views: ListView[];
  /** For the Details download's file name. */
  exportInfo: ListExport;
  /** Above the tabs, e.g. the AI card's total. */
  intro?: ReactNode;
  /** Replaces the tabs and lists, e.g. when there's nothing at all to show. */
  children?: ReactNode;
  /** Rows in the card before Details. */
  initial?: number;
  /** Greyed out: cached numbers that can't be refreshed. */
  dimmed?: boolean;
};

/**
 * A list card (docs/SPEC.md section 11), DataFast-style: tabs at the top, the
 * view's column names at the right, the top rows at a fixed height, and "Details"
 * underneath, which opens every row with search and a CSV download.
 * It is a size container, so the rows adapt to the card's width.
 */
export function ListCard({
  id,
  title,
  heading,
  help,
  views,
  exportInfo,
  intro,
  children,
  initial = 10,
  dimmed,
}: ListCardProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="@container flex min-w-0 flex-col rounded-2xl border bg-card text-card-foreground shadow-xs"
    >
      {heading ? null : (
        <h2 id={`${id}-title`} className="sr-only">
          {title}
        </h2>
      )}
      <div
        className={cn(
          "flex flex-1 flex-col gap-3 px-3 pt-3 pb-2 @sm:px-4 @sm:pt-4",
          dimmed && "opacity-55 grayscale",
        )}
      >
        {heading}
        {children ?? (
          <>
            {intro}
            <ViewToggle
              name={`${id}-view`}
              label={`Show ${views.map((v) => v.label.toLowerCase()).join(" or ")}`}
              views={views.map((view) => ({
                value: view.value,
                label: view.label,
                aside:
                  view.rows.length && !view.hideColumns ? (
                    <ColumnNames columns={view.cardColumns ?? view.columns} />
                  ) : null,
                content: (
                  <div className="flex flex-1 flex-col gap-2">
                    {view.intro && view.rows.length ? view.intro : null}
                    {view.content ?? (
                      <RankedList
                        itemLabel={view.itemLabel}
                        columns={view.cardColumns ?? view.columns}
                        rows={view.rows}
                        empty={view.empty}
                        initial={view.initial ?? initial}
                        size={view.sublabelHeader ? "tall" : "default"}
                      />
                    )}
                    <div className="flex h-8 items-center justify-center pointer-coarse:h-11">
                      {view.rows.length ? (
                        <ListDetails
                          title={view.label}
                          description={help}
                          itemLabel={view.itemLabel}
                          columns={view.columns}
                          rows={view.rows}
                          sublabelHeader={view.sublabelHeader}
                          fileName={csvFilename(
                            exportInfo.site,
                            `${id}-${view.value}`,
                            exportInfo.start,
                            exportInfo.end,
                          )}
                        />
                      ) : null}
                    </div>
                  </div>
                ),
              }))}
            />
          </>
        )}
      </div>
    </section>
  );
}
