import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsNav, SettingsNavSkeleton } from "@/components/settings/settings-nav";
import { SettingsShell } from "@/components/settings/settings-shell";
import { requireUser } from "@/lib/auth/session";
import { settingsNavGroups } from "@/lib/settings-nav";
import { classifyError } from "@/lib/ga4/errors";
import { addNewProperties } from "@/lib/ga4/properties";
import { reportError } from "@/lib/report-error";
import { siteList } from "@/lib/sites/access";
import { siteDetail, siteName } from "@/lib/sites/label";
import { getUserSites } from "@/lib/sites/sites";

export const metadata: Metadata = {
  title: { default: "Settings", template: "%s · Settings · SimpleDash" },
  robots: { index: false, follow: false },
};

/**
 * Settings (docs/SPEC.md section 5): the menu on the left, with the account pages and
 * one page per site, and the page beside it.
 */
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <SettingsShell
      nav={
        <Suspense fallback={<SettingsNavSkeleton />}>
          <Nav />
        </Suspense>
      }
    >
      {children}
    </SettingsShell>
  );
}

async function Nav() {
  const user = await requireUser();
  // A site made in Google Analytics since the last visit joins the list here, without a
  // trip through the dashboard's site menu. Settings still opens when Google doesn't answer.
  await addNewProperties(user.id).catch((error) => {
    // Google access that ended shows on the dashboard and the Profile page; nothing to report.
    if (classifyError(error).problem !== "revoked") {
      reportError("Adding new Google Analytics sites failed", error, { userId: user.id });
    }
  });
  // Read fresh, not through getSiteContext: the page may have cached the list before the sync.
  const sites = siteList(await getUserSites(user.id));
  return (
    <SettingsNav
      groups={settingsNavGroups(
        sites.map((s) => ({
          id: s.id,
          label: siteName(s),
          domain: s.domain,
          detail: siteDetail(s),
        })),
      )}
    />
  );
}
