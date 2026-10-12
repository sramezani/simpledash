import { describe, expect, it } from "vitest";
import { isPublicAuthPath } from "./routes";

describe("isPublicAuthPath", () => {
  it("lets Google's callback through", () => {
    expect(isPublicAuthPath("/api/auth/callback/google")).toBe(true);
    expect(isPublicAuthPath("/api/auth/callback/google/")).toBe(true);
  });

  it("blocks endpoints that would hand tokens or accounts to the browser", () => {
    for (const path of [
      "/api/auth/get-access-token",
      "/api/auth/refresh-token",
      "/api/auth/account-info",
      "/api/auth/list-accounts",
      "/api/auth/get-session",
      "/api/auth/sign-in/social",
      "/api/auth/delete-user",
      "/api/auth/callback/github",
    ]) {
      expect(isPublicAuthPath(path), path).toBe(false);
    }
  });
});
