// Turns the country flags from flag-icons (MIT) into small self-hosted PNGs in
// public/flags (docs/SPEC.md section 11.7). Flags show at 16 × 12 px, so they are
// rendered at 3× (48 × 36): a few hundred bytes each instead of up to 177 KB of SVG.
// Uses sharp, which Next.js already installs. Run after upgrading flag-icons:
//   node scripts/copy-flags.mjs
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const from = fileURLToPath(new URL("../node_modules/flag-icons/flags/4x3/", import.meta.url));
const to = fileURLToPath(new URL("../public/flags/", import.meta.url));
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });

const codes = [];
let bytes = 0;
for (const file of readdirSync(from)) {
  // Two-letter codes only (countries, plus a few regions such as "eu").
  if (!/^[a-z]{2}\.svg$/.test(file)) continue;
  const code = file.slice(0, 2);
  const png = await sharp(from + file, { density: 72 * 4 })
    .resize(48, 36, { fit: "fill" })
    .png({ palette: true, compressionLevel: 9, quality: 90 })
    .toBuffer();
  writeFileSync(`${to}${code}.png`, png);
  bytes += png.length;
  codes.push(code.toUpperCase());
}
copyFileSync(fileURLToPath(new URL("../node_modules/flag-icons/LICENSE", import.meta.url)), to + "LICENSE");

writeFileSync(
  fileURLToPath(new URL("../src/config/flags.ts", import.meta.url)),
  `/**
 * Country codes with a self-hosted flag in public/flags (flag-icons, MIT).
 * Written by scripts/copy-flags.mjs. A code that isn't here shows no flag.
 */
export const flagCodes: ReadonlySet<string> = new Set(
  "${codes.sort().join(" ")}".split(" "),
);
`,
);
console.log(`wrote ${codes.length} flags, ${Math.round(bytes / 1024)} KB in total`);
