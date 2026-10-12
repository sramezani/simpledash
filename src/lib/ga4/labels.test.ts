import { describe, expect, it } from "vitest";
import { aiAssistantName } from "./ai-sources";
import { channelLabel, deviceOf, plainValue, sourceDomain, sourceLabel } from "./labels";

describe("plain words", () => {
  it("maps GA4 placeholders", () => {
    expect(plainValue("(direct)")).toBe("Direct");
    expect(plainValue("(none)")).toBe("Direct");
    expect(plainValue("(not set)")).toBe("Unknown");
    expect(plainValue("(other)")).toBe("Other");
    expect(plainValue("")).toBe("Unknown");
    expect(plainValue("google")).toBe("google");
  });

  it("maps channels", () => {
    expect(channelLabel("Organic Search")).toBe("Search");
    expect(channelLabel("Referral")).toBe("Other sites");
    expect(channelLabel("AI Assistant")).toBe("AI assistants");
    expect(channelLabel("Paid Other")).toBe("Other ads");
    expect(channelLabel("Cross-network")).toBe("Other ads");
    expect(channelLabel("Unassigned")).toBe("Unknown");
  });

  it("maps devices, with anything else as other", () => {
    expect(deviceOf("desktop")).toBe("desktop");
    expect(deviceOf("Mobile")).toBe("mobile");
    expect(deviceOf("smart tv")).toBe("other");
  });

  it("labels sources", () => {
    expect(sourceLabel("google")).toBe("Google");
    expect(sourceLabel("(direct)")).toBe("Direct");
    expect(sourceLabel("news.ycombinator.com")).toBe("news.ycombinator.com");
  });
});

describe("sourceDomain", () => {
  it("uses the source when it looks like a domain", () => {
    expect(sourceDomain("news.ycombinator.com")).toBe("news.ycombinator.com");
    expect(sourceDomain("www.example.co.uk")).toBe("example.co.uk");
  });

  it("maps common names", () => {
    expect(sourceDomain("google")).toBe("google.com");
    expect(sourceDomain("t.co")).toBe("x.com");
  });

  it("returns null for anything else", () => {
    expect(sourceDomain("(direct)")).toBeNull();
    expect(sourceDomain("newsletter")).toBeNull();
    expect(sourceDomain("spring_sale")).toBeNull();
    expect(sourceDomain("evil.com/../../etc")).toBeNull();
  });
});

describe("aiAssistantName", () => {
  it("names assistants from the list and from hints", () => {
    expect(aiAssistantName("chatgpt.com")).toBe("ChatGPT");
    expect(aiAssistantName("claude.ai")).toBe("Claude");
    expect(aiAssistantName("labs.perplexity.ai")).toBe("Perplexity");
    expect(aiAssistantName("unknown-bot.example")).toBe("unknown-bot.example");
  });
});
