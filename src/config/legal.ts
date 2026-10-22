import { brand } from "./theme";

/**
 * Legal facts for the privacy policy and terms (docs/SPEC.md section 17). This is not legal
 * advice. The registered name, address and country are optional: until Siamak fills them in,
 * the pages name SimpleDash with its contact email and leave the rest out, so no placeholder
 * ever shows. A test checks no value holds a "[...]" placeholder.
 */
export const legal = {
  /** Who runs SimpleDash: a registered business name, or the owner's full name. */
  businessName: "Koochak Art" as string | null,
  /** A postal address, e.g. "Street 1, 1234 AB City". */
  address: "Lauriergracht 116 D2, 1016 RP Amsterdam" as string | null,
  /** The country whose law governs the terms, e.g. "the Netherlands". */
  country: "the Netherlands" as string | null,
  contactEmail: brand.supportEmail,
  /** YYYY-MM-DD. Shown at the top of both pages and used in the sitemap. Update it whenever either page changes. */
  lastUpdated: "2026-10-22",
  /** Yearly plans: a full refund if asked within this many days of a yearly payment. */
  yearlyRefundDays: 14,
  /** The most we owe someone who never paid (terms, "Liability"), in the plan currency. */
  minimumLiability: 50,
};

/** Who runs SimpleDash, in a sentence: "Jane Doe, Street 1, City, Country" or just "SimpleDash". */
export function operator(): string {
  const parts = [legal.businessName ?? brand.name, legal.address, legal.country];
  return parts.filter(Boolean).join(", ");
}
