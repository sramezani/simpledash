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
    alternateName: brand.alternateName,
    description: brand.summary,
    url: appUrl,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Google Analytics 4 dashboard",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    sameAs: [...brand.profiles],
    publisher: organization(appUrl),
    creator: { "@type": "Person", name: brand.makerName, url: brand.makerUrl },
    offers: [
      offer(0, free.name),
      offer(pro.prices.month, `${pro.name}, monthly`, "MON"),
      offer(pro.prices.year, `${pro.name}, yearly`, "ANN"),
    ],
  };
}

/** Who makes SimpleDash, with our pages elsewhere, so the name can't be mixed up. */
export function organization(appUrl: string) {
  return {
    "@type": "Organization",
    name: brand.name,
    url: appUrl,
    logo: `${appUrl}/icon`,
    email: brand.supportEmail,
    sameAs: [...brand.profiles],
  };
}

/** A docs page or guide as schema.org JSON-LD (docs/SPEC.md section 30). */
export function contentArticle(input: {
  appUrl: string;
  url: string;
  title: string;
  description: string;
  updated: string;
  /** Docs pages are technical articles; guides, glossary and comparisons are articles. */
  technical: boolean;
}) {
  const publisher = organization(input.appUrl);
  return {
    "@context": "https://schema.org",
    "@type": input.technical ? "TechArticle" : "Article",
    headline: input.title,
    description: input.description,
    url: `${input.appUrl}${input.url}`,
    mainEntityOfPage: `${input.appUrl}${input.url}`,
    dateModified: input.updated,
    inLanguage: "en",
    author: publisher,
    publisher,
  };
}

/** Breadcrumbs as schema.org JSON-LD: home, then each step down to the page. */
export function breadcrumbList(appUrl: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: brand.name, url: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${appUrl}${item.url}`,
    })),
  };
}

/** JSON for a <script> tag: `<` is escaped so the text can't close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
