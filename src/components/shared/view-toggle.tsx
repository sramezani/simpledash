import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SegmentedRadio } from "./segmented-radio";

type View = {
  value: string;
  label: string;
  content: ReactNode;
  /** At the right of the tabs while this view shows, e.g. its column names. */
  aside?: ReactNode;
};

/**
 * Which view shows for each checked tab: the first unless another is checked.
 * Static classes, so Tailwind sees them (up to 4 views).
 */
const SHOWN = [
  "flex group-has-[[data-option-index='1']:checked]/views:hidden group-has-[[data-option-index='2']:checked]/views:hidden group-has-[[data-option-index='3']:checked]/views:hidden",
  "hidden group-has-[[data-option-index='1']:checked]/views:flex",
  "hidden group-has-[[data-option-index='2']:checked]/views:flex",
  "hidden group-has-[[data-option-index='3']:checked]/views:flex",
];

/**
 * The views of a card behind tabs ("Browser | OS | Device"), DataFast-style: the
 * tabs at the top left, the view's column names at the right. Pure CSS (`:has()`),
 * so it works without JavaScript on every page. The view that appears fades in.
 * With one view, its name shows as a single tab, so every card reads the same.
 */
export function ViewToggle({ name, label, views }: { name: string; label: string; views: View[] }) {
  return (
    <div className="group/views flex min-h-0 flex-1 flex-col gap-3">
      {/* The column names wrap under the tabs, on the right, when a narrow card has no room. */}
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2 pointer-coarse:min-h-11">
        {views.length > 1 ? (
          <SegmentedRadio
            name={name}
            label={label}
            options={views.map(({ value, label }) => ({ value, label }))}
            className="shrink-0"
          />
        ) : (
          <span className="inline-flex rounded-lg border bg-muted p-0.5">
            <span className="inline-flex h-7 items-center rounded-md bg-card px-3 text-xs font-medium shadow-xs ring-1 ring-border/60 pointer-coarse:h-11">
              {views[0]?.label}
            </span>
          </span>
        )}
        {views.map((view, i) =>
          view.aside ? (
            <div key={view.value} className={cn("ml-auto min-w-0 items-center", SHOWN[i])}>
              {view.aside}
            </div>
          ) : null,
        )}
      </div>
      {views.map((view, i) => (
        <div
          key={view.value}
          className={cn("min-h-0 flex-1 animate-in flex-col duration-300 fade-in-0", SHOWN[i])}
        >
          {view.content}
        </div>
      ))}
    </div>
  );
}
