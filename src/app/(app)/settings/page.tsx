import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteAccountAction, disconnectGoogleAction } from "@/app/actions/account";
import { signOut } from "@/app/actions/auth";
import { manageBilling, upgrade } from "@/app/actions/billing";
import { setWeeklyEmailAction } from "@/app/actions/email";
import { savePublicPageAction } from "@/app/actions/public-page";
import { SettingsFrame, SettingsSkeleton, SettingsView } from "@/components/settings/settings-view";
import { defaultPublicCardIds } from "@/config/cards";
import { getActiveSite, requireUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/billing/billing";
import { getSettings } from "@/lib/email/settings";
import { env } from "@/lib/env";
import { getMyPublicPage } from "@/lib/public-page/public-page";
import { slugFromDomain } from "@/lib/public-page/slug";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

/** Settings (docs/SPEC.md section 5): account, weekly email, public page, billing, Google, delete. */
export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <SettingsFrame>
      <Suspense fallback={<SettingsSkeleton />}>
        <Sections searchParams={searchParams} />
      </Suspense>
    </SettingsFrame>
  );
}

async function Sections({ searchParams }: Pick<PageProps<"/settings">, "searchParams">) {
  const user = await requireUser();
  const params = await searchParams;
  const [settings, plan, page, active] = await Promise.all([
    getSettings(user.id),
    getPlan(user.id),
    getMyPublicPage(user.id),
    getActiveSite(user.id),
  ]);
  const label = active ? (active.domain ?? active.displayName) : null;
  return (
    <SettingsView
      user={user}
      weeklyEmail={settings.weeklyEmail}
      plan={plan}
      publicPage={
        page
          ? { slug: page.slug, enabled: page.enabled, indexable: page.indexable, cards: page.cards }
          : {
              slug: slugFromDomain(label ?? "my-site"),
              enabled: false,
              indexable: true,
              cards: [...defaultPublicCardIds],
            }
      }
      publicBase={`${env.APP_URL}/p/`}
      label={label}
      hasSignupEvent={!!active?.signupEvent}
      billingError={params.billing === "error"}
      deleteProblem={
        params.delete === "confirm" ? "confirm" : params.delete === "error" ? "error" : null
      }
      actions={{
        signOut,
        setWeeklyEmail: setWeeklyEmailAction,
        savePublicPage: savePublicPageAction,
        upgrade,
        manageBilling,
        disconnectGoogle: disconnectGoogleAction,
        deleteAccount: deleteAccountAction,
      }}
    />
  );
}
