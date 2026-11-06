import { colors, darkShadows, radius, shadows } from "@/config/theme";

type Palette = Record<string, string>;

type ThemeInput = {
  colors: { light: Palette; dark: Palette };
  radius: string;
  shadows: Record<string, string>;
  darkShadows: Record<string, string>;
};

const defaults: ThemeInput = { colors, radius, shadows, darkShadows };

/** The CSS variable name for a shadow. Tailwind's `--shadow-*` names map onto these in globals.css. */
export const shadowVar = (name: string) => `--elevation-${name}`;

/** One palette's declarations: its colour scheme, colours and shadows. */
function declarations(scheme: "light" | "dark", palette: Palette, shade: Record<string, string>) {
  return [
    `color-scheme:${scheme}`,
    ...Object.entries(palette).map(([token, value]) => `--${token}:${value}`),
    ...Object.entries(shade).map(([name, value]) => `${shadowVar(name)}:${value}`),
  ].join(";");
}

/**
 * Turns the theme file into CSS variables (docs/SPEC.md section 18). Pure, so it is tested,
 * and used by `<ThemeStyle />` in every page.
 *
 * - `:root` gets the light palette.
 * - The dark palette follows the device's setting, unless the visitor picked light
 *   (`data-theme="light"` on `<html>`), and applies whenever they picked dark.
 *
 * No script is needed for the device's setting, so pages are right before any JavaScript.
 */
export function themeToCss(input: ThemeInput = defaults): string {
  const light = declarations("light", input.colors.light, input.shadows);
  const dark = declarations("dark", input.colors.dark, input.darkShadows);
  return [
    `:root{${light};--radius:${input.radius}}`,
    `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${dark}}}`,
    `:root[data-theme="dark"]{${dark}}`,
  ].join("");
}

/**
 * One palette inside any element marked `data-theme-scope="light"` or `"dark"`, whatever
 * the page's theme: the Appearance setting draws each choice in its own colours.
 */
export function themeScopeCss(input: ThemeInput = defaults): string {
  return [
    `[data-theme-scope="light"]{${declarations("light", input.colors.light, input.shadows)}}`,
    `[data-theme-scope="dark"]{${declarations("dark", input.colors.dark, input.darkShadows)}}`,
  ].join("");
}
