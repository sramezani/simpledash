import { describe, expect, it } from "vitest";
import { faceSeeds, groupPlaces } from "./groups";

const place = (key: string, visitors: number) => ({ key, label: key, visitors });

describe("groupPlaces", () => {
  it("puts places that would overlap on one marker, at the busiest", () => {
    const groups = groupPlaces(
      [
        { place: place("London", 1), x: 100, y: 100, visible: true },
        { place: place("Berlin", 3), x: 120, y: 95, visible: true },
        { place: place("New York", 2), x: 400, y: 200, visible: true },
      ],
      40,
    );
    expect(groups.map((g) => g.members.map((m) => m.key))).toEqual([
      ["Berlin", "London"],
      ["New York"],
    ]);
    expect(groups[0]).toMatchObject({ key: "Berlin|London", visitors: 4 });
    expect(groups[0]!.anchor.key).toBe("Berlin");
  });

  it("keeps places behind the globe on their own", () => {
    const groups = groupPlaces(
      [
        { place: place("Here", 2), x: 100, y: 100, visible: true },
        { place: place("Behind", 1), x: 101, y: 100, visible: false },
      ],
      40,
    );
    expect(groups).toHaveLength(2);
  });
});

describe("faceSeeds", () => {
  it("shows every place before a second face of any", () => {
    expect(faceSeeds([place("Berlin", 3), place("London", 1), place("Paris", 1)], 3)).toEqual([
      "Berlin#0",
      "London#0",
      "Paris#0",
    ]);
  });

  it("fills up from the busiest, and stops when there are fewer visitors than faces", () => {
    expect(faceSeeds([place("Berlin", 3), place("London", 1)], 3)).toEqual([
      "Berlin#0",
      "London#0",
      "Berlin#1",
    ]);
    expect(faceSeeds([place("Oslo", 1)], 3)).toEqual(["Oslo#0"]);
  });
});
