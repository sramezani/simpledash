import type { Metadata } from "next";
import { Suspense } from "react";
import { manageBilling, upgrade } from "@/app/actions/billing";
import { BillingSettings } from "@/components/settings/settings-sections";
import { SettingsHeader, SettingsSkeleton } from "@/components/settings/settings-shell";
import { plans } from "@/config/plans";
import { requireUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/billing/billing";

export const metadata: Metadata = { title: "Plan & billing" };

/** Settings → Plan & billing (docs/SPEC.md section 16). */
export default function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Billing searchParams={searchParams} />
    </Suspense>
  );
}

async function Billing({ searchParams }: Pick<PageProps<"/settings/billing">, "searchParams">) {
  const user = await requireUser();
  const [plan, params] = await Promise.all([getPlan(user.id), searchParams]);
  return (
    <>
      <SettingsHeader
        title="Plan & billing"
        description={
          plan.kind === "paid"
            ? `You're on ${plans.pro.name}. Payments are handled by Stripe.`
            : `You're on ${plans.free.name}. ${plans.pro.name} adds more sites, 12 months and any dates, the Monday email, Google search insights and revenue from Stripe.`
        }
      />
      <BillingSettings
        plan={plan}
        error={params.billing === "error"}
        upgrade={upgrade}
        manageBilling={manageBilling}
      />
    </>
  );
}
