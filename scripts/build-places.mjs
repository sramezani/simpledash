// Builds the place lookup for the live globe (docs/SPEC.md section 11.10):
// src/lib/ga4/geo/places.json, from GeoNames data (CC BY 4.0) in the all-the-cities package.
//   node scripts/build-places.mjs
// - cities: every place with 30,000+ people, keyed by country and normalised name
// - countries: a population-weighted centre, averaged on the sphere (so Fiji and Russia work)
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const all = require("all-the-cities");

const MIN_POPULATION = 30_000;
// Google writes some cities by their English name; GeoNames by the local one.
const ALIASES = {
  "US|new york": "new york city",
  "DE|cologne": "koln",
  "DE|nuremberg": "nurnberg",
  "DE|hanover": "hannover",
  "BE|antwerp": "antwerpen",
  "SE|gothenburg": "goteborg",
  "ES|seville": "sevilla",
  "IN|bangalore": "bengaluru",
};

export const normalise = (name) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const round = (n) => Math.round(n * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

const cities = {};
const sums = {};
for (const c of all) {
  const [lng, lat] = c.loc.coordinates;
  const country = c.country;
  if (!country) continue;
  // Country centre: population-weighted mean of unit vectors.
  const w = Math.max(c.population, 1);
  const s = (sums[country] ??= { x: 0, y: 0, z: 0 });
  s.x += w * Math.cos(rad(lat)) * Math.cos(rad(lng));
  s.y += w * Math.cos(rad(lat)) * Math.sin(rad(lng));
  s.z += w * Math.sin(rad(lat));
  if (c.population < MIN_POPULATION) continue;
  const key = normalise(c.name);
  const byCountry = (cities[country] ??= {});
  const existing = byCountry[key];
  if (!existing || existing[2] < c.population) byCountry[key] = [round(lat), round(lng), c.population];
}

for (const [alias, target] of Object.entries(ALIASES)) {
  const [country, name] = alias.split("|");
  const hit = cities[country]?.[target];
  if (hit) cities[country][name] = hit;
  else console.warn(`alias ${alias} → ${target}: not found`);
}

const countries = {};
for (const [country, s] of Object.entries(sums)) {
  const hyp = Math.hypot(s.x, s.y);
  countries[country] = [round(deg(Math.atan2(s.z, hyp))), round(deg(Math.atan2(s.y, s.x)))];
}

// Drop populations from the output: only coordinates are needed.
const out = { countries, cities: {} };
let count = 0;
for (const [country, byName] of Object.entries(cities)) {
  out.cities[country] = {};
  for (const [name, [lat, lng]] of Object.entries(byName)) {
    out.cities[country][name] = [lat, lng];
    count++;
  }
}
const path = fileURLToPath(new URL("../src/lib/ga4/geo/places.json", import.meta.url));
writeFileSync(path, JSON.stringify(out));
console.log(`places.json: ${Object.keys(countries).length} countries, ${count} cities`);
