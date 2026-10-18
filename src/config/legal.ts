import { brand } from "./theme";

/**
 * Legal facts for the privacy policy and terms (docs/SPEC.md section 17).
 * Siamak fills in the [PLACEHOLDERS] before launch. This is not legal advice.
 */
export const legal = {
  businessName: "[BUSINESS NAME]",
  address: "[STREET, POSTCODE, CITY]",
  country: "[COUNTRY]",
  contactEmail: brand.supportEmail,
  /** YYYY-MM-DD. Shown at the top of both pages and used in the sitemap. Update it whenever either page changes. */
  lastUpdated: "2026-10-18",
  /** Yearly plans: a full refund if asked within this many days of a yearly payment. */
  yearlyRefundDays: 14,
} as const;
