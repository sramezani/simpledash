import { ArrowLeftIcon, LayoutGridIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardFrame } from "@/components/dashboard/states";
import { UpgradeForm } from "@/components/dashboard/upgrade-form";
import { Notice } from "@/components/shared/notice";
import { PopoverButton } from "@/components/shared/popover-button";
import { ScrollToHash } from "@/components/shared/scroll-to-hash";
import { SiteIcon } from "@/components/shared/site-icon";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cards } from "@/config/cards";
import { plans } from "@/config/plans";
import type { PlanState } from "@/lib/billing/plan";
import { planInWords } from "@/lib/billing/prices";
import { cn } from "@/lib/utils";
import { PublicPageForm, type PublicPageValues } from "./public-page-form";
import { SiteLinksMenu } from "./site-links-menu";

type Action = (formData: FormData) => Promise<void>;
type PublicPageFormState = { error?: string; saved?: boolean; values?: PublicPageValues };

export type SettingsSite = { id: string; label: string; domain: string | null; paused: boolean };

export type SettingsViewProps = {
  user: { name: string; email: string };
  weeklyEmail: boolean;
  plan: PlanState;
  /** The sites in the list, in the order they were added. */
  sites: SettingsSite[];
  /** The site the site settings are for (`?site=`, or the active one); null without a site. */
  site: SettingsSite | null;
  /** The plan's site limit (1 on Free). */
  siteLimit: number;
  /** The saved public page, or the values a new one would start with. */
  publicPage: PublicPageValues;
  /** "https://simpledash.app/p/" */
  publicBase: string;
  hasSignupEvent: boolean;
  /** ?billing=error, ?delete=confirm|error, ?sites=removed|error */
  billingError: boolean;
  deleteProblem: "confirm" | "error" | null;
  sitesNotice: "removed" | "error" | null;
  /** More site settings (Search Console, revenue), under the public page. */
  siteSections?: ReactNode;
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
    removeSite: Action;
  };
};

/** The settings sections (docs/SPEC.md section 5). Data and actions come from the page. */
export function SettingsView(props: SettingsViewProps) {
  const { user, plan, site, actions } = props;
  const label = site?.label ?? null;
  const several = props.sites.length > 1;
  return (
    <>
      <Account user={user} signOut={actions.signOut} />

      <Section id="email" title="Weekly email">
        {plan.kind === "paid" ? (
          <>
            <p className="text-sm text-muted-foreground">
              {props.weeklyEmail
                ? `On. Every Monday afternoon (in your site's time zone) we email last week's numbers${several ? " for each of your sites" : ""} to ${user.email}.`
                : "Off. Turn it on to get last week's numbers every Monday."}
            </p>
            <form action={actions.setWeeklyEmail}>
              {props.weeklyEmail ? null : <input type="hidden" name="weeklyEmail" value="on" />}
              <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
                {props.weeklyEmail ? "Turn off" : "Turn on"}
              </Button>
            </form>
          </>
        ) : (
          <p className="text-sm text-pretty text-muted-foreground">
            The Monday email is part of {plans.pro.name}: every Monday afternoon, last week&apos;s
            numbers for each of your sites in your inbox.{" "}
            <a
              href="#billing"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              See {plans.pro.name}
            </a>
          </p>
        )}
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
          <>
            <form action={actions.manageBilling}>
              <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
                Manage billing
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Card, invoices, switching between monthly and yearly, and cancelling, on Stripe.
                After cancelling, {plans.pro.name} runs to the end of the period you paid for,
                then you&apos;re on {plans.free.name}.
              </p>
            </form>
          </>
        ) : (
          <>
            <UpgradeForm action={actions.upgrade} className="max-w-sm" />
            <p className="text-xs text-muted-foreground">
              Prices include tax. Payments are handled by Stripe; cancel any time.
            </p>
          </>
        )}
      </Section>

      <SitesSection
        sites={props.sites}
        current={site}
        limit={props.siteLimit}
        notice={props.sitesNotice}
        remove={actions.removeSite}
      />

      {site ? (
        <div id="site" className="flex scroll-mt-20 flex-col gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Site settings</h2>
            <SiteLinksMenu current={site} sites={props.sites.filter((s) => !s.paused)} />
          </div>
          <p className="text-sm text-muted-foreground">
            These apply to {site.label} only{several ? "; each site has its own" : ""}.
          </p>
        </div>
      ) : null}
      {site ? (
        <Section id="public" title="Public page">
          <p className="text-sm text-pretty text-muted-foreground">
            A page anyone can open, with the cards you choose for {site.label}. No notes, no email
            address, nothing private.
          </p>
          <PublicPageForm
            key={site?.id ?? "none"}
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
      ) : null}

      {props.siteSections}

      <Section id="google" title="Google">
        <p className="text-sm text-pretty text-muted-foreground">
          SimpleDash reads{" "}
          {several ? (
            `your ${props.sites.length} sites`
          ) : label ? (
            <strong className="text-foreground">{label}</strong>
          ) : (
            "your sites"
          )}{" "}
          from Google Analytics with read-only access. Disconnecting removes that access and signs
          you out. Your settings and notes are kept for when you come back.
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
          Deletes your account, settings, notes, public {several ? "pages" : "page"} and cached
          numbers, cancels any subscription and removes our access to Google. This can&apos;t be
          undone.
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

/** Settings → Sites (docs/SPEC.md section 28.1): the list, with Remove on Pro. */
function SitesSection({
  sites,
  current,
  limit,
  notice,
  remove,
}: {
  sites: SettingsSite[];
  current: SettingsSite | null;
  limit: number;
  notice: "removed" | "error" | null;
  remove: Action;
}) {
  if (sites.length === 0) return null;
  const multiple = limit > 1;
  return (
    <Section id="sites" title="Sites">
      {notice === "removed" ? (
        <Notice title="The site was removed from your list.">
          Its notes and settings are kept: add it again from the site menu to bring them back.
        </Notice>
      ) : notice === "error" ? (
        <Notice tone="danger" title="That site couldn't be removed.">
          Your last site can&apos;t be removed. Add another one first.
        </Notice>
      ) : null}
      <p className="text-sm text-pretty text-muted-foreground">
        {multiple
          ? `${sites.length} of ${limit} sites. Add sites from the site menu on the dashboard.`
          : `${plans.free.name} shows one site at a time: switch it from the site menu on the dashboard. ${plans.pro.name} adds up to ${plans.pro.limits.sites}.`}
      </p>
      <ul className="flex flex-col divide-y rounded-xl border">
        {sites.map((s) => (
          <li key={s.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
            <SiteIcon domain={s.domain} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{s.label}</span>
              {s.paused ? (
                <span className="text-xs text-muted-foreground">
                  Paused · part of {plans.pro.name}
                </span>
              ) : null}
            </span>
            {s.id === current?.id ? <Badge variant="secondary">Shown below</Badge> : null}
            {!s.paused && s.id !== current?.id ? (
              <Button asChild variant="ghost" className="h-9 px-2.5 pointer-coarse:h-11">
                <Link href={`/settings?site=${s.id}#site` as Route}>Settings</Link>
              </Button>
            ) : null}
            {multiple && sites.length > 1 ? (
              <PopoverButton
                id={`remove-${s.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 px-2.5 text-muted-foreground hover:text-destructive pointer-coarse:h-11",
                )}
                panel={
                  <form action={remove} className="flex flex-col gap-3">
                    <input type="hidden" name="site" value={s.id} />
                    <p>
                      Remove {s.label} from your list? Its dashboard, Monday email block and public
                      page stop. Notes and settings are kept if you add it again.
                    </p>
                    <Button type="submit" variant="destructive" className="self-start">
                      Remove {s.label}
                    </Button>
                  </form>
                }
              >
                Remove
              </PopoverButton>
            ) : null}
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className="h-9 gap-1.5 self-start pointer-coarse:h-11">
        <Link href={"/sites" as Route}>
          <LayoutGridIcon aria-hidden="true" />
          {multiple ? "All sites" : `Add sites with ${plans.pro.name}`}
        </Link>
      </Button>
    </Section>
  );
}

/** A settings card with its heading, for the site parts the page adds (Search Console). */
export function SettingsSection(props: {
  id: string;
  title: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return <Section {...props} />;
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
