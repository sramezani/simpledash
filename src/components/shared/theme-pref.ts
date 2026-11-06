/**
 * The visitor's theme choice (docs/SPEC.md section 18): System (the device's setting, the
 * default), Light or Dark. It lives in the browser only (`localStorage`), so pages stay
 * static and cacheable, and nothing about it reaches the server.
 *
 * - The colours come from CSS alone (src/lib/theme/css.ts): the device's setting through a
 *   media query, a picked theme through `data-theme` on `<html>`.
 * - `themeScript` runs in `<head>` before the first paint: it sets `data-theme` for a picked
 *   theme, and the `dark` class whenever the page is dark, for the parts that look for it
 *   (Fumadocs' code colours, shadcn's `dark:` classes). It follows the device's setting and
 *   other tabs live, and leaves `window.__sdTheme()` for the theme switch to re-apply.
 */

export const THEME_KEY = "sd-theme";

/** Fired on `window` after the choice changes, here or in another tab. */
export const THEME_EVENT = "sd-theme-change";

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

/** A stored value as a choice: anything unknown is System. */
export function readThemeChoice(stored: string | null | undefined): ThemeChoice {
  return stored === "light" || stored === "dark" ? stored : "system";
}

/** Plain ES5 on purpose, like the signed-in hint. */
export const themeScript = `(function(){var d=document.documentElement,m=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)");function a(){var p=null;try{p=localStorage.getItem("${THEME_KEY}")}catch(e){}if(p!=="light"&&p!=="dark")p=null;if(p)d.setAttribute("data-theme",p);else d.removeAttribute("data-theme");d.classList.toggle("dark",p?p==="dark":!!(m&&m.matches))}a();if(m&&m.addEventListener)m.addEventListener("change",a);window.addEventListener("storage",function(e){if(e.key==="${THEME_KEY}"||e.key===null){a();window.dispatchEvent(new Event("${THEME_EVENT}"))}});window.__sdTheme=a})()`;

declare global {
  interface Window {
    /** Re-applies the stored choice to `<html>` (set by `themeScript`). */
    __sdTheme?: () => void;
  }
}
