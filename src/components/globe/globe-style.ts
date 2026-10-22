import type { FeatureCollection } from "geojson";
import type { StyleSpecification, SymbolLayerSpecification } from "maplibre-gl";
import type { Topology } from "topojson-specification";
import { colors } from "@/config/theme";

/** public/globe/world.json, written by `npm run globe:data`. */
export type WorldData = {
  countries: Topology;
  labels: { name: string; lng: number; lat: number; size: number }[];
};

// Geist, split like next/font splits it, so a label only loads the file its letters need.
const LATIN = [
  "U+0000-00FF",
  "U+0131",
  "U+0152-0153",
  "U+02BB-02BC",
  "U+02C6",
  "U+02DA",
  "U+02DC",
  "U+2000-206F",
  "U+20AC",
  "U+2122",
  "U+2212",
  "U+FEFF",
  "U+FFFD",
];
const LATIN_EXT = ["U+0100-02BA", "U+02BD-02C5", "U+02C7-02FF", "U+1E00-1EFF", "U+A720-A7FF"];

/** Country size (square degrees, from npm run globe:data): [from, up to, shown from zoom]. */
const LABEL_BANDS: [number, number, number][] = [
  [150, 1e9, 0],
  [40, 150, 1.6],
  [12, 40, 2.4],
  [3, 12, 3.2],
  [0, 3, 4],
];

/**
 * The live globe's map (docs/SPEC.md section 11.10): ocean, land, borders and country names,
 * all served by SimpleDash (no map service), in the theme's colours. Smaller countries'
 * names appear as you zoom in; bigger ones win when two would overlap.
 */
export function globeStyle(
  countries: FeatureCollection,
  labels: FeatureCollection,
): StyleSpecification {
  const c = colors.light;
  return {
    version: 8,
    projection: { type: "globe" },
    "font-faces": {
      Geist: [
        { url: "/globe/geist-latin.woff2", "unicode-range": LATIN },
        { url: "/globe/geist-latin-ext.woff2", "unicode-range": LATIN_EXT },
      ],
    },
    sky: {
      "sky-color": c["globe-glow"],
      "horizon-color": c["globe-glow"],
      "fog-color": c["globe-glow"],
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 4, 0.7, 6, 0],
    },
    sources: {
      countries: { type: "geojson", data: countries, tolerance: 0.6 },
      labels: { type: "geojson", data: labels },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": c["globe-ocean"] } },
      { id: "land", type: "fill", source: "countries", paint: { "fill-color": c["globe-land"] } },
      {
        id: "borders",
        type: "line",
        source: "countries",
        paint: {
          "line-color": c["globe-border"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.4, 3, 0.8, 5, 1.2],
        },
      },
      // One layer per size band, each from its own zoom: big countries are named first.
      ...LABEL_BANDS.map(([min, max, minzoom]): SymbolLayerSpecification => ({
        id: `names-${min}`,
        type: "symbol",
        source: "labels",
        minzoom,
        filter: ["all", [">=", ["get", "size"], min], ["<", ["get", "size"], max]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Geist"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 1, 10, 4, 13],
          "text-max-width": 7,
          "text-letter-spacing": 0.02,
          "symbol-sort-key": ["-", 0, ["get", "size"]],
        },
        paint: {
          "text-color": c["globe-label"],
          "text-halo-color": c["globe-land"],
          "text-halo-width": 1.2,
        },
      })),
    ],
  };
}
