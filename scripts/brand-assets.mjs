// Writes SimpleDash's logo as files in public/brand/, for places outside the app (Google's
// consent screen, social profiles, directories). Drawn from the same shapes and theme colours as
// src/components/shared/logo.tsx; PNGs are made with the Chrome on this Mac (no package needed).
// Run: npm run brand:assets
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brand, colors } from "../src/config/theme.ts";

const root = process.cwd();
const out = join(root, "public", "brand");
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BRAND = colors.light.brand;
const ON_BRAND = colors.light["primary-foreground"];
const TEXT = colors.light.foreground;
// Geist, the site's font, as shipped inside Next.js: embedded so the wordmark looks the same anywhere.
const geist = readFileSync(
  join(root, "node_modules/next/dist/next-devtools/server/font/geist-latin.woff2"),
).toString("base64");

/** The dash, on a 32 × 32 grid (the same rectangle as LogoMark). */
const dash = (fill) => `<rect x="5" y="12.5" width="22" height="7" rx="3.5" fill="${fill}"/>`;

const files = {
  // The dash alone, in the brand colour, on a transparent background.
  "logo-mark.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">${dash(BRAND)}</svg>`,
  // The app icon: the white dash on a brand-coloured rounded square (like the favicon).
  "logo-icon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="7" fill="${BRAND}"/><g transform="translate(1.6 1.6) scale(0.9)">${dash(ON_BRAND)}</g></svg>`,
  // The mark and the name, always one word.
  "logo-full.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 32" width="156" height="32"><style>@font-face{font-family:"Geist";src:url(data:font/woff2;base64,${geist}) format("woff2");font-weight:100 900}</style>${dash(BRAND)}<text x="34" y="22.5" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="21" font-weight="600" letter-spacing="-0.4" fill="${TEXT}">${brand.name}</text></svg>`,
};

mkdirSync(out, { recursive: true });
for (const [name, svg] of Object.entries(files)) writeFileSync(join(out, name), `${svg}\n`);

/** A PNG of an SVG at an exact size, with a transparent background unless the SVG fills it. */
function png(svgName, file, width, height, { square = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sd-brand-"));
  // `square`: no rounded corners, for platforms that crop icons into their own shape.
  const svg = square ? files[svgName].replace('rx="7"', 'rx="0"') : files[svgName];
  const html = join(dir, "logo.html");
  writeFileSync(
    html,
    `<!doctype html><html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="${width}" height="${height}" style="display:block"></body></html>`,
  );
  const target = join(out, file);
  const result = spawnSync(CHROME, [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--default-background-color=00000000",
    `--window-size=${width},${height}`,
    `--screenshot=${target}`,
    `file://${html}`,
  ]);
  if (result.status !== 0) throw new Error(`Chrome couldn't draw ${file}`);
  console.log(`public/brand/${file}: ${width}×${height}`);
}

png("logo-icon.svg", "logo-icon-512.png", 512, 512);
png("logo-icon.svg", "logo-icon-square-512.png", 512, 512, { square: true });
png("logo-icon.svg", "logo-icon-square-120.png", 120, 120, { square: true });
png("logo-full.svg", "logo-full.png", 624, 128);
for (const name of Object.keys(files)) console.log(`public/brand/${name}`);
