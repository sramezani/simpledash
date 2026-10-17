import { describe, expect, it } from "vitest";
import { llmsText } from "./llms";

describe("llmsText", () => {
  const text = llmsText("https://simpledash.app");

  it("states Free and Pro's prices from plans.ts", () => {
    expect(text).toContain("- Free: $0, no card needed, no time limit.");
    expect(text).toContain("the last 30 days");
    expect(text).toContain("- Pro: $9 a month or $90 a year (2 months free), tax included.");
    expect(text).toContain("All your GA4 sites, switched with one click");
    expect(text).not.toMatch(/up to \d+ sites/i);
    expect(text).not.toContain("trial");
    expect(text).not.toContain("Starter");
    expect(text).not.toContain("Growth");
  });

  it("links the key pages, including pricing", () => {
    expect(text).toContain("[Pricing](https://simpledash.app/#pricing)");
    expect(text).toContain("[Privacy policy](https://simpledash.app/privacy)");
    expect(text.startsWith("# SimpleDash")).toBe(true);
  });

  it("lists content pages by section, each with its Markdown copy", () => {
    const withPages = llmsText("https://simpledash.app", [
      { section: "docs", title: "Plans", url: "/docs/plans", description: "Free and Pro." },
      {
        section: "guides",
        title: "AI traffic",
        url: "/guides/ga4-ai-traffic",
        description: "See it.",
      },
    ]);
    expect(withPages).toContain("## Docs: how SimpleDash works");
    expect(withPages).toContain(
      "- [Plans](https://simpledash.app/docs/plans) ([Markdown](https://simpledash.app/docs/plans.md)): Free and Pro.",
    );
    expect(withPages).toContain("[Everything in one file](https://simpledash.app/llms-full.txt)");
    expect(text).not.toContain("## Glossary");
  });
});
