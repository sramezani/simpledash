import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SegmentedRadioProps = {
  /** Form field name; also groups the radios, so it must be unique on the page. */
  name: string;
  label: string;
  /** Two to four options. `srLabel` adds words for screen readers only. */
  options: { value: string; label: string; srLabel?: string }[];
  /** The value checked at first. Defaults to the first option. */
  defaultValue?: string;
  /** `md`: a larger control, e.g. the pricing section's Monthly / Yearly. */
  size?: "sm" | "md";
  className?: string;
};

/** Where the sliding pill sits for each checked option (static classes, so Tailwind sees them). */
const slide = [
  "",
  "group-has-[[data-option-index='1']:checked]/segmented:translate-x-full",
  "group-has-[[data-option-index='2']:checked]/segmented:translate-x-[200%]",
  "group-has-[[data-option-index='3']:checked]/segmented:translate-x-[300%]",
].join(" ");

/**
 * Radio buttons styled as a segmented control, with a pill that slides to the
 * checked option. No JavaScript: arrow keys move between options natively, the
 * slide is a CSS transition, and other parts react with CSS `:has()` through the
 * `data-option-index` attribute (see ViewToggle and BillingSwitch). Options share
 * one width, so the pill is always the right size.
 */
export function SegmentedRadio({
  name,
  label,
  options,
  defaultValue,
  size = "sm",
  className,
}: SegmentedRadioProps) {
  const checked = defaultValue ?? options[0]?.value;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{ "--segments": options.length } as CSSProperties}
      className={cn(
        "group/segmented relative inline-grid auto-cols-fr grid-flow-col rounded-lg border bg-muted p-0.5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/var(--segments))] rounded-md bg-card shadow-xs ring-1 ring-border/60 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          slide,
        )}
      />
      {options.map((option, i) => (
        <label key={option.value} className="relative">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === checked}
            data-option-index={i}
            className="peer sr-only"
          />
          <span
            className={cn(
              "inline-flex w-full cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap text-muted-foreground transition-colors duration-200 ease-out peer-checked:text-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-ring hover:text-foreground pointer-coarse:h-11",
              size === "md" ? "h-9 px-5 text-sm" : "h-7 px-3 text-xs",
            )}
          >
            {option.label}
            {option.srLabel ? <span className="sr-only"> {option.srLabel}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}
