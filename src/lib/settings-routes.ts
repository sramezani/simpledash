/**
 * The settings pages (docs/SPEC.md section 5): the account pages, and one page per site.
 * Every link to settings goes through here, so the addresses live in one place.
 */
export type SiteSettingsSection = "public" | "search" | "revenue" | "sales";

export const settingsRoutes = {
  account: "/settings",
  billing: "/settings/billing",
  email: "/settings/email",
  /** A site's settings, optionally scrolled to one of its sections. */
  site: (siteId: string, section?: SiteSettingsSection) =>
    `/settings/sites/${siteId}${section ? `#${section}` : ""}`,
} as const;
