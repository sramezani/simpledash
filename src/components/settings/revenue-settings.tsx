"use client";

import { ExternalLinkIcon, KeyRoundIcon, LoaderCircleIcon } from "lucide-react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type StripeKeyFormState = { saved?: boolean; error?: string } | null;

export type RevenueConnection = {
  keyHint: string;
  livemode: boolean;
  status: "ok" | "invalid";
  /** "Synced 12 minutes ago", or null while the first sync runs. */
  synced: string | null;
  /** The first day the totals cover, in words. */
  coversFrom: string | null;
};

/**
 * Settings → Revenue from Stripe (docs/SPEC.md section 28.3): the steps to make a
 * restricted read-only key, a field to paste it, and "Check and save". Connected: the
 * key's last 4 characters, the sync, and Remove.
 */
export function RevenueSettings({
  connection,
  save,
  remove,
}: {
  connection: RevenueConnection | null;
  save: (state: StripeKeyFormState, formData: FormData) => Promise<StripeKeyFormState>;
  remove: (formData: FormData) => Promise<void>;
}) {
  const [state, submit, pending] = useActionState(save, null);
  const replace = !connection || connection.status === "invalid";

  return (
    <div className="flex flex-col gap-4">
      {connection ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <KeyRoundIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <span>
            Restricted key <span className="font-mono">…{connection.keyHint}</span>
          </span>
          <Badge variant={connection.livemode ? "secondary" : "outline"}>
            {connection.livemode ? "Live" : "Test mode"}
          </Badge>
          {connection.status === "invalid" ? (
            <span className="text-destructive">Stripe no longer accepts this key.</span>
          ) : (
            <span className="text-muted-foreground">
              {connection.synced ?? "Reading the last 25 months…"}
              {connection.coversFrom ? ` · totals from ${connection.coversFrom}` : ""}
            </span>
          )}
        </div>
      ) : null}

      {replace ? (
        <>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-pretty text-muted-foreground">
            <li>
              In Stripe, open{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
              >
                Developers → API keys
                <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
              </a>{" "}
              and click <strong className="text-foreground">Create restricted key</strong>. Name it
              SimpleDash.
            </li>
            <li>
              Set <strong className="text-foreground">Charges</strong>,{" "}
              <strong className="text-foreground">Refunds</strong>,{" "}
              <strong className="text-foreground">Customers</strong> and{" "}
              <strong className="text-foreground">Subscriptions</strong> to{" "}
              <strong className="text-foreground">Read</strong>. Leave everything else on None.
            </li>
            <li>Create the key, copy it (it starts with rk_live_) and paste it here.</li>
          </ol>
          <form action={submit} className="flex flex-col gap-2">
            <Label htmlFor="stripe-key">Restricted key</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="stripe-key"
                name="key"
                type="password"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="rk_live_…"
                className="min-w-0 flex-1 font-mono sm:max-w-md pointer-coarse:h-11"
              />
              <Button type="submit" disabled={pending} className="h-9 gap-1.5 pointer-coarse:h-11">
                {pending ? <LoaderCircleIcon className="animate-spin" aria-hidden="true" /> : null}
                {pending ? "Checking…" : "Check and save"}
              </Button>
            </div>
            <p aria-live="polite" className="text-sm">
              {state?.error ? (
                <span className="text-destructive">{state.error}</span>
              ) : state?.saved ? (
                <span className="text-muted-foreground">
                  Saved. We&apos;re reading your Stripe totals now; they show on the dashboard in a
                  minute.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  A restricted key can only do what you allow: SimpleDash only reads. We keep daily
                  totals only (revenue, refunds, new customers, MRR), never names, emails or card
                  details. The key is stored encrypted and never shown again.
                </span>
              )}
            </p>
          </form>
        </>
      ) : null}

      {connection ? (
        <form action={remove} className="flex flex-col items-start gap-2 border-t pt-4">
          <p className="text-sm text-pretty text-muted-foreground">
            Removing deletes the key and every stored total for this site. You can delete the key in
            Stripe too.
          </p>
          <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
            Remove Stripe
          </Button>
        </form>
      ) : null}
    </div>
  );
}
