import { ArrowRightIcon } from "lucide-react";
import { BillingSwitch } from "@/components/shared/billing-switch";
import { PlanCard } from "@/components/shared/plan-card";
import { Button } from "@/components/ui/button";
import { plans, type BillingInterval, type PlanId } from "@/config/plans";
import { yearlyLabel, yearlySaving } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";

/**
 * Choosing a plan (docs/SPEC.md sections 16 and 28.1): the Monthly / Yearly switch
 * above a compact card per plan, each with its own submit button (`plan`). A plain
 * form post with `plan` and `interval`, so upgrading needs no JavaScript.
 * Used by the locked overlay, Settings → Billing and the "Upgrade to Growth" panel.
 */
export function UpgradeForm({
  action,
  offer = ["starter", "growth"],
  defaultInterval = "month",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  /** The plans to offer, in order. The last one is highlighted. */
  offer?: readonly PlanId[];
  /** Where the switch starts, e.g. a yearly Starter customer's interval. */
  defaultInterval?: BillingInterval;
  className?: string;
}) {
  return (
    <form action={action} className={cn("group/billing @container flex flex-col gap-4", className)}>
      <BillingSwitch
        yearlyLabel={yearlyLabel()}
        defaultValue={defaultInterval}
        className="self-start"
      />
      <div className={cn("grid gap-3", offer.length > 1 && "@lg:grid-cols-2")}>
        {offer.map((id, i) => {
          const plan = plans[id];
          const highlight = i === offer.length - 1 && offer.length > 1;
          return (
            <PlanCard
              key={id}
              size="compact"
              highlight={highlight}
              name={plan.name}
              summary={plan.summary}
              prices={plan.prices}
              yearlySaving={yearlySaving(plan.prices)}
              features={plan.features}
              footer={
                <Button
                  type="submit"
                  name="plan"
                  value={id}
                  variant={highlight || offer.length === 1 ? "default" : "outline"}
                  className="h-10 gap-2"
                >
                  {offer.length === 1 ? `Upgrade to ${plan.name}` : `Choose ${plan.name}`}
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Button>
              }
            />
          );
        })}
      </div>
    </form>
  );
}
