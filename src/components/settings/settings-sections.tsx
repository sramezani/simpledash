import type { Route } from "next";
import Link from "next/link";
import { UpgradeForm } from "@/components/dashboard/upgrade-form";
import { Notice } from "@/components/shared/notice";
import { PopoverButton } from "@/components/shared/popover-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cards } from "@/config/cards";
import { plans } from "@/config/plans";
import type { PlanState } from "@/lib/billing/plan";
import { planInWords } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";
import { PublicPageForm, type PublicPageValues } from "./public-page-form";
import { SettingsSection } from "./settings-shell";

/**
 * The settings cards (docs/SPEC.md section 5), one per job. Data and actions come from
 * the pages (and the dev preview), so these stay plain and easy to preview.
 */

type Action = (formData: FormData) => Promise<void>;
type PublicPageFormState = { error?: string; saved?: boolean; values?: PublicPageValues };

const buttonClass = "h-9 self-start pointer-coarse:h-11";
const linkClass = "font-medium text-primary underline-offset-2 hover:underline";

/** Profile → who is signed in, and signing out. */
export function ProfileSettings({
  user,
  signOut,
}: {
  user: { name: string; email: string };
  signOut: Action;
}) {
  return (
    <SettingsSection id="account" title="Account">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[6rem_1fr]">
        <dt className="text-muted-foreground">Name</dt>
        <dd>{user.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all">{user.email}</dd>
      </dl>
      <form action={signOut}>
        <Button type="submit" variant="outline" className={buttonClass}>
          Sign out
        </Button>
      </form>
    </SettingsSection>
  );
}

/** Profile → the read-only Google connection, and taking it back. */
export function GoogleSettings({
  siteCount,
  disconnect,
}: {
  siteCount: number;
  disconnect: Action;
}) {
  return (
    <SettingsSection
      id="google"
      title="Google"
      description={`SimpleDash reads ${siteCount === 1 ? "your site" : `your ${siteCount} sites`} from Google Analytics with read-only access. Disconnecting removes that access and signs you out. Your settings and notes are kept for when you come back.`}
    >
      <PopoverButton
        id="disconnect"
        className={cn(buttonVariants({ variant: "outline" }), buttonClass)}
        panel={
          <form action={disconnect} className="flex flex-col gap-3">
            <p>
              Disconnect Google? The dashboard, Monday email and public pages stop until you sign in
              again.
            </p>
            <Button type="submit" variant="destructive" className="self-start">
              Disconnect Google
            </Button>
          </form>
        }
      >
        Disconnect Google
      </PopoverButton>
    </SettingsSection>
  );
}

/** Profile → deleting the account, confirmed by typing DELETE. */
export function DeleteAccountSettings({
  problem,
  action,
}: {
  /** `?delete=confirm` (DELETE wasn't typed) or `?delete=error` (Stripe didn't answer). */
  problem: "confirm" | "error" | null;
  action: Action;
}) {
  return (
    <SettingsSection
      id="delete"
      title="Delete account"
      danger
      description="Deletes your account, settings, notes, public pages and cached numbers, cancels any subscription and removes our access to Google. This can't be undone."
    >
      {problem === "confirm" ? (
        <Notice tone="warning" title="Type DELETE to confirm" />
      ) : problem === "error" ? (
        <Notice tone="danger" title="Nothing was deleted">
          We couldn&apos;t cancel your subscription with Stripe. Please try again in a minute.
        </Notice>
      ) : null}
      <form action={action} className="flex flex-col gap-2">
        <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
        <div className="flex flex-wrap gap-3">
          <Input
            id="delete-confirm"
            name="confirm"
            required
            pattern="DELETE"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-40 pointer-coarse:h-11"
          />
          <Button type="submit" variant="destructive" className="h-9 pointer-coarse:h-11">
            Delete account
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

/** Plan & billing → the plan in words, then upgrading (Free) or Stripe's portal (Pro). */
export function BillingSettings({
  plan,
  error,
  upgrade,
  manageBilling,
}: {
  plan: PlanState;
  /** `?billing=error`: Stripe didn't open. */
  error: boolean;
  upgrade: Action;
  manageBilling: Action;
}) {
  return (
    <SettingsSection id="billing" title="Your plan">
      {error ? (
        <Notice tone="danger" title="Stripe didn't open">
          Something went wrong on the way to Stripe. Nothing was charged. Please try again.
        </Notice>
      ) : null}
      {plan.kind === "paid" && plan.pastDue ? (
        <Notice tone="warning" title="Your last payment didn't go through">
          Update your card in Manage billing to keep {plans.pro.name} running.
        </Notice>
      ) : null}
      <p className="text-sm font-medium">{planInWords(plan)}</p>
      {plan.kind === "paid" ? (
        <form action={manageBilling} className="flex flex-col gap-2">
          <Button type="submit" variant="outline" className={buttonClass}>
            Manage billing
          </Button>
          <p className="text-xs text-pretty text-muted-foreground">
            Card, invoices, switching between monthly and yearly, and cancelling, on Stripe. After
            cancelling, {plans.pro.name} runs to the end of the period you paid for, then
            you&apos;re on {plans.free.name}.
          </p>
        </form>
      ) : (
        <>
          <UpgradeForm action={upgrade} className="max-w-sm" />
          <p className="text-xs text-muted-foreground">
            Prices include tax. Payments are handled by Stripe; cancel any time.
          </p>
        </>
      )}
    </SettingsSection>
  );
}

/** Monday email → on or off (Pro), or what it is (Free). */
export function EmailSettings({
  plan,
  on,
  email,
  siteCount,
  action,
  billingHref,
}: {
  plan: PlanState;
  on: boolean;
  email: string;
  siteCount: number;
  action: Action;
  billingHref: string;
}) {
  if (plan.kind !== "paid") {
    return (
      <SettingsSection id="email" title="Monday email">
        <p className="text-sm text-pretty text-muted-foreground">
          The Monday email is part of {plans.pro.name}: every Monday afternoon, last week&apos;s
          numbers for each of your sites in your inbox.{" "}
          <Link href={billingHref as Route} className={linkClass}>
            See {plans.pro.name}
          </Link>
        </p>
      </SettingsSection>
    );
  }
  return (
    <SettingsSection id="email" title="Monday email">
      <p className="text-sm text-pretty text-muted-foreground">
        {on
          ? `On. Every Monday afternoon (in your site's time zone) we email last week's numbers${siteCount > 1 ? " for each of your sites" : ""} to ${email}.`
          : "Off. Turn it on to get last week's numbers every Monday."}
      </p>
      <form action={action}>
        {on ? null : <input type="hidden" name="weeklyEmail" value="on" />}
        <Button type="submit" variant="outline" className={buttonClass}>
          {on ? "Turn off" : "Turn on"}
        </Button>
      </form>
    </SettingsSection>
  );
}

/** A site → its public page. */
export function PublicPageSettings({
  label,
  formKey,
  base,
  values,
  hasSignupEvent,
  action,
}: {
  label: string;
  /** Resets the form when another site's page opens. */
  formKey: string;
  /** "https://simpledash.app/p/" */
  base: string;
  values: PublicPageValues;
  hasSignupEvent: boolean;
  action: (state: PublicPageFormState, formData: FormData) => Promise<PublicPageFormState>;
}) {
  return (
    <SettingsSection
      id="public"
      title="Public page"
      description={`A page anyone can open, with the cards you choose for ${label}. No notes, no email address, nothing private.`}
    >
      <PublicPageForm
        key={formKey}
        action={action}
        base={base}
        values={values}
        cardOptions={cards
          .filter((c) => c.publicAllowed)
          .map((c) => ({
            id: c.id,
            title: c.title,
            note:
              c.id === "signups" && !hasSignupEvent
                ? "Pick a signup action on the dashboard first"
                : c.id === "live"
                  ? "Visitors in the last 30 minutes"
                  : undefined,
          }))}
      />
    </SettingsSection>
  );
}

/** A site → taking it off the user's list (not the last one). */
export function RemoveSiteSettings({
  label,
  siteId,
  action,
}: {
  label: string;
  siteId: string;
  action: Action;
}) {
  return (
    <SettingsSection
      id="remove"
      title="Remove this site"
      danger
      description={`Takes ${label} off your sites: its dashboard, Monday email block and public page stop. Its notes and settings are kept if you open it again from the site menu.`}
    >
      <PopoverButton
        id={`remove-${siteId}`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "text-destructive hover:text-destructive",
          buttonClass,
        )}
        panel={
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="site" value={siteId} />
            <p>Remove {label} from your sites?</p>
            <Button type="submit" variant="destructive" className="self-start">
              Remove {label}
            </Button>
          </form>
        }
      >
        Remove {label}
      </PopoverButton>
    </SettingsSection>
  );
}
