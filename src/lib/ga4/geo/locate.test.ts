import { describe, expect, it } from "vitest";
import { locate, normalisePlace } from "./locate";

describe("locate", () => {
  it("finds cities by their GA4 names, accents and English names included", () => {
    expect(locate("NL", "Amsterdam")).toMatchObject({ precision: "city", lat: 52.37, lng: 4.89 });
    expect(locate("CH", "Zürich")?.precision).toBe("city");
    expect(locate("DE", "Cologne")?.precision).toBe("city");
    expect(locate("US", "New York")?.precision).toBe("city");
  });

  it("falls back to the country's centre", () => {
    expect(locate("NL", "Tiny Village")).toMatchObject({ precision: "country" });
    expect(locate("de", "(not set)")?.precision).toBe("country");
    expect(locate("US", null)?.precision).toBe("country");
  });

  it("keeps countries across the antimeridian in place", () => {
    const fiji = locate("FJ", null)!;
    expect(Math.abs(fiji.lng)).toBeGreaterThan(170);
  });

  it("returns null for unknown places", () => {
    expect(locate("ZZ", "Nowhere")).toBeNull();
    expect(locate("", null)).toBeNull();
  });

  it("normalises names", () => {
    expect(normalisePlace("São Paulo")).toBe("sao paulo");
    expect(normalisePlace("Saint-Étienne")).toBe("saint etienne");
  });
});
