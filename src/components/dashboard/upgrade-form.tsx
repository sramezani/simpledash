import { ArrowRightIcon } from "lucide-react";
import { BillingSwitch } from "@/components/shared/billing-switch";
import { PlanCard } from "@/components/shared/plan-card";
import { Button } from "@/components/ui/button";
import { plans, type BillingInterval } from "@/config/plans";
import { yearlyLabel, yearlySaving } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";

/**
 * Upgrading to Pro (docs/SPEC.md section 16): the Monthly / Yearly switch above Pro's
 * compact card and one submit button. A plain form post with `interval`, so upgrading
 * needs no JavaScript. Used by Settings → Billing and the "part of Pro" panels.
 */
export function UpgradeForm({
  action,
  defaultInterval = "month",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  /** Where the switch starts. */
  defaultInterval?: BillingInterval;
  className?: string;
}) {
  const { pro } = plans;
  return (
    <form action={action} className={cn("group/billing @container flex flex-col gap-4", className)}>
      <BillingSwitch
        yearlyLabel={yearlyLabel()}
        defaultValue={defaultInterval}
        className="self-start"
      />
      <PlanCard
        size="compact"
        name={pro.name}
        summary={pro.summary}
        prices={pro.prices}
        yearlySaving={yearlySaving(pro.prices)}
        features={pro.features}
        footer={
          <Button type="submit" className="h-10 gap-2">
            Upgrade to {pro.name}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Button>
        }
      />
    </form>
  );
}
