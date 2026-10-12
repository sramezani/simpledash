import { BillingSwitch } from "@/components/shared/billing-switch";
import { Button } from "@/components/ui/button";
import { yearlyLabel } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";

/**
 * Monthly / Yearly and "Upgrade" (docs/SPEC.md section 16): a plain form post with
 * `interval`, so upgrading needs no JavaScript. Used by the locked overlay and Settings.
 */
export function UpgradeForm({
  action,
  label = "Upgrade",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  label?: string;
  className?: string;
}) {
  return (
    <form action={action} className={cn("flex flex-wrap items-center gap-3", className)}>
      <BillingSwitch yearlyLabel={yearlyLabel()} />
      <Button type="submit" className="h-9 pointer-coarse:h-11">
        {label}
      </Button>
    </form>
  );
}
