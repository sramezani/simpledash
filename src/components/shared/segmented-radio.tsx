import { cn } from "@/lib/utils";

type SegmentedRadioProps = {
  /** Form field name; also groups the radios, so it must be unique on the page. */
  name: string;
  label: string;
  options: { value: string; label: string }[];
  /** The value checked at first. Defaults to the first option. */
  defaultValue?: string;
  className?: string;
};

/**
 * Radio buttons styled as a segmented control. No JavaScript: arrow keys move
 * between options natively, and other parts react with CSS `:has()` through the
 * `data-option-index` attribute (see ViewToggle and BillingSwitch).
 */
export function SegmentedRadio({
  name,
  label,
  options,
  defaultValue,
  className,
}: SegmentedRadioProps) {
  const checked = defaultValue ?? options[0]?.value;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-lg border bg-muted p-0.5", className)}
    >
      {options.map((option, i) => (
        <label key={option.value} className="relative flex-1">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === checked}
            data-option-index={i}
            className="peer sr-only"
          />
          <span className="inline-flex h-7 w-full cursor-pointer items-center justify-center rounded-md px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 ease-out peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-ring hover:text-foreground pointer-coarse:h-11">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
