import { describe, expect, it } from "vitest";
import { readNote } from "./validate";

const form = (day: string | null, text: string | null) => {
  const f = new FormData();
  if (day !== null) f.set("day", day);
  if (text !== null) f.set("text", text);
  return f;
};

describe("readNote", () => {
  it("accepts a day and a short note, tidying spaces", () => {
    expect(readNote(form("2026-10-07", "  Launched on   Product Hunt "))).toEqual({
      ok: true,
      note: { day: "2026-10-07", text: "Launched on Product Hunt" },
    });
  });

  it("explains what's wrong in plain words", () => {
    expect(readNote(form("07/10/2026", "x"))).toEqual({ ok: false, error: "Pick a day." });
    expect(readNote(form("2026-10-07", "   "))).toEqual({
      ok: false,
      error: "Write a short note.",
    });
    expect(readNote(form("2026-10-07", "x".repeat(81)))).toEqual({
      ok: false,
      error: "Keep it under 80 characters.",
    });
    expect(readNote(form(null, "x")).ok).toBe(false);
  });

  it("allows exactly 80 characters", () => {
    expect(readNote(form("2026-10-07", "x".repeat(80))).ok).toBe(true);
  });
});
