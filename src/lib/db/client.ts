import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { lazyObject } from "@/lib/lazy";
import * as schema from "./schema";
import { sslFor } from "./ssl";

// One connection pool per process. In development it survives hot reloads; the
// Drizzle wrapper does not, so schema changes are picked up straight away.
const globalForDb = globalThis as unknown as { simpledashSql?: postgres.Sql };

function pool(): postgres.Sql {
  globalForDb.simpledashSql ??= postgres(env.DATABASE_URL, {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: sslFor(env.DATABASE_URL),
    onnotice: () => {},
  });
  return globalForDb.simpledashSql;
}

const createDb = () => drizzle(pool(), { schema });

/**
 * The Drizzle client. Created on first use, so importing this file never reads
 * DATABASE_URL or opens a connection (a build doesn't need the database).
 */
export const db: ReturnType<typeof createDb> = lazyObject(createDb);
export type Db = typeof db;
