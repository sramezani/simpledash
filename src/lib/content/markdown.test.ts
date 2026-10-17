import { describe, expect, it } from "vitest";
import { contentToMarkdown } from "./markdown";

describe("contentToMarkdown", () => {
  it("writes plan facts as their values from plans.ts", () => {
    expect(
      contentToMarkdown(
        'Pro is <Price plan="pro" interval="month" /> a month or <Price plan="pro" interval="year" /> a year. Free shows <FreeDays /> days.',
      ),
    ).toBe("Pro is $9 a month or $90 a year. Free shows 30 days.\n");
  });

  it("writes code facts: freshness, scopes and the plain-words table", () => {
    expect(contentToMarkdown('<Freshness kind="endsToday" audience="owner" />')).toBe(
      "30 minutes\n",
    );
    expect(contentToMarkdown('<Scope name="analytics" />')).toBe(
      "`https://www.googleapis.com/auth/analytics.readonly`\n",
    );
    expect(contentToMarkdown("<PlainWordsTable />")).toContain(
      "| Visitors | Active users (activeUsers) |",
    );
  });

  it("lists a plan's features", () => {
    expect(contentToMarkdown('<PlanFeatures plan="pro" />')).toContain("- The Monday email");
  });

  it("leaves screenshots out", () => {
    expect(
      contentToMarkdown(
        'Before\n\n<ImageSlot id="x" alt="The menu">\nCapture the menu.\n</ImageSlot>\n\nAfter\n\n<ImageSlot id="y" alt="z" />',
      ),
    ).toBe("Before\n\nAfter\n");
  });

  it("keeps the text of other components, with titles as bold lines", () => {
    const out = contentToMarkdown(
      '<Callout title="Good to know">\nIt is read-only.\n</Callout>\n\n<Steps>\n<Step>\nSign in.\n</Step>\n</Steps>\n\n<InSimpleDash>\nOne page.\n</InSimpleDash>',
    );
    expect(out).toBe(
      "**Good to know**\nIt is read-only.\n\nSign in.\n\n**See it in SimpleDash**\nOne page.\n",
    );
  });

  it("removes the indentation formatting adds inside components, but not inside code", () => {
    const out = contentToMarkdown(
      "<Steps>\n  <Step>\n    Open **Admin**.\n\n    ```js\n    gtag('event', 'sign_up', {\n      method: 'Email',\n    });\n    ```\n  </Step>\n</Steps>",
    );
    expect(out).toBe(
      "Open **Admin**.\n\n```js\ngtag('event', 'sign_up', {\n  method: 'Email',\n});\n```\n",
    );
  });
});
