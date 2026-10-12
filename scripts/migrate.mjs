// Applies the SQL migrations in drizzle/ (docs/SPEC.md section 9).
// Runs when the container starts, and locally with `npm run db:migrate`.
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: DATABASE_URL is not set");
  process.exit(1);
}

// Same rule as src/lib/db/ssl.ts: TLS for remote databases, unless the URL sets sslmode.
const parsed = new URL(url);
const ssl =
  parsed.searchParams.has("sslmode") || parsed.searchParams.has("ssl")
    ? undefined
    : ["localhost", "127.0.0.1", "::1", "[::1]", "db"].includes(parsed.hostname)
      ? false
      : "require";

const sql = postgres(url, { max: 1, ssl, onnotice: () => {} });
try {
  await migrate(drizzle(sql), {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
  console.log("migrate: database is up to date");
} catch (error) {
  console.error("migrate: failed", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
