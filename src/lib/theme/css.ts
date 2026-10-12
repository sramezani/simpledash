import { colors, radius, shadows } from "@/config/theme";

type ThemeInput = {
  colors: { light: Record<string, string> };
  radius: string;
  shadows: Record<string, string>;
};

/** The CSS variable name for a shadow. Tailwind's `--shadow-*` names map onto these in globals.css. */
export const shadowVar = (name: string) => `--elevation-${name}`;

/**
 * Turns the theme file into CSS variables on `:root`.
 * Pure, so it is tested, and used by `<ThemeStyle />` in every page.
 */
export function themeToCss(input: ThemeInput = { colors, radius, shadows }): string {
  const declarations = [
    "color-scheme:light",
    ...Object.entries(input.colors.light).map(([token, value]) => `--${token}:${value}`),
    `--radius:${input.radius}`,
    ...Object.entries(input.shadows).map(([name, value]) => `${shadowVar(name)}:${value}`),
  ];
  return `:root{${declarations.join(";")}}`;
}
