import type { Metadata } from "next";
import { Suspense } from "react";
import { setWeeklyEmailAction } from "@/app/actions/email";
import { EmailSettings } from "@/components/settings/settings-sections";
import { SettingsHeader, SettingsSkeleton } from "@/components/settings/settings-shell";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/email/settings";
import { settingsRoutes } from "@/lib/settings-routes";
import { getSiteContext } from "@/lib/sites/sites";

export const metadata: Metadata = { title: "Monday email" };

/** Settings → Monday email (docs/SPEC.md section 14). */
export default function EmailPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <Email />
    </Suspense>
  );
}

async function Email() {
  const user = await requireUser();
  const [settings, ctx] = await Promise.all([getSettings(user.id), getSiteContext(user.id)]);
  return (
    <>
      <SettingsHeader
        title="Monday email"
        description="Last week's numbers in your inbox, every Monday afternoon in your site's time zone."
      />
      <EmailSettings
        plan={ctx.plan}
        on={settings.weeklyEmail}
        email={user.email}
        siteCount={ctx.sites.length}
        action={setWeeklyEmailAction}
        billingHref={settingsRoutes.billing}
      />
    </>
  );
}
