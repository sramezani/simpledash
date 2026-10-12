import { beforeEach, describe, expect, it } from "vitest";
import { GoogleAccessError } from "@/lib/auth/google-errors";
import { classifyError, isRetryable, quotaBlockedUntil } from "./errors";
import {
  isBreakerOpen,
  isQuotaLow,
  recordQuota,
  recordServerError,
  resetLimiter,
  withPropertySlot,
} from "./limiter";

const googleError = (code: number, httpStatusCode: number, message = "boom", reason?: string) =>
  Object.assign(new Error(message), { code, httpStatusCode, reason });

describe("classifyError", () => {
  it("maps 429 to quota, hourly or daily", () => {
    expect(classifyError(googleError(8, 429, "Exhausted property tokens per hour"))).toMatchObject({
      problem: "quota",
      quota: "hourly",
    });
    expect(classifyError(googleError(8, 429, "Exhausted property tokens per day"))).toMatchObject({
      problem: "quota",
      quota: "daily",
    });
  });

  it("maps 401 and invalid_grant to revoked", () => {
    expect(classifyError(googleError(16, 401)).problem).toBe("revoked");
    expect(classifyError(new GoogleAccessError("revoked")).problem).toBe("revoked");
    expect(classifyError(new Error("invalid_grant")).problem).toBe("revoked");
  });

  it("maps 403 to no access, unless our API is disabled", () => {
    expect(classifyError(googleError(7, 403)).problem).toBe("no_access");
    expect(classifyError(googleError(7, 403, "x", "SERVICE_DISABLED")).problem).toBe("unavailable");
    expect(
      classifyError(googleError(7, 403, "Google Analytics Data API has not been used in project 1"))
        .problem,
    ).toBe("unavailable");
  });

  it("maps server errors and timeouts to unavailable, and retries them", () => {
    for (const [code, http] of [
      [14, 503],
      [13, 500],
      [4, 504],
    ] as const) {
      expect(classifyError(googleError(code, http)).problem).toBe("unavailable");
      expect(isRetryable(googleError(code, http))).toBe(true);
    }
    expect(isRetryable(googleError(8, 429))).toBe(false);
    expect(isRetryable(googleError(16, 401))).toBe(false);
    expect(isRetryable(new GoogleAccessError("unavailable"))).toBe(false);
  });

  it("treats the concurrent-requests quota as a short blip, not an hourly block", () => {
    const busy = googleError(8, 429, "Exhausted concurrent requests quota");
    expect(classifyError(busy).problem).toBe("unavailable");
    expect(isRetryable(busy)).toBe(true);
  });

  it("maps a token server outage to unavailable, not revoked", () => {
    expect(classifyError(new GoogleAccessError("unavailable")).problem).toBe("unavailable");
  });
});

describe("quotaBlockedUntil", () => {
  it("blocks until the next full hour", () => {
    expect(quotaBlockedUntil("hourly", new Date("2026-10-11T13:42:10Z")).toISOString()).toBe(
      "2026-10-11T14:00:00.000Z",
    );
  });

  it("blocks the daily quota until midnight in California", () => {
    // 11 Oct 13:42 UTC is 06:42 in Los Angeles (PDT, UTC-7), so midnight is 12 Oct 07:00 UTC.
    expect(quotaBlockedUntil("daily", new Date("2026-10-11T13:42:10Z")).toISOString()).toBe(
      "2026-10-12T07:00:00.000Z",
    );
  });
});

describe("limiter", () => {
  beforeEach(() => resetLimiter());

  it("runs at most 5 requests at once per property", async () => {
    let running = 0;
    let peak = 0;
    const task = async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
    };
    await Promise.all(Array.from({ length: 12 }, () => withPropertySlot("properties/1", task)));
    expect(peak).toBe(5);
  });

  it("never lets a newcomer jump ahead of a waiting task", async () => {
    let running = 0;
    let peak = 0;
    const slow = () =>
      withPropertySlot("p", async () => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((r) => setTimeout(r, 5));
        running--;
      });
    const first = Array.from({ length: 6 }, slow); // 5 run, 1 waits
    await new Promise((r) => setTimeout(r, 6)); // a slot is being handed over now
    await Promise.all([...first, slow(), slow()]);
    expect(peak).toBe(5);
  });

  it("frees the slot when a task fails", async () => {
    await expect(withPropertySlot("p", () => Promise.reject(new Error("x")))).rejects.toThrow();
    await expect(withPropertySlot("p", async () => 1)).resolves.toBe(1);
  });

  it("opens the breaker after 5 server errors within an hour", () => {
    const t0 = Date.UTC(2026, 9, 11, 12);
    for (let i = 0; i < 4; i++) recordServerError("p", t0 + i);
    expect(isBreakerOpen("p", t0 + 10)).toBe(false);
    recordServerError("p", t0 + 20);
    expect(isBreakerOpen("p", t0 + 30)).toBe(true);
    expect(isBreakerOpen("p", t0 + 61 * 60 * 1000)).toBe(false);
  });

  it("notes a low hourly quota until the hour turns", () => {
    const t0 = Date.UTC(2026, 9, 11, 12, 30);
    recordQuota("p", { tokensPerHour: { consumed: 950, remaining: 50 } }, t0);
    expect(isQuotaLow("p", t0)).toBe(true);
    expect(isQuotaLow("p", Date.UTC(2026, 9, 11, 13, 0, 1))).toBe(false);
    recordQuota("q", { tokensPerHour: { consumed: 10, remaining: 990 } }, t0);
    expect(isQuotaLow("q", t0)).toBe(false);
  });
});
