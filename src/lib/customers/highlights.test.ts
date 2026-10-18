import { describe, expect, it } from "vitest";
import { customerHighlights, type PathCount, type SourceCounts } from "./highlights";

const source = (s: string, label: string, first: number, last: number): SourceCounts => ({
  source: s,
  label,
  first,
  last,
});
const path = (first: string, last: string, lastLabel: string, count: number): PathCount => ({
  first,
  last,
  lastLabel,
  count,
});

describe("customerHighlights", () => {
  it("names the source that found more people than its visits closed", () => {
    const lines = customerHighlights({
      noun: "sales",
      sources: [
        source("reddit.com", "reddit.com", 7, 2),
        source("google", "Google", 4, 9),
        source("t.co", "t.co", 3, 3),
      ],
      paths: null,
    });
    expect(lines).toEqual([
      "7 of your 14 sales came from people who first found you through reddit.com; 2 happened on a visit from reddit.com.",
    ]);
  });

  it("says none when no event happened on that source's visits", () => {
    const [line] = customerHighlights({
      noun: "signups",
      sources: [source("producthunt.com", "producthunt.com", 3, 0)],
      paths: null,
    });
    expect(line).toContain("none happened on a visit from producthunt.com");
  });

  it("needs 3 events and a gap of 2, and ignores direct and unknown first visits", () => {
    const quiet = customerHighlights({
      noun: "sales",
      sources: [
        source("reddit.com", "reddit.com", 2, 0),
        source("t.co", "t.co", 4, 3),
        source("(direct)", "Direct", 9, 1),
        source("(not set)", "Unknown", 9, 0),
      ],
      paths: null,
    });
    expect(quiet).toEqual([]);
  });

  it("names a last visit whose events mostly came from people found elsewhere", () => {
    const lines = customerHighlights({
      noun: "sales",
      sources: [],
      paths: [
        path("google", "google", "Google", 3),
        path("reddit.com", "google", "Google", 4),
        path("t.co", "google", "Google", 2),
        path("(not set)", "google", "Google", 1),
      ],
    });
    expect(lines).toEqual([
      "Google was the last visit for 10 sales; for 6 of them, the person first found you somewhere else.",
    ]);
  });

  it("leaves the second line out below 3 or below half", () => {
    const lines = customerHighlights({
      noun: "sales",
      sources: [],
      paths: [path("google", "google", "Google", 9), path("reddit.com", "google", "Google", 4)],
    });
    expect(lines).toEqual([]);
  });
});
