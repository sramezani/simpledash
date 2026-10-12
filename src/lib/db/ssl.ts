const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "db"]);

/**
 * TLS setting for a Postgres URL. Remote databases (Supabase) always get TLS, because the
 * pooler also accepts plain connections. Local Docker doesn't. If the URL sets `sslmode`
 * or `ssl` itself, the URL decides. scripts/migrate.mjs has a copy of this rule.
 */
export function sslFor(url: string): "require" | false | undefined {
  const parsed = new URL(url);
  if (parsed.searchParams.has("sslmode") || parsed.searchParams.has("ssl")) return undefined;
  return localHosts.has(parsed.hostname) ? false : "require";
}
