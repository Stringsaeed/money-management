import type { SQL } from "drizzle-orm";

export async function queryRows<T extends Record<string, unknown>>(
  db: { execute: (query: SQL) => Promise<unknown> },
  query: SQL,
): Promise<T[]> {
  const result = await db.execute(query);
  if (Array.isArray(result)) {
    return result as T[];
  }
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}
