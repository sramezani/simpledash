import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSiteIcon, iconSources, isIconDomain } from "./site-icons";

const png = () =>
  new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } });
const missing = () => new Response(null, { status: 404 });

describe("fetchSiteIcon", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("tries DuckDuckGo first and stops when it has the icon", async () => {
    const fetch = vi.fn(async (_url: string) => png());
    vi.stubGlobal("fetch", fetch);
    expect(await fetchSiteIcon("example.com")).toMatchObject({ type: "image/png" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]![0]).toContain("icons.duckduckgo.com");
  });

  it("falls back to Google when DuckDuckGo has no icon", async () => {
    const fetch = vi.fn(async (url: string) => (url.includes("duckduckgo") ? missing() : png()));
    vi.stubGlobal("fetch", fetch);
    expect(await fetchSiteIcon("example.com")).toMatchObject({ type: "image/png" });
    expect(fetch.mock.calls.map(([url]) => new URL(url).host)).toEqual([
      "icons.duckduckgo.com",
      "t2.gstatic.com",
    ]);
  });

  it("gives null when no service has an icon, or one fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => missing()),
    );
    expect(await fetchSiteIcon("example.com")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("timeout");
      }),
    );
    expect(await fetchSiteIcon("example.com")).toBeNull();
  });

  it("only ever asks the fixed services, for a checked domain", async () => {
    const fetch = vi.fn(async () => png());
    vi.stubGlobal("fetch", fetch);
    expect(await fetchSiteIcon("localhost")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    for (const url of iconSources("example.com")) {
      expect(["icons.duckduckgo.com", "t2.gstatic.com"]).toContain(new URL(url).host);
    }
  });
});

describe("isIconDomain", () => {
  it("accepts plain host names", () => {
    expect(isIconDomain("google.com")).toBe(true);
    expect(isIconDomain("news.ycombinator.com")).toBe(true);
  });

  it("refuses anything that could reach somewhere else", () => {
    for (const bad of [
      "localhost",
      "127.0.0.1",
      "google.com/../x",
      "a..com",
      "GOOGLE.COM",
      "x.com:80",
      "",
      "-a.com",
    ]) {
      expect(isIconDomain(bad), bad).toBe(false);
    }
  });
});
