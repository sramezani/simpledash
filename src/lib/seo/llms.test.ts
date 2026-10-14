import { describe, expect, it } from "vitest";
import { llmsText } from "./llms";

describe("llmsText", () => {
  const text = llmsText("https://simpledash.app");

  it("states Free and Pro's prices from plans.ts", () => {
    expect(text).toContain("- Free: $0, no card needed, no time limit.");
    expect(text).toContain("the last 30 days");
    expect(text).toContain("- Pro: $9 a month or $90 a year (2 months free), tax included.");
    expect(text).not.toContain("trial");
    expect(text).not.toContain("Starter");
    expect(text).not.toContain("Growth");
  });

  it("links the key pages, including pricing", () => {
    expect(text).toContain("[Pricing](https://simpledash.app/#pricing)");
    expect(text).toContain("[Privacy policy](https://simpledash.app/privacy)");
    expect(text.startsWith("# SimpleDash")).toBe(true);
  });
});
