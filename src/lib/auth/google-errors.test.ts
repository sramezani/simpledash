import { describe, expect, it, vi } from "vitest";
import {
  GoogleAccessError,
  isRejectedToken,
  isRevokedGrant,
  withTokenRetry,
} from "./google-errors";

const apiError = (code: number, httpStatusCode: number) =>
  Object.assign(new Error("boom"), { code, httpStatusCode });

describe("isRejectedToken", () => {
  it("is true for an API's 401 (gRPC UNAUTHENTICATED)", () => {
    expect(isRejectedToken(apiError(16, 401))).toBe(true);
    expect(isRejectedToken(Object.assign(new Error("x"), { code: 16 }))).toBe(true);
    expect(isRejectedToken(Object.assign(new Error("x"), { httpStatusCode: 401 }))).toBe(true);
  });

  it("is false for other errors, and for the token server's own answers", () => {
    expect(isRejectedToken(apiError(7, 403))).toBe(false);
    expect(isRejectedToken(apiError(14, 503))).toBe(false);
    expect(isRejectedToken(new Error("boom"))).toBe(false);
    expect(isRejectedToken(new GoogleAccessError("revoked"))).toBe(false);
    expect(isRejectedToken(null)).toBe(false);
  });
});

describe("isRevokedGrant", () => {
  it("reads Google's token server answer", () => {
    expect(isRevokedGrant({ error: "invalid_grant" })).toBe(true);
    expect(isRevokedGrant({ error: "unauthorized_client" })).toBe(true);
    expect(isRevokedGrant({ error: "invalid_request" })).toBe(false);
    expect(isRevokedGrant(null)).toBe(false);
  });
});

describe("withTokenRetry", () => {
  const getToken = () => Promise.resolve("old");

  it("calls once with the token when Google accepts it", async () => {
    const replace = vi.fn(() => Promise.resolve("new"));
    const call = vi.fn((token: string) => Promise.resolve(`ok with ${token}`));
    expect(await withTokenRetry(getToken, replace, call)).toBe("ok with old");
    expect(replace).not.toHaveBeenCalled();
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("after a 401, replaces the turned-down token and calls once more", async () => {
    const replace = vi.fn(() => Promise.resolve("new"));
    const call = vi.fn((token: string) =>
      token === "old" ? Promise.reject(apiError(16, 401)) : Promise.resolve(`ok with ${token}`),
    );
    expect(await withTokenRetry(getToken, replace, call)).toBe("ok with new");
    expect(replace).toHaveBeenCalledWith("old");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("tries only once more: a second 401 is thrown", async () => {
    const replace = vi.fn(() => Promise.resolve("new"));
    const call = vi.fn(() => Promise.reject(apiError(16, 401)));
    await expect(withTokenRetry(getToken, replace, call)).rejects.toMatchObject({ code: 16 });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("doesn't retry other errors", async () => {
    const replace = vi.fn(() => Promise.resolve("new"));
    const call = vi.fn(() => Promise.reject(apiError(7, 403)));
    await expect(withTokenRetry(getToken, replace, call)).rejects.toMatchObject({ code: 7 });
    expect(replace).not.toHaveBeenCalled();
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("passes on a refused grant from the token server: access really ended", async () => {
    const replace = vi.fn(() => Promise.reject(new GoogleAccessError("revoked")));
    const call = vi.fn(() => Promise.reject(apiError(16, 401)));
    await expect(withTokenRetry(getToken, replace, call)).rejects.toBeInstanceOf(GoogleAccessError);
    expect(call).toHaveBeenCalledTimes(1);
  });
});
