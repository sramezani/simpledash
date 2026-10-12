import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { BillingSwitch } from "@/components/shared/billing-switch";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { yearlyLabel } from "@/lib/billing/prices";
import { formatPrice } from "@/lib/format";

/**
 * The pricing section (`#pricing`, docs/SPEC.md section 17). Everything on the cards
 * comes from src/config/plans.ts. The Monthly / Yearly switch is CSS only.
 */
export function Pricing() {
  const { starter, growth } = plans;
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-16 border-t bg-card py-16 sm:py-20"
    >
      <Container className="group/billing flex flex-col items-center gap-8">
        <div className="flex max-w-xl flex-col items-center gap-3 text-center">
          <h2 id="pricing-title" className="text-3xl font-semibold tracking-tight">
            One simple price
          </h2>
          <p className="text-pretty text-muted-foreground">
            No traffic limits, because we store almost nothing. Prices include VAT.
          </p>
        </div>
        <BillingSwitch name="pricing-interval" yearlyLabel={yearlyLabel()} />
        <div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
          <article className="flex flex-col gap-6 rounded-2xl border-2 border-primary bg-background p-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">{starter.name}</h3>
              <p className="text-sm text-muted-foreground">{starter.summary}</p>
            </div>
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight tabular-nums group-has-[[data-option-index='1']:checked]/billing:hidden">
                {formatPrice(starter.prices.month)}
              </span>
              <span className="text-muted-foreground group-has-[[data-option-index='1']:checked]/billing:hidden">
                / month
              </span>
              <span className="hidden text-4xl font-semibold tracking-tight tabular-nums group-has-[[data-option-index='1']:checked]/billing:inline">
                {formatPrice(starter.prices.year)}
              </span>
              <span className="hidden text-muted-foreground group-has-[[data-option-index='1']:checked]/billing:inline">
                / year
              </span>
            </p>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {starter.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Button asChild size="lg" className="h-11">
                <Link href="/signin">Start free trial</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {starter.trialDays} days free · no card
              </p>
            </div>
          </article>
          <article className="flex flex-col gap-6 rounded-2xl border bg-background p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{growth.name}</h3>
                <Badge variant="secondary">Coming soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{growth.summary}</p>
            </div>
            <p className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">
                {formatPrice(growth.prices.month)}
              </span>
              <span className="text-muted-foreground">/ month</span>
            </p>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {growth.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckIcon
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Container>
    </section>
  );
}
