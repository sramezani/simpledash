import { describe, expect, it } from "vitest";
import { jsonLd, softwareApplication } from "./structured-data";

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
