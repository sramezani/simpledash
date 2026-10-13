import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardFrame } from "@/components/dashboard/states";
import { UpgradeForm } from "@/components/dashboard/upgrade-form";
import { Notice } from "@/components/shared/notice";
import { PopoverButton } from "@/components/shared/popover-button";
import { ScrollToHash } from "@/components/shared/scroll-to-hash";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cards } from "@/config/cards";
import type { PlanState } from "@/lib/billing/plan";
import { planInWords } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";
import { PublicPageForm, type PublicPageValues } from "./public-page-form";

type Action = (formData: FormData) => Promise<void>;
type PublicPageFormState = { error?: string; saved?: boolean; values?: PublicPageValues };

export type SettingsViewProps = {
  user: { name: string; email: string };
  weeklyEmail: boolean;
  plan: PlanState;
  /** The saved public page, or the values a new one would start with. */
  publicPage: PublicPageValues;
  /** "https://simpledash.app/p/" */
  publicBase: string;
  /** The active site's name, or null when none is connected. */
  label: string | null;
  hasSignupEvent: boolean;
  /** ?billing=error, ?delete=confirm|error */
  billingError: boolean;
  deleteProblem: "confirm" | "error" | null;
  actions: {
    signOut: Action;
    setWeeklyEmail: Action;
    savePublicPage: (
      state: PublicPageFormState,
      formData: FormData,
    ) => Promise<PublicPageFormState>;
    upgrade: Action;
    manageBilling: Action;
    disconnectGoogle: Action;
    deleteAccount: Action;
  };
};

/** The settings sections (docs/SPEC.md section 5). Data and actions come from the page. */
export function SettingsView(props: SettingsViewProps) {
  const { user, plan, label, actions } = props;
  return (
    <>
      <Account user={user} signOut={actions.signOut} />

      <Section id="email" title="Weekly email">
        <p className="text-sm text-muted-foreground">
          {props.weeklyEmail
            ? `On. Every Monday afternoon (in your site's time zone) we email last week's numbers to ${user.email}.`
            : "Off. Turn it on to get last week's numbers every Monday."}
        </p>
        <form action={actions.setWeeklyEmail}>
          {props.weeklyEmail ? null : <input type="hidden" name="weeklyEmail" value="on" />}
          <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
            {props.weeklyEmail ? "Turn off" : "Turn on"}
          </Button>
        </form>
      </Section>

      <Section id="public" title="Public page">
        <p className="text-sm text-pretty text-muted-foreground">
          A page anyone can open, with the cards you choose
          {label ? ` for ${label}` : ""}. No notes, no email address, nothing private.
        </p>
        <PublicPageForm
          action={actions.savePublicPage}
          base={props.publicBase}
          values={props.publicPage}
          cardOptions={cards
            .filter((c) => c.publicAllowed)
            .map((c) => ({
              id: c.id,
              title: c.title,
              note:
                c.id === "signups" && !props.hasSignupEvent
                  ? "Pick a signup action on the dashboard first"
                  : c.id === "live"
                    ? "Visitors in the last 30 minutes"
                    : undefined,
            }))}
        />
      </Section>

      <Section id="billing" title="Billing">
        {props.billingError ? (
          <Notice tone="danger" title="Stripe didn't open">
            Something went wrong on the way to Stripe. Nothing was charged. Please try again.
          </Notice>
        ) : null}
        {plan.kind === "paid" && plan.pastDue ? (
          <Notice tone="warning" title="Your last payment didn't go through">
            Update your card in Manage billing to keep SimpleDash running.
          </Notice>
        ) : null}
        <p className="text-sm font-medium">{planInWords(plan)}</p>
        {plan.kind === "paid" ? (
          <form action={actions.manageBilling}>
            <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
              Manage billing
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Card, invoices, switching between monthly and yearly, and cancelling, on Stripe.
            </p>
          </form>
        ) : (
          <>
            <UpgradeForm action={actions.upgrade} />
            <p className="text-xs text-muted-foreground">
              Prices include VAT. Payments are handled by Stripe.
              {plan.kind === "trial" ? " Upgrading now keeps the rest of your free trial." : ""}
            </p>
          </>
        )}
      </Section>

      <Section id="google" title="Google">
        <p className="text-sm text-pretty text-muted-foreground">
          SimpleDash reads{" "}
          {label ? <strong className="text-foreground">{label}</strong> : "your sites"} from Google
          Analytics with read-only access. Disconnecting removes that access and signs you out. Your
          settings and notes are kept for when you come back.
        </p>
        <div>
          <PopoverButton
            id="disconnect"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 pointer-coarse:h-11")}
            panel={
              <form action={actions.disconnectGoogle} className="flex flex-col gap-3">
                <p>
                  Disconnect Google? The dashboard, weekly email and public page stop until you sign
                  in again.
                </p>
                <Button type="submit" variant="destructive" className="self-start">
                  Disconnect Google
                </Button>
              </form>
            }
          >
            Disconnect Google
          </PopoverButton>
        </div>
      </Section>

      <Section id="delete" title="Delete account" danger>
        <p className="text-sm text-pretty text-muted-foreground">
          Deletes your account, settings, notes, public page and cached numbers, cancels any
          subscription and removes our access to Google. This can&apos;t be undone.
        </p>
        {props.deleteProblem === "confirm" ? (
          <Notice tone="warning" title="Type DELETE to confirm" />
        ) : props.deleteProblem === "error" ? (
          <Notice tone="danger" title="Nothing was deleted">
            We couldn&apos;t cancel your subscription with Stripe. Please try again in a minute.
          </Notice>
        ) : null}
        <form action={actions.deleteAccount} className="flex flex-col gap-2">
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
      </Section>
      <ScrollToHash />
    </>
  );
}

function Section({
  id,
  title,
  danger,
  children,
}: {
  id: string;
  title: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex scroll-mt-20 flex-col gap-4 rounded-xl border bg-card p-5",
        danger && "border-destructive/40",
      )}
    >
      <h2 id={`${id}-title`} className="text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Account({ user, signOut }: { user: { name: string; email: string }; signOut: Action }) {
  return (
    <Section id="account" title="Account">
      <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="text-muted-foreground">Name</dt>
        <dd>{user.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all">{user.email}</dd>
      </dl>
      <form action={signOut}>
        <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
          Sign out
        </Button>
      </form>
    </Section>
  );
}

/** The settings page frame: the top bar with a way back, and the heading. */
export function SettingsFrame({ children }: { children: ReactNode }) {
  return (
    <DashboardFrame
      nav={
        <Button asChild variant="ghost" className="h-9 gap-1.5 px-2">
          <Link href="/dashboard">
            <ArrowLeftIcon aria-hidden="true" />
            Dashboard
          </Link>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        {children}
      </div>
    </DashboardFrame>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
