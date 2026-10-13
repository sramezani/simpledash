"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { planIds } from "@/config/plans";
import { requireUser } from "@/lib/auth/session";
import { createCheckout, createPlanChange, createPortal, isPaying } from "@/lib/billing/checkout";
import { reportError } from "@/lib/report-error";

const intervalSchema = z.enum(["month", "year"]);
const planSchema = z.enum(planIds);

/**
 * "Upgrade": a form post with `plan` (starter or growth) and `interval` (month or
 * year), so it needs no JavaScript. The price ID is chosen on the server. Someone
 * already paying changes plan in the Customer Portal.
 */
export async function upgrade(formData: FormData) {
  const user = await requireUser();
  const interval = intervalSchema.catch("month").parse(formData.get("interval"));
  const plan = planSchema.catch("starter").parse(formData.get("plan"));
  let url: string | null;
  try {
    url = (await isPaying(user.id))
      ? await createPlanChange(user.id, plan, interval)
      : await createCheckout(user, plan, interval);
  } catch (error) {
    reportError("Checkout failed", error, { userId: user.id, plan });
    redirect("/settings?billing=error#billing");
  }
  redirect((url ?? "/settings") as Route);
}

/** "Manage billing": the Stripe Customer Portal. */
export async function manageBilling() {
  const user = await requireUser();
  let url: string | null;
  try {
    url = await createPortal(user.id);
  } catch (error) {
    reportError("Billing portal failed", error, { userId: user.id });
    redirect("/settings?billing=error#billing");
  }
  redirect((url ?? "/settings") as Route);
}
