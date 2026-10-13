import { SegmentedRadio } from "./segmented-radio";

/**
 * Monthly / Yearly (docs/SPEC.md sections 16 and 17): radios named `interval`, so
 * it doubles as the form field when upgrading. Prices elsewhere switch with
 * `group-has-[[data-option-index='1']:checked]/billing:…`, so no JavaScript is needed.
 */
export function BillingSwitch({
  yearlyLabel,
  yearlyNote,
  name = "interval",
  defaultValue,
  size,
  className,
}: {
  /** "Yearly · 2 months free" or "Yearly", worked out from the prices (src/lib/billing/prices.ts). */
  yearlyLabel: string;
  /** Said after "Yearly" to screen readers, when the page shows it elsewhere ("2 months free"). */
  yearlyNote?: string;
  name?: string;
  /** "month" (the default) or "year". */
  defaultValue?: "month" | "year";
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <SegmentedRadio
      name={name}
      label="Billing period"
      size={size}
      defaultValue={defaultValue}
      className={className}
      options={[
        { value: "month", label: "Monthly" },
        { value: "year", label: yearlyLabel, srLabel: yearlyNote },
      ]}
    />
  );
}
