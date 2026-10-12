import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BillingSwitch } from "@/components/shared/billing-switch";
import { Container } from "@/components/shared/container";
import { RollingPrice, Swap, YearlyOnly } from "@/components/shared/rolling-price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { monthsFreeLabel, yearlySaving } from "@/lib/billing/prices";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HandNote } from "./hand-note";

/**
 * The pricing section (`#pricing`, docs/SPEC.md section 17). Everything on the cards
 * comes from src/config/plans.ts. The Monthly / Yearly switch is CSS only: the pill
 * slides, the prices roll to the new numbers and "Save €18" opens for Yearly.
 */
export function Pricing() {
  const { starter, growth } = plans;
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-16 border-t bg-card py-16 sm:py-24"
    >
      <Container className="group/billing flex flex-col items-center gap-10">
        <div className="flex max-w-xl flex-col items-center gap-3 text-center">
          <h2 id="pricing-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            One simple price
          </h2>
          <p className="text-pretty text-muted-foreground">
            No traffic limits, because we store almost nothing. Prices include VAT.
          </p>
        </div>
        <div className="relative pt-8">
          <HandNote arrow="down-left" className="absolute top-0 left-[64%] text-primary">
            {monthsFreeLabel()}
          </HandNote>
          <BillingSwitch
            name="pricing-interval"
            yearlyLabel="Yearly"
            yearlyNote={`· ${monthsFreeLabel()}`}
            size="md"
          />
        </div>
        <div className="grid w-full max-w-3xl gap-5 md:grid-cols-2">
          <PlanCard
            highlight
            name={starter.name}
            summary={starter.summary}
            prices={starter.prices}
            features={starter.features}
            footer={
              <div className="flex flex-col gap-2.5">
                <Button asChild size="lg" className="h-12 gap-2 text-base">
                  <Link href="/signin">
                    Start {starter.trialDays}-day free trial
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {formatPrice(0)} due today · no card needed
                </p>
              </div>
            }
          />
          <PlanCard
            name={growth.name}
            badge={<Badge variant="secondary">Coming soon</Badge>}
            summary={growth.summary}
            prices={growth.prices}
            features={growth.features}
          />
        </div>
      </Container>
    </section>
  );
}

function PlanCard({
  name,
  badge,
  summary,
  prices,
  features,
  highlight = false,
  footer,
}: {
  name: string;
  badge?: ReactNode;
  summary: string;
  prices: { month: number; year: number };
  features: readonly string[];
  /** The plan on sale: a coloured edge and a raised card. */
  highlight?: boolean;
  footer?: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-6 rounded-3xl border bg-background p-7 sm:p-8",
        highlight ? "border-primary/60 shadow-lg ring-1 ring-primary/60" : "shadow-xs",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {name}
          </h3>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <div className="flex flex-col">
        <p className="flex items-baseline gap-1.5">
          <RollingPrice
            month={formatPrice(prices.month)}
            year={formatPrice(prices.year)}
            className="text-5xl font-semibold tracking-tight"
          />
          <Swap month="/ month" year="/ year" className="text-base text-muted-foreground" />
        </p>
        <YearlyOnly>
          <p className="flex items-center gap-2 pt-3 text-sm font-medium text-primary">
            <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
            Save {formatPrice(yearlySaving(prices))} a year
          </p>
        </YearlyOnly>
      </div>
      <ul className="flex flex-1 flex-col gap-3 text-sm sm:text-base">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <CheckIcon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                highlight ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            {f}
          </li>
        ))}
      </ul>
      {footer}
    </article>
  );
}
