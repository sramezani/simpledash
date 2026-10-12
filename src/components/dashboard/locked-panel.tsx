import { LockKeyholeIcon } from "lucide-react";
import Link from "next/link";
import { priceInWords } from "@/lib/billing/prices";
import { UpgradeForm } from "./upgrade-form";

/** "Your free trial has ended." Shown over the cards; settings still work and nothing is deleted. */
export function LockedPanel({ upgrade }: { upgrade: (formData: FormData) => Promise<void> }) {
  return (
    <section
      aria-labelledby="locked-title"
      className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border bg-card p-6 shadow-lg"
    >
      <LockKeyholeIcon className="size-6 text-primary" aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <h2 id="locked-title" className="text-xl font-semibold tracking-tight">
          Your free trial has ended.
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          Keep SimpleDash for {priceInWords("month")} or {priceInWords("year")}. Your settings,
          notes and history are all still here.
        </p>
      </div>
      <UpgradeForm action={upgrade} />
      <p className="text-xs text-muted-foreground">
        Prices include VAT. Payments are handled by Stripe.{" "}
        <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">
          Settings
        </Link>
      </p>
    </section>
  );
}
