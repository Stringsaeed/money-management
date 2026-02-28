/**
 * Re-export useSQLiteContext for convenience, and provide a typed
 * drizzle DB wrapper.
 */
import { useSQLiteContext } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

export { useSQLiteContext };

/**
 * Returns a drizzle-wrapped database instance from the SQLite context.
 * Must be called inside a component wrapped by <SQLiteProvider>.
 */
export function useDatabase() {
  const sqlite = useSQLiteContext();
  return drizzle(sqlite, { schema });
}
