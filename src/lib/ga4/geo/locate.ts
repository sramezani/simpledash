import places from "./places.json";

/**
 * From GA4's place names to coordinates for the live globe (docs/SPEC.md section 11.10).
 * City first, then the country's population-weighted centre. GeoNames data, CC BY 4.0.
 */

type LatLng = [number, number];
const data = places as unknown as {
  countries: Record<string, LatLng>;
  cities: Record<string, Record<string, LatLng>>;
};

export function normalisePlace(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function locate(
  countryId: string,
  city: string | null,
): { lat: number; lng: number; precision: "city" | "country" } | null {
  const code = countryId.toUpperCase();
  if (city && city !== "(not set)") {
    const hit = data.cities[code]?.[normalisePlace(city)];
    if (hit) return { lat: hit[0], lng: hit[1], precision: "city" };
  }
  const centre = data.countries[code];
  return centre ? { lat: centre[0], lng: centre[1], precision: "country" } : null;
}
