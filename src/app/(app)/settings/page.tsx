import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteAccountAction, disconnectGoogleAction } from "@/app/actions/account";
import { signOut } from "@/app/actions/auth";
import { LegacySettingsHash } from "@/components/settings/legacy-settings-hash";
import {
  DeleteAccountSettings,
  GoogleSettings,
  ProfileSettings,
} from "@/components/settings/settings-sections";
import { SettingsHeader, SettingsSkeleton } from "@/components/settings/settings-shell";
import { ScrollToHash } from "@/components/shared/scroll-to-hash";
import { requireUser } from "@/lib/auth/session";
import { settingsRoutes } from "@/lib/settings-routes";
import { readSiteId } from "@/lib/sites/access";
import { getSiteContext } from "@/lib/sites/sites";

export const metadata: Metadata = { title: "Profile" };

/** Settings → Profile (docs/SPEC.md section 5): the account, Google access, deleting. */
export default function ProfilePage({ searchParams }: PageProps<"/settings">) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Profile searchParams={searchParams} />
    </Suspense>
  );
}

/** The query keys a site's settings page understands, carried over from old addresses. */
const SITE_KEYS = ["search", "sale", "revenue"] as const;

async function Profile({ searchParams }: Pick<PageProps<"/settings">, "searchParams">) {
  const user = await requireUser();
  const params = await searchParams;

  // Addresses from before settings had pages (Oct 15, 2026): /settings?site=<id>&search=…
  const oldSite = readSiteId(params.site);
  if (oldSite) {
    const keep = new URLSearchParams();
    for (const key of SITE_KEYS) {
      const value = params[key];
      if (typeof value === "string") keep.set(key, value);
    }
    const query = keep.toString();
    redirect(`${settingsRoutes.site(oldSite)}${query ? `?${query}` : ""}` as Route);
  }
  if (params.billing === "error") redirect(`${settingsRoutes.billing}?billing=error` as Route);

  const { sites } = await getSiteContext(user.id);
  return (
    <>
      <SettingsHeader
        title="Profile"
        description="Your account, and SimpleDash's access to Google."
      />
      <ProfileSettings user={user} signOut={signOut} />
      <GoogleSettings siteCount={Math.max(1, sites.length)} disconnect={disconnectGoogleAction} />
      <DeleteAccountSettings
        problem={
          params.delete === "confirm" ? "confirm" : params.delete === "error" ? "error" : null
        }
        action={deleteAccountAction}
      />
      <LegacySettingsHash />
      <ScrollToHash />
    </>
  );
}
