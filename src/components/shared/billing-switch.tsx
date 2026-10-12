import { SegmentedRadio } from "./segmented-radio";

/**
 * Monthly / Yearly (docs/SPEC.md sections 16 and 17): radios named `interval`, so
 * it doubles as the form field when upgrading. Prices elsewhere switch with
 * `group-has-[[data-option-index='1']:checked]/billing:…`, so no JavaScript is needed.
 */
export function BillingSwitch({
  yearlyLabel,
  name = "interval",
  className,
}: {
  /** "Yearly · 2 months free", worked out from the prices (src/lib/billing/prices.ts). */
  yearlyLabel: string;
  name?: string;
  className?: string;
}) {
  return (
    <SegmentedRadio
      name={name}
      label="Billing period"
      className={className}
      options={[
        { value: "month", label: "Monthly" },
        { value: "year", label: yearlyLabel },
      ]}
    />
  );
}
