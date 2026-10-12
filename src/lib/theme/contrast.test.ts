import { describe, expect, it } from "vitest";
import { contrastRatio, luminance } from "./contrast";

describe("contrast", () => {
  it("gives 21:1 for black on white and 1:1 for equal colours", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("does not depend on the order of the colours", () => {
    expect(contrastRatio("#4A42DB", "#FFFFFF")).toBe(contrastRatio("#FFFFFF", "#4A42DB"));
  });

  it("rejects anything that isn't #RRGGBB", () => {
    expect(() => luminance("#FFF")).toThrow();
    expect(() => luminance("red")).toThrow();
  });
});
