import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { GoogleButton } from "@/components/shared/google-button";
import { Notice } from "@/components/shared/notice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BrandTermsForm, type BrandFormState } from "./brand-terms-form";

type Action = (formData: FormData) => Promise<void>;

export type SearchConsoleSettingsProps = {
  /** The site the settings are for. */
  label: string;
  /** The Search Console scope is granted on the Google account. */
  granted: boolean;
  /** The property in use, or null. */
  property: { siteUrl: string; label: string } | null;
  /** The properties to pick from, or why they couldn't be listed. */
  properties: { siteUrl: string; label: string }[] | { problem: string } | null;
  /** The spellings worked out from the domain, and the user's own. */
  brand: { fromDomain: string[]; extra: string[] };
  /** `?search=` after an action: "connected", "no_match", "saved", "not_yours"… */
  result: string | null;
  actions: {
    connect: Action;
    choose: Action;
    disconnect: Action;
    saveBrand: (state: BrandFormState, formData: FormData) => Promise<BrandFormState>;
  };
};

const select =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 pointer-coarse:h-11 sm:max-w-sm";

const RESULTS: Record<string, { tone: "info" | "warning"; title: string } | undefined> = {
  connected: {
    tone: "info",
    title: "Search Console is connected. The Google search card is on your dashboard.",
  },
  saved: { tone: "info", title: "Saved. The Google search card now uses this property." },
  disconnected: { tone: "info", title: "Search Console is no longer used for this site." },
  denied: {
    tone: "warning",
    title:
      "Search Console access wasn't granted. Use the Google account you sign in with, and tick the Search Console box.",
  },
  not_yours: {
    tone: "warning",
    title: "That property isn't in your Google account's Search Console.",
  },
};

/**
 * Settings → Google Search Console (docs/SPEC.md section 28.2): connect, the property
 * in use with a menu to change it, the site's name in searches, and disconnect.
 */
export function SearchConsoleSettings(props: SearchConsoleSettingsProps) {
  const { property, properties, actions, result } = props;
  const notice = result ? RESULTS[result] : undefined;
  const list = Array.isArray(properties) ? properties : null;

  if (!props.granted && !property) {
    return (
      <>
        {notice ? <Notice tone={notice.tone} title={notice.title} /> : null}
        <p className="text-sm text-pretty text-muted-foreground">
          See the Google searches that bring people to {props.label}: the ones close to page 1, what
          changed, your name against other searches, and pages people see but don&apos;t click.
          SimpleDash asks Google for read-only access to Search Console, only now.
        </p>
        <form action={actions.connect}>
          <GoogleButton>Connect Search Console</GoogleButton>
        </form>
      </>
    );
  }

  return (
    <>
      {notice ? <Notice tone={notice.tone} title={notice.title} /> : null}
      {property ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Image src="/google-g.svg" alt="" width={16} height={16} />
          <span className="text-muted-foreground">Using</span>
          <span className="font-medium break-all">{property.label}</span>
        </p>
      ) : (
        <Notice
          tone="warning"
          title={
            result === "no_match" || list
              ? `None of your Search Console properties is ${props.label} yet.`
              : "Pick the Search Console property for this site."
          }
        >
          Pick one below, or{" "}
          <a
            href="https://search.google.com/search-console/welcome"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
          >
            add the site in Search Console
            <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
          </a>{" "}
          (a domain property is best), then come back.
        </Notice>
      )}

      {properties && "problem" in properties ? (
        <p className="text-sm text-warning">{properties.problem}</p>
      ) : list && list.length > 0 ? (
        <form action={actions.choose} className="flex flex-col gap-2">
          <Label htmlFor="search-property">{property ? "Use another property" : "Property"}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="search-property"
              name="property"
              defaultValue={property?.siteUrl ?? list[0]!.siteUrl}
              className={select}
            >
              {list.map((p) => (
                <option key={p.siteUrl} value={p.siteUrl}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
              {property ? "Change" : "Use this property"}
            </Button>
          </div>
        </form>
      ) : list ? (
        <p className="text-sm text-muted-foreground">
          This Google account has no Search Console properties yet.
        </p>
      ) : null}

      {property ? (
        <>
          <Divider>
            <BrandTermsForm
              fromDomain={props.brand.fromDomain}
              extra={props.brand.extra}
              action={actions.saveBrand}
            />
          </Divider>
          <Divider>
            <form action={actions.disconnect} className="flex flex-col items-start gap-2">
              <p className="text-sm text-pretty text-muted-foreground">
                Disconnecting stops the Google search card for {props.label}. Google access itself
                stays for your other sites; remove it from your Google account to end it for all.
              </p>
              <Button type="submit" variant="outline" className="h-9 pointer-coarse:h-11">
                Disconnect Search Console
              </Button>
            </form>
          </Divider>
        </>
      ) : null}
    </>
  );
}

function Divider({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t pt-4", className)}>{children}</div>;
}
