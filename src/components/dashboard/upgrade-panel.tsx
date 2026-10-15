import { CircleDollarSignIcon, MailIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { plans } from "@/config/plans";
import { cn } from "@/lib/utils";
import { UpgradeForm } from "./upgrade-form";

/** The Pro-only parts (docs/SPEC.md section 16), in plain words. */
const FEATURES = {
  search: {
    Icon: SearchIcon,
    title: `Google search insights are part of ${plans.pro.name}`,
    text: "See the searches that bring people to your site from Google: the ones close to page 1, what changed, and the pages people see but don't click.",
  },
  revenue: {
    Icon: CircleDollarSignIcon,
    title: `Revenue is part of ${plans.pro.name}`,
    text: "Connect Stripe with a read-only key to see revenue and new customers next to your visitors, and which sources bring sales.",
  },
  email: {
    Icon: MailIcon,
    title: `The Monday email is part of ${plans.pro.name}`,
    text: "Every Monday, last week's numbers for each of your sites in your inbox: visitors, signups, top sources and pages, and what changed.",
  },
} as const;

export type ProFeature = keyof typeof FEATURES;

/**
 * "Upgrade to Pro" (docs/SPEC.md section 16): what the feature is, Pro's price with the
 * Monthly / Yearly switch, and one button. It takes the feature's place on Free, never
 * an error.
 */
export function UpgradePanel({
  feature,
  upgrade,
  className,
}: {
  feature: ProFeature;
  upgrade: (formData: FormData) => Promise<void>;
  className?: string;
}) {
  const { Icon, title, text } = FEATURES[feature];
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
            Prices include tax. Payments are handled by Stripe; cancel any time.
          </p>
        </div>
        <UpgradeForm action={upgrade} className="w-full @2xl:max-w-sm" />
      </div>
    </section>
  );
}
