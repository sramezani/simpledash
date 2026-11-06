import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { colors, darkShadows, shadows, textPairs, uiPairs } from "@/config/theme";
import { contrastRatio } from "./contrast";
import { shadowVar, themeScopeCss, themeToCss } from "./css";

const globalsCss = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8",
);
const tokens = Object.keys(colors.light);

describe("themeToCss", () => {
  const css = themeToCss();
  const [root, media, picked] = css.split(/(?=@media|:root\[data-theme)/);

  it("writes a CSS variable for every colour token, in both palettes", () => {
    for (const [token, value] of Object.entries(colors.light)) {
      expect(root).toContain(`--${token}:${value}`);
    }
    for (const [token, value] of Object.entries(colors.dark)) {
      expect(media).toContain(`--${token}:${value}`);
      expect(picked).toContain(`--${token}:${value}`);
    }
  });

  it("gives both palettes the same tokens", () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
    expect(Object.keys(darkShadows).sort()).toEqual(Object.keys(shadows).sort());
  });

  it("writes the radius, the shadows and each colour scheme", () => {
    expect(root).toContain("--radius:");
    for (const name of Object.keys(shadows)) {
      expect(root).toContain(`${shadowVar(name)}:${shadows[name as keyof typeof shadows]}`);
      expect(picked).toContain(`${shadowVar(name)}:${darkShadows[name as keyof typeof shadows]}`);
    }
    expect(root).toContain("color-scheme:light");
    expect(media).toContain("color-scheme:dark");
    expect(picked).toContain("color-scheme:dark");
  });

  it("follows the device unless the visitor picked light, and applies a picked dark", () => {
    expect(media).toMatch(
      /^@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{/,
    );
    expect(picked).toMatch(/^:root\[data-theme="dark"\]\{/);
  });

  it("scopes each palette for the Appearance previews", () => {
    const scoped = themeScopeCss();
    expect(scoped).toContain(
      `[data-theme-scope="light"]{color-scheme:light;--background:${colors.light.background}`,
    );
    expect(scoped).toContain(
      `[data-theme-scope="dark"]{color-scheme:dark;--background:${colors.dark.background}`,
    );
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
    // Fumadocs' fd-* colours (the docs layout) take our token of the same name, or the
    // closest one for the few it names differently.
    const fdAliases: Record<string, string> = {
      info: "primary",
      error: "destructive",
      success: "positive",
      idea: "warning",
      "diff-add": "positive",
      "diff-add-symbol": "positive",
      "diff-remove": "negative",
      "diff-remove-symbol": "negative",
    };
    for (const [, utility, token] of mapped) {
      expect(tokens, `mapping "--color-${utility}" points at a missing token`).toContain(token);
      if (utility!.startsWith("fd-")) {
        const name = utility!.slice(3);
        expect(token).toBe(fdAliases[name] ?? name);
      } else {
        expect(utility).toBe(token);
      }
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

describe.each(["light", "dark"] as const)("contrast in %s (guard 4: WCAG AA)", (name) => {
  const palette = colors[name] as Record<string, string>;

  it.each(textPairs.map(([text, bg]) => [text, bg] as const))(
    "%s on %s reaches 4.5:1",
    (text, bg) => {
      const ratio = contrastRatio(palette[text]!, palette[bg]!);
      expect(ratio, `${text} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(uiPairs.map(([fg, bg]) => [fg, bg] as const))("%s against %s reaches 3:1", (fg, bg) => {
    const ratio = contrastRatio(palette[fg]!, palette[bg]!);
    expect(ratio, `${fg} against ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});
