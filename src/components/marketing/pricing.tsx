import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { BillingSwitch } from "@/components/shared/billing-switch";
import { Container } from "@/components/shared/container";
import { PlanCard } from "@/components/shared/plan-card";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { monthsFreeLabel, yearlySaving } from "@/lib/billing/prices";
import { HandNote } from "./hand-note";

/**
 * The pricing section (`#pricing`, docs/SPEC.md sections 16 and 17). Everything on the
 * cards comes from src/config/plans.ts. The Monthly / Yearly switch is CSS only: the
 * pill slides, Pro's price rolls to the new number and "Save $18" opens for Yearly.
 */
export function Pricing() {
  const { free, pro } = plans;
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-16 border-t bg-card py-16 sm:py-24"
    >
      <Container className="group/billing flex flex-col items-center gap-10">
        <div className="flex max-w-xl flex-col items-center gap-3 text-center">
          <h2 id="pricing-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Free to start, one simple price
          </h2>
          <p className="text-pretty text-muted-foreground">
            No traffic limits, because we store almost nothing. Prices include tax.
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
            name={free.name}
            summary={free.summary}
            prices={free.prices}
            yearlySaving={0}
            features={free.features}
            footer={
              <div className="flex flex-col gap-2.5">
                <Button asChild size="lg" variant="outline" className="h-12 gap-2 text-base">
                  <Link href="/signin">
                    Start free
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground md:min-h-10">
                  No card needed, no time limit
                </p>
              </div>
            }
          />
          <PlanCard
            highlight
            name={pro.name}
            summary={pro.summary}
            prices={pro.prices}
            yearlySaving={yearlySaving(pro.prices)}
            features={pro.features}
            footer={
              <div className="flex flex-col gap-2.5">
                <Button asChild size="lg" className="h-12 gap-2 text-base">
                  <Link href="/signin">
                    Start free, upgrade any time
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-pretty text-muted-foreground md:min-h-10">
                  Launch price: it stays the same for as long as you&apos;re subscribed. Cancel any
                  time.
                </p>
              </div>
            }
          />
        </div>
      </Container>
    </section>
  );
}
