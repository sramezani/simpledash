// Copies the browser, operating system and device icons into public/icons/tech as
// small self-hosted SVGs (docs/SPEC.md section 11.8): brand logos from Gil Barbara's
// SVG Logos (@iconify-json/logos, CC0) and device pictures from Icons8's flat colour
// icons (@iconify-json/flat-color-icons, MIT). That set has no plain computer screen (its
// "display" is a digital number display), so the desktop picture is our own drawing in its
// style and colours (scripts/tech-icons/desktop.svg). Which GA4 name uses which file is in
// src/config/tech-icons.ts. Run after changing the list or upgrading either set:
//   node scripts/copy-tech-icons.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sets = {
  logos: require("@iconify-json/logos/icons.json"),
  devices: require("@iconify-json/flat-color-icons/icons.json"),
};

/** Our file name → [set, icon name in that set]. */
const ICONS = {
  chrome: ["logos", "chrome"],
  safari: ["logos", "safari"],
  edge: ["logos", "microsoft-edge"],
  firefox: ["logos", "firefox"],
  opera: ["logos", "opera"],
  brave: ["logos", "brave"],
  vivaldi: ["logos", "vivaldi-icon"],
  instagram: ["logos", "instagram-icon"],
  facebook: ["logos", "facebook"],
  linkedin: ["logos", "linkedin-icon"],
  x: ["logos", "x"],
  duckduckgo: ["logos", "duckduckgo"],
  apple: ["logos", "apple"],
  windows: ["logos", "microsoft-windows-icon"],
  android: ["logos", "android-icon"],
  linux: ["logos", "linux-tux"],
  ubuntu: ["logos", "ubuntu"],
  debian: ["logos", "debian"],
  fedora: ["logos", "fedora"],
  mobile: ["devices", "phone-android"],
  tablet: ["devices", "tablet-android"],
};
/** Drawn by us in scripts/tech-icons, in the same style and colours as Icons8's. */
const DRAWN = ["desktop"];

const to = fileURLToPath(new URL("../public/icons/tech/", import.meta.url));
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });

let bytes = 0;
for (const [file, [set, name]] of Object.entries(ICONS)) {
  const data = sets[set];
  const icon = data.icons[name];
  if (!icon) throw new Error(`${set} has no icon "${name}"`);
  const width = icon.width ?? data.width ?? 16;
  const height = icon.height ?? data.height ?? 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${width} ${height}">${icon.body}</svg>`;
  writeFileSync(`${to}${file}.svg`, svg);
  bytes += svg.length;
}
// Our own drawings, 48 × 48 like Icons8's.
for (const file of DRAWN) {
  const svg = readFileSync(new URL(`./tech-icons/${file}.svg`, import.meta.url), "utf8").trim();
  writeFileSync(`${to}${file}.svg`, svg);
  bytes += svg.length;
}
writeFileSync(
  `${to}LICENSE.md`,
  `Brand logos: SVG Logos by Gil Barbara (CC0 1.0), https://github.com/gilbarbara/logos\n` +
    `Device icons: Flat Color Icons by Icons8 (MIT), https://github.com/icons8/flat-color-icons\n` +
    `The desktop icon is SimpleDash's own (scripts/tech-icons/desktop.svg), in the same style.\n` +
    `Copied by scripts/copy-tech-icons.mjs from @iconify-json/logos ${readVersion("logos")} and @iconify-json/flat-color-icons ${readVersion("flat-color-icons")}.\n`,
);
console.log(
  `wrote ${Object.keys(ICONS).length + DRAWN.length} icons, ${Math.round(bytes / 1024)} KB in total`,
);

function readVersion(name) {
  const path = require.resolve(`@iconify-json/${name}/package.json`);
  return JSON.parse(readFileSync(path, "utf8")).version;
}
