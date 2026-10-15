import { settingsRoutes } from "./settings-routes";

/**
 * The settings menu (docs/SPEC.md section 5): the account pages, then one item per
 * site. Pure, so it is tested; the dev preview passes its own addresses.
 */

export type SettingsNavItem = {
  href: string;
  label: string;
  icon: "profile" | "billing" | "email" | "site";
  /** A site's address, for its icon. */
  domain?: string | null;
};

export type SettingsNavGroup = { label: string; items: SettingsNavItem[] };

export type SettingsNavSite = { id: string; label: string; domain: string | null };

type Routes = { account: string; billing: string; email: string; site: (siteId: string) => string };

export function settingsNavGroups(
  sites: SettingsNavSite[],
  routes: Routes = settingsRoutes,
): SettingsNavGroup[] {
  const account: SettingsNavGroup = {
    label: "Account",
    items: [
      { href: routes.account, label: "Profile", icon: "profile" },
      { href: routes.billing, label: "Plan & billing", icon: "billing" },
      { href: routes.email, label: "Monday email", icon: "email" },
    ],
  };
  if (sites.length === 0) return [account];
  return [
    account,
    {
      label: sites.length === 1 ? "Site" : "Sites",
      items: sites.map((s) => ({
        href: routes.site(s.id),
        label: s.label,
        icon: "site",
        domain: s.domain,
      })),
    },
  ];
}
