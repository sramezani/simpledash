"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createCheckout, createPortal, isPaying } from "@/lib/billing/checkout";
import { reportError } from "@/lib/report-error";

const intervalSchema = z.enum(["month", "year"]);

/**
 * "Upgrade": a form post with `interval` (month or year), so it needs no JavaScript.
 * The price ID is chosen on the server. Someone already paying goes to the portal.
 */
export async function upgrade(formData: FormData) {
  const user = await requireUser();
  const interval = intervalSchema.safeParse(formData.get("interval"));
  let url: string | null;
  try {
    url = (await isPaying(user.id))
      ? await createPortal(user.id)
      : await createCheckout(user, interval.success ? interval.data : "month");
  } catch (error) {
    reportError("Checkout failed", error, { userId: user.id });
    redirect("/settings?billing=error");
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
    redirect("/settings?billing=error");
  }
  redirect((url ?? "/settings") as Route);
}
