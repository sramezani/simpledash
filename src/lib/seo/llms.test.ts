import { describe, expect, it } from "vitest";
import { llmsText } from "./llms";

describe("llmsText", () => {
  const text = llmsText("https://simpledash.app");

  it("states the prices from plans.ts", () => {
    expect(text).toContain("€9 a month or €90 a year (2 months free), VAT included");
    expect(text).toContain("€19 a month, coming soon");
  });

  it("links the key pages, including pricing", () => {
    expect(text).toContain("[Pricing](https://simpledash.app/#pricing)");
    expect(text).toContain("[Privacy policy](https://simpledash.app/privacy)");
    expect(text.startsWith("# SimpleDash")).toBe(true);
  });
});
