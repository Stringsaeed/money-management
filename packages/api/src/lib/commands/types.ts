import type { createDb } from "@trove/db";

/**
 * The drizzle D1 database type the pipeline programs against.
 * Type-only: tests inject an equivalent libsql-backed instance.
 */
export type CommandDatabase = ReturnType<typeof createDb>;
