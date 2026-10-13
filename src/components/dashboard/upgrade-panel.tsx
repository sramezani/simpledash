import { CircleDollarSignIcon, LayoutGridIcon, SearchIcon, SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import { plans, type BillingInterval } from "@/config/plans";
import type { PlanState } from "@/lib/billing/plan";
import { cn } from "@/lib/utils";
import { UpgradeForm } from "./upgrade-form";

/** The Growth-only parts (docs/SPEC.md section 28.1), in plain words. */
const FEATURES = {
  sites: {
    Icon: LayoutGridIcon,
    title: "Several sites are part of Growth",
    text: "Add up to 10 Google Analytics sites, each with its own dashboard, notes, Monday email block and public page, and see them all on one page.",
  },
  search: {
    Icon: SearchIcon,
    title: "Google search insights are part of Growth",
    text: "See the searches that bring people to your site from Google: the ones close to page 1, what changed, and the pages people see but don't click.",
  },
  revenue: {
    Icon: CircleDollarSignIcon,
    title: "Revenue is part of Growth",
    text: "Connect Stripe with a read-only key to see revenue and new customers next to your visitors, and which sources bring sales.",
  },
} as const;

export type GrowthFeature = keyof typeof FEATURES;

/**
 * "Upgrade to Growth" (docs/SPEC.md section 28.1): what the feature is, Growth's price
 * with the Monthly / Yearly switch, and one button. It takes the feature's place for
 * Starter and trials, never an error.
 */
export function UpgradePanel({
  feature,
  plan,
  upgrade,
  children,
  className,
}: {
  feature: GrowthFeature;
  plan: PlanState;
  upgrade: (formData: FormData) => Promise<void>;
  /** Below the text, e.g. "Switch to this site instead". */
  children?: ReactNode;
  className?: string;
}) {
  const { Icon, title, text } = FEATURES[feature];
  const interval: BillingInterval = plan.kind === "paid" && plan.interval ? plan.interval : "month";
  return (
    <section
      aria-labelledby={`upgrade-${feature}-title`}
      className={cn(
        "@container flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-start @2xl:gap-8">
        <div className="flex flex-1 flex-col gap-2">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h2 id={`upgrade-${feature}-title`} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">{text}</p>
          <p className="flex items-start gap-2 text-xs text-pretty text-muted-foreground">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {plan.kind === "trial"
              ? `Your free trial includes ${plans.starter.name}. Upgrading now keeps the rest of it: the first charge is when it ends.`
              : plan.kind === "paid"
                ? `You're on ${plans[plan.plan].name}. Stripe shows the exact amount before you confirm.`
                : "Prices include VAT. Payments are handled by Stripe."}
          </p>
          {children}
        </div>
        <UpgradeForm
          action={upgrade}
          offer={["growth"]}
          defaultInterval={interval}
          className="w-full @2xl:max-w-sm"
        />
      </div>
    </section>
  );
}
