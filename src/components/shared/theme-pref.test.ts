import { describe, expect, it } from "vitest";
import { readThemeChoice, THEME_EVENT, THEME_KEY, themeScript } from "./theme-pref";

/** Runs the head script against a small fake page and returns what it did to <html>. */
function run({ stored, deviceDark }: { stored: string | null; deviceDark: boolean }) {
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const listeners: Record<string, ((e: { key: string | null }) => void)[]> = {};
  const media: { matches: boolean; onChange?: () => void } = { matches: deviceDark };
  const store = new Map<string, string>(stored === null ? [] : [[THEME_KEY, stored]]);
  const events: string[] = [];
  const html = {
    setAttribute: (k: string, v: string) => attrs.set(k, v),
    removeAttribute: (k: string) => attrs.delete(k),
    classList: {
      toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)),
    },
  };
  const win = {
    matchMedia: () => ({
      get matches() {
        return media.matches;
      },
      addEventListener: (_: string, fn: () => void) => (media.onChange = fn),
    }),
    addEventListener: (type: string, fn: (e: { key: string | null }) => void) =>
      (listeners[type] ??= []).push(fn),
    dispatchEvent: (e: { type: string }) => events.push(e.type),
    __sdTheme: undefined as undefined | (() => void),
  };
  const localStorage = { getItem: (k: string) => store.get(k) ?? null };
  class FakeEvent {
    constructor(public type: string) {}
  }
  new Function("document", "window", "matchMedia", "localStorage", "Event", themeScript)(
    { documentElement: html },
    win,
    win.matchMedia,
    localStorage,
    FakeEvent,
  );
  return { attrs, classes, media, store, listeners, events, win };
}

describe("readThemeChoice", () => {
  it("reads light and dark, and anything else as System", () => {
    expect(readThemeChoice("light")).toBe("light");
    expect(readThemeChoice("dark")).toBe("dark");
    expect(readThemeChoice(null)).toBe("system");
    expect(readThemeChoice("purple")).toBe("system");
  });
});

describe("themeScript", () => {
  it("follows the device when nothing is picked", () => {
    const page = run({ stored: null, deviceDark: true });
    expect(page.attrs.has("data-theme")).toBe(false);
    expect(page.classes.has("dark")).toBe(true);
    page.media.matches = false;
    page.media.onChange!();
    expect(page.classes.has("dark")).toBe(false);
  });

  it("marks a picked theme, whatever the device says", () => {
    const light = run({ stored: "light", deviceDark: true });
    expect(light.attrs.get("data-theme")).toBe("light");
    expect(light.classes.has("dark")).toBe(false);
    const dark = run({ stored: "dark", deviceDark: false });
    expect(dark.attrs.get("data-theme")).toBe("dark");
    expect(dark.classes.has("dark")).toBe(true);
  });

  it("ignores an unknown stored value", () => {
    const page = run({ stored: "purple", deviceDark: false });
    expect(page.attrs.has("data-theme")).toBe(false);
  });

  it("follows another tab's choice and tells the switch", () => {
    const page = run({ stored: null, deviceDark: false });
    page.store.set(THEME_KEY, "dark");
    page.listeners.storage![0]!({ key: THEME_KEY });
    expect(page.attrs.get("data-theme")).toBe("dark");
    expect(page.events).toEqual([THEME_EVENT]);
    expect(typeof page.win.__sdTheme).toBe("function");
  });
});
