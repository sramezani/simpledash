import { describe, expect, it, vi } from "vitest";
import {
  cachedToken,
  EXPIRY_MARGIN_MS,
  forgetGoogleToken,
  rememberToken,
  replaceToken,
  type GoogleToken,
} from "./token-cache";

const MINUTE = 60_000;
const T = Date.UTC(2026, 9, 26, 12);
let n = 0;
const newUser = () => `user-${++n}`;
const token = (value: string, expiresAt: number | null): Promise<GoogleToken> =>
  Promise.resolve({ token: value, expiresAt });

describe("rememberToken", () => {
  it("keeps a token for 10 minutes when it has longer than that left", async () => {
    const user = newUser();
    await rememberToken(user, token("a", T + 60 * MINUTE), T);
    expect(await cachedToken(user, T + 9 * MINUTE)).toBe("a");
    expect(cachedToken(user, T + 10 * MINUTE)).toBeNull();
  });

  it("stops reusing a token a minute before it runs out", async () => {
    const user = newUser();
    await rememberToken(user, token("a", T + 4 * MINUTE), T);
    expect(await cachedToken(user, T + 2 * MINUTE)).toBe("a");
    expect(cachedToken(user, T + 4 * MINUTE - EXPIRY_MARGIN_MS)).toBeNull();
  });

  it("doesn't reuse a token with less than a minute left, but hands it to its caller", async () => {
    const user = newUser();
    expect(await rememberToken(user, token("a", T + 30_000), T)).toBe("a");
    expect(cachedToken(user, T)).toBeNull();
  });

  it("keeps a token of unknown lifetime for 10 minutes", async () => {
    const user = newUser();
    await rememberToken(user, token("a", null), T);
    expect(await cachedToken(user, T + 9 * MINUTE)).toBe("a");
    expect(cachedToken(user, T + 10 * MINUTE)).toBeNull();
  });

  it("shares a lookup still in flight", () => {
    const user = newUser();
    const pending = new Promise<GoogleToken>(() => {});
    const remembered = rememberToken(user, pending, T);
    expect(cachedToken(user, T + MINUTE)).toBe(remembered);
  });

  it("drops a failed lookup, but not a newer one that replaced it", async () => {
    const user = newUser();
    const failed = rememberToken(user, Promise.reject(new Error("no")), T);
    await expect(failed).rejects.toThrow("no");
    expect(cachedToken(user, T)).toBeNull();

    let fail!: (error: Error) => void;
    const slow = rememberToken(user, new Promise<GoogleToken>((_, reject) => (fail = reject)), T);
    await rememberToken(user, token("b", T + 60 * MINUTE), T);
    fail(new Error("late"));
    await expect(slow).rejects.toThrow("late");
    expect(await cachedToken(user, T)).toBe("b");
  });
});

describe("replaceToken", () => {
  it("fetches a new token when the cache still holds the one Google turned down", async () => {
    const user = newUser();
    await rememberToken(user, token("old", Date.now() + 60 * MINUTE));
    const fetchNew = vi.fn(() => token("new", Date.now() + 60 * MINUTE));
    expect(await replaceToken(user, "old", fetchNew)).toBe("new");
    expect(fetchNew).toHaveBeenCalledTimes(1);
    expect(await cachedToken(user)).toBe("new");
  });

  it("uses a token another call already got instead of fetching again", async () => {
    const user = newUser();
    await rememberToken(user, token("new", Date.now() + 60 * MINUTE));
    const fetchNew = vi.fn(() => token("newer", Date.now() + 60 * MINUTE));
    expect(await replaceToken(user, "old", fetchNew)).toBe("new");
    expect(fetchNew).not.toHaveBeenCalled();
  });

  it("gives parallel calls that hit the same 401 one new token", async () => {
    const user = newUser();
    await rememberToken(user, token("old", Date.now() + 60 * MINUTE));
    const fetchNew = vi.fn(() => token("new", Date.now() + 60 * MINUTE));
    const results = await Promise.all([
      replaceToken(user, "old", fetchNew),
      replaceToken(user, "old", fetchNew),
      replaceToken(user, "old", fetchNew),
    ]);
    expect(results).toEqual(["new", "new", "new"]);
    expect(fetchNew).toHaveBeenCalledTimes(1);
  });

  it("fetches a new token when nothing is cached", async () => {
    const user = newUser();
    forgetGoogleToken(user);
    const fetchNew = vi.fn(() => token("new", null));
    expect(await replaceToken(user, "old", fetchNew)).toBe("new");
    expect(fetchNew).toHaveBeenCalledTimes(1);
  });
});
