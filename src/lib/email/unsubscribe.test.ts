import { describe, expect, it } from "vitest";
import { unsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe";

const secret = "s".repeat(48);

describe("unsubscribe tokens", () => {
  it("round-trips a user ID", () => {
    const token = unsubscribeToken("user_123", secret);
    expect(verifyUnsubscribeToken(token, secret)).toBe("user_123");
  });

  it("rejects tampering, another secret and junk", () => {
    const token = unsubscribeToken("user_123", secret);
    const [, sig] = token.split(".");
    const other = `${Buffer.from("user_999").toString("base64url")}.${sig}`;
    expect(verifyUnsubscribeToken(other, secret)).toBeNull();
    expect(verifyUnsubscribeToken(token, "x".repeat(48))).toBeNull();
    expect(verifyUnsubscribeToken("nope", secret)).toBeNull();
    expect(verifyUnsubscribeToken("", secret)).toBeNull();
    expect(verifyUnsubscribeToken(null, secret)).toBeNull();
    expect(verifyUnsubscribeToken(`${token}x`, secret)).toBeNull();
  });
});
