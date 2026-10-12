import { describe, expect, it } from "vitest";
import { hexToUnitRgb } from "./rgb";

describe("hexToUnitRgb", () => {
  it("turns hex into 0–1 channels", () => {
    expect(hexToUnitRgb("#FFFFFF")).toEqual([1, 1, 1]);
    expect(hexToUnitRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToUnitRgb("#FF8000")[1]).toBeCloseTo(128 / 255);
  });
});
