import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsNav, SettingsNavSkeleton } from "@/components/settings/settings-nav";
import { SettingsShell } from "@/components/settings/settings-shell";
import { requireUser } from "@/lib/auth/session";
import { settingsNavGroups } from "@/lib/settings-nav";
import { getSiteContext } from "@/lib/sites/sites";

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
  const { sites } = await getSiteContext(user.id);
  return (
    <SettingsNav
      groups={settingsNavGroups(
        sites.map((s) => ({ id: s.id, label: s.domain ?? s.displayName, domain: s.domain })),
      )}
    />
  );
}
