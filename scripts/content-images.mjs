// Writes docs/CONTENT-IMAGES.md: every screenshot slot (<ImageSlot>) in content/, with what
// to capture and where the file goes (docs/SPEC.md section 30). It also writes
// src/lib/content/image-sizes.json, the size of every screenshot added, which ImageSlot reads
// at build time. Run: npm run content:images
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { imageSize } from "../src/lib/content/image-size.ts";

const root = process.cwd();
const sections = ["docs", "guides", "glossary", "compare"];
const rows = [];

for (const section of sections) {
  for (const file of readdirSync(join(root, "content", section)).filter((f) =>
    f.endsWith(".mdx"),
  )) {
    const text = readFileSync(join(root, "content", section, file), "utf8");
    const slug = file.replace(/\.mdx$/, "");
    const url = slug === "index" ? `/${section}` : `/${section}/${slug}`;
    const title = (/^title:\s*(.+)$/m.exec(text)?.[1] ?? url).replace(/^"(.*)"$/, "$1");
    for (const m of text.matchAll(
      /<ImageSlot\s+id="([\w-]+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/ImageSlot>)/g,
    )) {
      const [, id, attributes, body = ""] = m;
      const alt = /alt="([^"]*)"/.exec(attributes)?.[1] ?? "";
      const done = ["webp", "png"].some((ext) =>
        existsSync(join(root, "public", "content", `${id}.${ext}`)),
      );
      rows.push({ id, alt, what: body.trim().replace(/\s+/g, " "), url, title, done });
    }
  }
}

const todo = rows.filter((r) => !r.done);
const lines = [
  "# Screenshots for docs and guides",
  "",
  "Every screenshot slot in `content/`, made by `npm run content:images` (don't edit by hand).",
  "A page shows its screenshot as soon as the file exists; until then the slot renders nothing in production and a dashed box with these instructions in development (docs/SPEC.md section 30).",
  "",
  "**How to add one:**",
  "",
  "1. Capture what the slot asks for, at desktop width unless it says otherwise. Use a test account or blur emails, names, IDs and anything private.",
  "2. Save it as **WebP** (or PNG) about 1600 pixels wide, cropped to the part the page talks about, named exactly as the slot: `public/content/<id>.webp` (or `.png`). A Mac screenshot at its normal size is right: pages show images at half their pixel width, never wider than the text.",
  "3. Run `npm run content:images` to tick it off here.",
  "",
  'Screens of SimpleDash itself (the ones whose instructions start with "From /ui-kit") are retaken in one go from the dev previews: start `npm run dev`, then run `npm run content:screenshots` (or `npm run content:screenshots -- <id>` for one). Do it whenever one of those screens changes.',
  "",
  `**${rows.length - todo.length} of ${rows.length} added.**`,
  "",
];
let page = "";
for (const r of rows) {
  if (r.url !== page) {
    if (page) lines.push("");
    page = r.url;
    lines.push(`## ${r.title}`, "", `Page: \`${r.url}\``, "");
  }
  lines.push(
    `- [${r.done ? "x" : " "}] \`${r.id}\` → \`public/content/${r.id}.webp\``,
    `  - **Shows:** ${r.alt}`,
    `  - **Capture:** ${r.what || "(no extra instructions)"}`,
  );
}
lines.push("");
writeFileSync(join(root, "docs", "CONTENT-IMAGES.md"), lines.join("\n"));
console.log(`docs/CONTENT-IMAGES.md: ${rows.length} slots, ${todo.length} still to add`);

// The screenshots' sizes, for ImageSlot (its real width and height: no layout shift).
const folder = join(root, "public", "content");
const sizes = {};
for (const file of readdirSync(folder).sort()) {
  const m = /^([\w-]+)\.(webp|png)$/.exec(file);
  if (!m || sizes[m[1]]) continue;
  const size = imageSize(readFileSync(join(folder, file)));
  if (!size) throw new Error(`Can't read the size of public/content/${file}`);
  sizes[m[1]] = { src: `/content/${file}`, ...size };
}
writeFileSync(
  join(root, "src", "lib", "content", "image-sizes.json"),
  `${JSON.stringify(sizes, null, 2)}\n`,
);
