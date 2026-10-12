import { describe, expect, it } from "vitest";
import { sslFor } from "./ssl";

describe("sslFor", () => {
  it("requires TLS for remote hosts such as the Supabase pooler", () => {
    expect(sslFor("postgresql://u:p%40ss@aws-0-eu-west-1.pooler.supabase.com:5432/postgres")).toBe(
      "require",
    );
  });

  it("skips TLS for local Docker and localhost", () => {
    expect(sslFor("postgres://simpledash:simpledash@localhost:5432/simpledash")).toBe(false);
    expect(sslFor("postgres://simpledash:simpledash@db:5432/simpledash")).toBe(false);
    expect(sslFor("postgres://u:p@127.0.0.1/x")).toBe(false);
  });

  it("lets the URL decide when it sets sslmode", () => {
    expect(sslFor("postgres://u:p@example.com/x?sslmode=disable")).toBeUndefined();
    expect(sslFor("postgres://u:p@localhost/x?sslmode=require")).toBeUndefined();
  });
});
