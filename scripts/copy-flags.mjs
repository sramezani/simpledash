// Copies the country flags from country-flag-icons (MIT) into public/flags as
// self-hosted SVGs (docs/SPEC.md section 11.7). They are 3:2 and already small
// (about 170 KB for all of them, under 6 KB for the largest), so they stay sharp
// at any size and screen density. Run after upgrading country-flag-icons:
//   node scripts/copy-flags.mjs
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../node_modules/country-flag-icons/3x2/", import.meta.url));
const to = fileURLToPath(new URL("../public/flags/", import.meta.url));
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });

const codes = [];
let bytes = 0;
for (const file of readdirSync(from)) {
  // Two-letter codes only (countries, plus a few regions such as "EU").
  if (!/^[A-Z]{2}\.svg$/.test(file)) continue;
  const code = file.slice(0, 2);
  copyFileSync(from + file, `${to}${code.toLowerCase()}.svg`);
  bytes += statSync(from + file).size;
  codes.push(code);
}
copyFileSync(
  fileURLToPath(new URL("../node_modules/country-flag-icons/LICENSE", import.meta.url)),
  to + "LICENSE",
);

writeFileSync(
  fileURLToPath(new URL("../src/config/flags.ts", import.meta.url)),
  `/**
 * Country codes with a self-hosted flag in public/flags (country-flag-icons, MIT).
 * Written by scripts/copy-flags.mjs. A code that isn't here shows no flag.
 */
export const flagCodes: ReadonlySet<string> = new Set(
  "${codes.sort().join(" ")}".split(" "),
);
`,
);
console.log(`wrote ${codes.length} flags, ${Math.round(bytes / 1024)} KB in total`);
