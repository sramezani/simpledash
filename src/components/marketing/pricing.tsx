import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { BillingSwitch } from "@/components/shared/billing-switch";
import { Container } from "@/components/shared/container";
import { PlanCard } from "@/components/shared/plan-card";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { monthsFreeLabel, yearlySaving } from "@/lib/billing/prices";
import { formatPrice } from "@/lib/format";
import { HandNote } from "./hand-note";

/**
 * The pricing section (`#pricing`, docs/SPEC.md sections 17 and 28.1). Everything on
 * the cards comes from src/config/plans.ts. The Monthly / Yearly switch is CSS only:
 * the pill slides, the prices roll to the new numbers and "Save €18" opens for Yearly.
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
            yearlySaving={yearlySaving(starter.prices)}
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
            summary={growth.summary}
            prices={growth.prices}
            yearlySaving={yearlySaving(growth.prices)}
            features={growth.features}
            footer={
              <div className="flex flex-col gap-2.5">
                <Button asChild size="lg" variant="outline" className="h-12 gap-2 text-base">
                  <Link href="/signin">
                    Start free, upgrade later
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-pretty text-muted-foreground">
                  The {starter.trialDays}-day trial is on {starter.name}. Growth starts when you
                  upgrade.
                </p>
              </div>
            }
          />
        </div>
      </Container>
    </section>
  );
}
