import { FREE_HISTORY_DAYS, plans, type PlanId } from "@/config/plans";
import { monthsFreeOnYearly } from "@/lib/billing/prices";
import { formatPrice } from "@/lib/format";

/**
 * Plan facts inside content (docs/SPEC.md section 30), read from src/config/plans.ts so a
 * page can never show an old price. A test fails if content types a price itself.
 */

/** "$9", "$90" or "$0". */
export function Price({ plan, interval }: { plan: PlanId; interval: "month" | "year" }) {
  return <>{formatPrice(plans[plan].prices[interval])}</>;
}

/** How many days Free shows: "30". */
export function FreeDays() {
  return <>{FREE_HISTORY_DAYS}</>;
}

/** "2": the months a yearly plan saves against monthly. */
export function MonthsFree() {
  return <>{monthsFreeOnYearly()}</>;
}

/** A plan's feature list, exactly as the pricing section shows it. */
export function PlanFeatures({ plan }: { plan: PlanId }) {
  return (
    <ul>
      {plans[plan].features.map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  );
}
