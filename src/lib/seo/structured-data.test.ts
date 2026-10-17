import { describe, expect, it } from "vitest";
import { breadcrumbList, contentArticle, jsonLd, softwareApplication } from "./structured-data";

describe("softwareApplication", () => {
  it("lists Free and Pro's prices from plans.ts, in dollars", () => {
    const data = softwareApplication("https://simpledash.app");
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.applicationCategory).toBe("BusinessApplication");
    expect(
      data.offers.map((o) => [o.name, o.price, o.priceSpecification?.unitCode ?? null]),
    ).toEqual([
      ["Free", "0", null],
      ["Pro, monthly", "9", "MON"],
      ["Pro, yearly", "90", "ANN"],
    ]);
    expect(data.offers.every((o) => o.priceCurrency === "USD")).toBe(true);
  });

  it("escapes < so it can't close the script tag", () => {
    expect(jsonLd({ x: "</script>" })).toBe('{"x":"\\u003c/script>"}');
  });
});

describe("contentArticle", () => {
  it("describes a docs page as a technical article with its date", () => {
    const data = contentArticle({
      appUrl: "https://simpledash.app",
      url: "/docs/plans",
      title: "Plans",
      description: "Free and Pro.",
      updated: "2026-10-15",
      technical: true,
    });
    expect(data).toMatchObject({
      "@type": "TechArticle",
      headline: "Plans",
      url: "https://simpledash.app/docs/plans",
      dateModified: "2026-10-15",
      publisher: { name: "SimpleDash" },
    });
    expect(
      contentArticle({
        ...data,
        appUrl: "",
        url: "/g",
        updated: "",
        technical: false,
        title: "",
        description: "",
      })["@type"],
    ).toBe("Article");
  });
});

describe("breadcrumbList", () => {
  it("starts at home and numbers each step", () => {
    const data = breadcrumbList("https://simpledash.app", [
      { name: "Guides", url: "/guides" },
      { name: "AI traffic", url: "/guides/ga4-ai-traffic" },
    ]);
    expect(data.itemListElement.map((i) => [i.position, i.name, i.item])).toEqual([
      [1, "SimpleDash", "https://simpledash.app/"],
      [2, "Guides", "https://simpledash.app/guides"],
      [3, "AI traffic", "https://simpledash.app/guides/ga4-ai-traffic"],
    ]);
  });
});
