import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { colors, shadows, textPairs, uiPairs } from "@/config/theme";
import { contrastRatio } from "./contrast";
import { shadowVar, themeToCss } from "./css";

const globalsCss = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8",
);
const tokens = Object.keys(colors.light);

describe("themeToCss", () => {
  const css = themeToCss();

  it("writes a CSS variable for every colour token", () => {
    for (const [token, value] of Object.entries(colors.light)) {
      expect(css).toContain(`--${token}:${value}`);
    }
  });

  it("writes the radius, the shadows and the light colour scheme", () => {
    expect(css).toContain("--radius:");
    for (const name of Object.keys(shadows)) expect(css).toContain(`${shadowVar(name)}:`);
    expect(css).toContain("color-scheme:light");
  });
});

describe("globals.css (guard 3: nothing missing)", () => {
  const mapped = [...globalsCss.matchAll(/--color-([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\)/g)];

  it("maps every token to a Tailwind colour", () => {
    const mappedTokens = mapped.map((m) => m[2]);
    for (const token of tokens)
      expect(mappedTokens, `token "${token}" has no mapping`).toContain(token);
  });

  it("only maps tokens that exist, under the same name", () => {
    for (const [, utility, token] of mapped) {
      expect(tokens, `mapping "--color-${utility}" points at a missing token`).toContain(token);
      expect(utility).toBe(token);
    }
  });

  it("maps every shadow", () => {
    for (const name of Object.keys(shadows)) {
      expect(globalsCss).toContain(`--shadow-${name}: var(${shadowVar(name)})`);
    }
  });

  it("holds no colour values", () => {
    const withoutComments = globalsCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(withoutComments).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(withoutComments).not.toMatch(/\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/);
  });

  it("removes Tailwind's default palette", () => {
    expect(globalsCss).toMatch(/--color-\*:\s*initial/);
  });
});

describe("contrast (guard 4: WCAG AA)", () => {
  const light = colors.light as Record<string, string>;

  it.each(textPairs.map(([text, bg]) => [text, bg] as const))(
    "%s on %s reaches 4.5:1",
    (text, bg) => {
      const ratio = contrastRatio(light[text]!, light[bg]!);
      expect(ratio, `${text} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(uiPairs.map(([fg, bg]) => [fg, bg] as const))("%s against %s reaches 3:1", (fg, bg) => {
    const ratio = contrastRatio(light[fg]!, light[bg]!);
    expect(ratio, `${fg} against ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});
