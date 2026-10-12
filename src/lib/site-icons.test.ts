import { describe, expect, it } from "vitest";
import { isIconDomain } from "./site-icons";

describe("isIconDomain", () => {
  it("accepts plain host names", () => {
    expect(isIconDomain("google.com")).toBe(true);
    expect(isIconDomain("news.ycombinator.com")).toBe(true);
  });

  it("refuses anything that could reach somewhere else", () => {
    for (const bad of [
      "localhost",
      "127.0.0.1",
      "google.com/../x",
      "a..com",
      "GOOGLE.COM",
      "x.com:80",
      "",
      "-a.com",
    ]) {
      expect(isIconDomain(bad), bad).toBe(false);
    }
  });
});
