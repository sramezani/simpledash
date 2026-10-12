import { themeToCss } from "./css";

const css = themeToCss();

/** Writes the theme file's tokens into the page as CSS variables. Render it inside `<head>`. */
export function ThemeStyle() {
  return <style id="theme" dangerouslySetInnerHTML={{ __html: css }} />;
}
