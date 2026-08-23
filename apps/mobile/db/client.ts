/**
 * Typed drizzle DB wrapper over Expo SQLite.
 */
import { useMemo } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

/**
 * Returns a drizzle-wrapped database instance from the SQLite context.
 * Must be called inside a component wrapped by <SQLiteProvider>. Memoized so
 * consumers can safely list it in hook dependency arrays.
 */
export function useDatabase() {
  const sqlite = useSQLiteContext();
  return useMemo(() => drizzle(sqlite, { schema }), [sqlite]);
}
