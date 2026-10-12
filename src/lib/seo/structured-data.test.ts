import { describe, expect, it } from "vitest";
import { jsonLd, softwareApplication } from "./structured-data";

describe("softwareApplication", () => {
  it("lists the two Starter prices from plans.ts", () => {
    const data = softwareApplication("https://simpledash.app");
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.applicationCategory).toBe("BusinessApplication");
    expect(data.offers.map((o) => [o.price, o.priceSpecification.unitCode])).toEqual([
      ["9", "MON"],
      ["90", "ANN"],
    ]);
  });

  it("escapes < so it can't close the script tag", () => {
    expect(jsonLd({ x: "</script>" })).toBe('{"x":"\\u003c/script>"}');
  });
});
