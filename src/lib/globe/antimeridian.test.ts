import { describe, expect, it } from "vitest";
import { fixGeometry, fixPolygon, normaliseLng, unwrapRing } from "./antimeridian";

describe("unwrapRing", () => {
  it("continues across 180° instead of jumping back to -180°", () => {
    expect(
      unwrapRing([
        [170, 60],
        [179, 62],
        [-178, 64],
        [-170, 61],
        [170, 60],
      ]),
    ).toEqual([
      [170, 60],
      [179, 62],
      [182, 64],
      [190, 61],
      [170, 60],
    ]);
  });
});

describe("fixPolygon", () => {
  it("leaves outlines that don't cross 180° alone", () => {
    const square: number[][][] = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 0],
      ],
    ];
    expect(fixPolygon(square)).toBe(square);
  });

  it("moves holes with their outline", () => {
    const [outer, hole] = fixPolygon([
      [
        [175, 0],
        [-175, 0],
        [-175, 10],
        [175, 10],
        [175, 0],
      ],
      [
        [-179, 4],
        [-177, 4],
        [-177, 6],
        [-179, 4],
      ],
    ]);
    expect(outer!.map((p) => p[0])).toEqual([175, 185, 185, 175, 175]);
    expect(hole!.map((p) => p[0])).toEqual([181, 183, 183, 181]);
  });

  it("leaves an outline that circles a pole as it is (Antarctica)", () => {
    const antarctica: number[][][] = [
      [
        [-180, -70],
        [-60, -65],
        [60, -68],
        [179, -70],
        [180, -90],
        [-180, -90],
        [-180, -70],
      ],
    ];
    // Steps of 120° and a jump back at the pole: unwrapping would end a whole turn away.
    expect(fixPolygon(antarctica)).toEqual(antarctica);
  });
});

describe("fixGeometry", () => {
  it("fixes each part of a multipolygon", () => {
    const fixed = fixGeometry({
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [178, -17],
            [-179, -16],
            [-179, -17],
            [178, -17],
          ],
        ],
      ],
    });
    expect(fixed.coordinates[0]![0]!.map((p) => p[0])).toEqual([178, 181, 181, 178]);
  });
});

describe("normaliseLng", () => {
  it("brings a longitude back between -180 and 180", () => {
    expect(normaliseLng(190)).toBe(-170);
    expect(normaliseLng(-190)).toBe(170);
    expect(normaliseLng(45)).toBe(45);
  });
});
