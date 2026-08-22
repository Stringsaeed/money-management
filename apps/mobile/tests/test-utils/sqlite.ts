import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

const LEGACY_MIGRATIONS = [
  "0000_true_leper_queen.sql",
  "0001_add_recurring_transaction_flag.sql",
  "0002_recurring_frequency_model.sql",
] as const;

interface TestSQLiteDatabase {
  database: SQLiteDatabase;
  close: VoidFunction;
}

export function createTestSQLiteDatabase(): TestSQLiteDatabase {
  const nativeDatabase = new DatabaseSync(":memory:");
  nativeDatabase.exec("PRAGMA foreign_keys = ON");

  const runTransaction = async (task: () => Promise<void>) => {
    nativeDatabase.exec("BEGIN IMMEDIATE");
    try {
      await task();
      nativeDatabase.exec("COMMIT");
    } catch (error) {
      nativeDatabase.exec("ROLLBACK");
      throw error;
    }
  };

  const database = {
    execAsync: async (source: string) => {
      nativeDatabase.exec(source);
    },
    runAsync: async (source: string, ...params: unknown[]) => {
      const result = nativeDatabase.prepare(source).run(...(params as SQLInputValue[]));
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getFirstAsync: async <T>(source: string, ...params: unknown[]) => {
      return (nativeDatabase.prepare(source).get(...(params as SQLInputValue[])) as T) ?? null;
    },
    getAllAsync: async <T>(source: string, ...params: unknown[]) => {
      return nativeDatabase.prepare(source).all(...(params as SQLInputValue[])) as T[];
    },
    withTransactionAsync: async (task: () => Promise<void>) => runTransaction(task),
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) =>
      runTransaction(() => task(database as unknown as SQLiteDatabase)),
  } as unknown as SQLiteDatabase;

  return {
    database,
    close: () => nativeDatabase.close(),
  };
}

export async function applyLegacyMigrations(database: SQLiteDatabase): Promise<void> {
  for (const migration of LEGACY_MIGRATIONS) {
    const source = readFileSync(join(process.cwd(), "db", "migrations", migration), "utf8");
    await database.execAsync(source.replaceAll("--> statement-breakpoint", ""));
  }
}
