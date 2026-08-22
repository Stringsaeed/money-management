import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for the server-side Postgres database (Supabase).
 *
 * This is deliberately separate from `apps/mobile`'s SQLite setup: the mobile
 * app owns its local cache schema, while this package owns the
 * household-tenanted server schema. DDL source of truth remains
 * `supabase/migrations/*.sql`; Drizzle Kit generates SQL from
 * `src/schema` for review before it is folded into those migrations.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:54322/postgres",
  },
  strict: true,
  verbose: true,
});
