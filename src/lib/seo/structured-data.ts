import { plans } from "@/config/plans";
import { brand } from "@/config/theme";

/**
 * SoftwareApplication JSON-LD for the landing page (docs/SPEC.md section 17).
 * Offers come from plans.ts: every plan that is on sale, monthly and yearly.
 */
export function softwareApplication(appUrl: string) {
  const { starter } = plans;
  const onSale = Object.values(plans).filter((p) => p.status === "on_sale");
  const offer = (price: number, unitCode: "MON" | "ANN", name: string) => ({
    "@type": "Offer",
    name,
    price: String(price),
    priceCurrency: starter.currency,
    url: `${appUrl}/#pricing`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: String(price),
      priceCurrency: starter.currency,
      unitCode,
      valueAddedTaxIncluded: true,
    },
  });
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    description: brand.description,
    url: appUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: onSale.flatMap((p) => [
      offer(p.prices.month, "MON", `${p.name}, monthly`),
      offer(p.prices.year, "ANN", `${p.name}, yearly`),
    ]),
  };
}

/** JSON for a <script> tag: `<` is escaped so the text can't close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
