import type { ReactNode } from "react";
import { SegmentedRadio } from "./segmented-radio";

type View = { value: string; label: string; content: ReactNode };

/**
 * Two views of a card behind a segmented control ("Sources | Channels").
 * Pure CSS (`:has()`), so it works without JavaScript on every page.
 */
export function ViewToggle({
  name,
  label,
  views,
}: {
  name: string;
  label: string;
  views: [View, View];
}) {
  const [first, second] = views;
  return (
    <div className="group/views flex flex-1 flex-col gap-3">
      <SegmentedRadio
        name={name}
        label={label}
        options={views.map(({ value, label }) => ({ value, label }))}
        className="self-start"
      />
      <div className="flex flex-1 flex-col group-has-[[data-option-index='1']:checked]/views:hidden">
        {first.content}
      </div>
      <div className="hidden flex-1 flex-col group-has-[[data-option-index='1']:checked]/views:flex">
        {second.content}
      </div>
    </div>
  );
}
