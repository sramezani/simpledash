// Writes docs/CONTENT-IMAGES.md: every screenshot slot (<ImageSlot>) in content/, with what
// to capture and where the file goes (docs/SPEC.md section 30). Run: npm run content:images
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
      /<ImageSlot\s+id="([\w-]+)"\s+alt="([^"]*)"[^>]*?(?:\/>|>([\s\S]*?)<\/ImageSlot>)/g,
    )) {
      const [, id, alt, body = ""] = m;
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
  "2. Save it as **WebP** (or PNG) about 1600 pixels wide, named exactly as the slot: `public/content/<id>.webp`.",
  "3. Run `npm run content:images` to tick it off here.",
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
