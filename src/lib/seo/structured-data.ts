import { currency, plans, taxIncluded } from "@/config/plans";
import { brand } from "@/config/theme";

/**
 * SoftwareApplication JSON-LD for the landing page (docs/SPEC.md section 17).
 * Offers come from plans.ts: Free, and Pro monthly and yearly.
 */
export function softwareApplication(appUrl: string) {
  const { free, pro } = plans;
  const offer = (price: number, name: string, unitCode?: "MON" | "ANN") => ({
    "@type": "Offer",
    name,
    price: String(price),
    priceCurrency: currency,
    url: `${appUrl}/#pricing`,
    ...(unitCode
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: String(price),
            priceCurrency: currency,
            unitCode,
            valueAddedTaxIncluded: taxIncluded,
          },
        }
      : {}),
  });
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    description: brand.description,
    url: appUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      offer(0, free.name),
      offer(pro.prices.month, `${pro.name}, monthly`, "MON"),
      offer(pro.prices.year, `${pro.name}, yearly`, "ANN"),
    ],
  };
}

/** JSON for a <script> tag: `<` is escaped so the text can't close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
