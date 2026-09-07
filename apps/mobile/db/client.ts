import { drizzle } from "drizzle-orm/op-sqlite";

import { useSQLiteContext, type SQLiteDatabase } from "@/db/sqlite";
import type { LocalDb } from "@/lib/sync/outbox";

import * as schema from "./schema";

const drizzleBySqlite = new WeakMap<SQLiteDatabase, LocalDb>();

export function databaseFor(sqlite: SQLiteDatabase): LocalDb {
  const existing = drizzleBySqlite.get(sqlite);
  if (existing) return existing;
  const db = drizzle(sqlite, { schema }) as LocalDb;
  drizzleBySqlite.set(sqlite, db);
  return db;
}

export function useDatabase() {
  return databaseFor(useSQLiteContext());
}
