// Writes the live globe's map data to public/globe/ (docs/SPEC.md section 11.10), so the
// globe needs no map service: country shapes from Natural Earth (public domain, through the
// world-atlas package), a label point for each country, and Geist for the labels (OFL).
// Run: npm run globe:data
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import polylabel from "polylabel";
import { feature } from "topojson-client";
import { fixGeometry, normaliseLng } from "../src/lib/globe/antimeridian.ts";

const root = process.cwd();
const out = join(root, "public", "globe");
const topology = JSON.parse(
  readFileSync(join(root, "node_modules/world-atlas/countries-50m.json"), "utf8"),
);

/** Natural Earth's short map names, written out where the short form isn't plain. */
const fullNames = {
  "United States of America": "United States",
  "Dem. Rep. Congo": "DR Congo",
  "Central African Rep.": "Central African Republic",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Dominican Rep.": "Dominican Republic",
  "S. Sudan": "South Sudan",
  "Eq. Guinea": "Equatorial Guinea",
  "W. Sahara": "Western Sahara",
  "Solomon Is.": "Solomon Islands",
  "Falkland Is.": "Falkland Islands",
};

/** A ring's area in square degrees: enough to find a country's main polygon and rank labels. */
const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(sum / 2);
};

// Each label sits inside the country's largest polygon, at the point farthest from its edges
// (France's label lands in France, not between it and its overseas regions).
const labels = feature(topology, topology.objects.countries)
  .features.map((country) => {
    if (!country.geometry) return null;
    const geometry = fixGeometry(country.geometry);
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const main = polygons.reduce((a, b) => (ringArea(b[0]) > ringArea(a[0]) ? b : a));
    const [x, y] = polylabel(main, 0.1);
    return {
      name: fullNames[country.properties.name] ?? country.properties.name,
      lng: Math.round(normaliseLng(x) * 100) / 100,
      lat: Math.round(y * 100) / 100,
      // Bigger countries win when labels collide.
      size: Math.round(ringArea(main[0])),
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.size - a.size);

mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, "world.json"),
  JSON.stringify({
    countries: { ...topology, objects: { countries: topology.objects.countries } },
    labels,
  }),
);
// The same Geist the site uses, as shipped inside Next.js: Latin, and Latin Extended for names
// such as "Côte d'Ivoire".
const fonts = join(root, "node_modules/next/dist/next-devtools/server/font");
copyFileSync(join(fonts, "geist-latin.woff2"), join(out, "geist-latin.woff2"));
copyFileSync(join(fonts, "geist-latin-ext.woff2"), join(out, "geist-latin-ext.woff2"));
console.log(`public/globe/world.json: ${labels.length} countries`);
