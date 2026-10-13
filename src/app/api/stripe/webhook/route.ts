import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { publicSlugsOf } from "@/lib/account/account";
import { publicTag } from "@/lib/public-page/view";
import { applySubscription, findUserByCustomer, userExists } from "@/lib/billing/billing";
import { planPrices, stripe } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/webhook";
import { db } from "@/lib/db/client";
import { stripeEvent } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { reportError } from "@/lib/report-error";
import { eq } from "drizzle-orm";

/** Stripe events (docs/SPEC.md section 16). The signature is checked before anything else. */
export async function POST(request: Request) {
  await connection();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  try {
    const result = await handleStripeEvent(
      event,
      {
        rememberEvent: async (eventId, type) =>
          (await db.insert(stripeEvent).values({ eventId, type }).onConflictDoNothing().returning())
            .length > 0,
        forgetEvent: async (eventId) => {
          await db.delete(stripeEvent).where(eq(stripeEvent.eventId, eventId));
        },
        retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
        findUserByCustomer,
        userExists,
        cancelOrphan: async (subscriptionId, userId) => {
          await stripe.subscriptions.cancel(subscriptionId);
          reportError(
            "Cancelled the subscription of a deleted account",
            new Error("Subscription without an account"),
            { subscriptionId, userId },
          );
        },
        applySubscription: async (userId, facts, stateAt) => {
          const saved = await applySubscription(userId, facts, stateAt);
          // A new plan state can pause or reopen public pages: show it now, not in 10 minutes.
          if (saved) {
            for (const slug of await publicSlugsOf(userId)) {
              revalidateTag(publicTag(slug), { expire: 0 });
            }
          }
          return saved;
        },
        reportUnknownPrice: (priceId, subscriptionId) =>
          reportError("Stripe subscription with an unknown price", new Error(String(priceId)), {
            subscriptionId,
          }),
        now: () => new Date(),
      },
      planPrices(),
    );
    return Response.json({ received: true, result });
  } catch (error) {
    reportError("Stripe webhook failed", error, { eventId: event.id, type: event.type });
    return new Response("Webhook handling failed", { status: 500 });
  }
}
