import { defineConfig } from "drizzle-kit";

// drizzle-kit only needs the database for `studio`; `generate` works offline.
// Load .env first, for example: node --env-file=.env node_modules/.bin/drizzle-kit studio
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
