import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import type { SQLiteDatabase } from "@/db/sqlite";

const LEGACY_MIGRATIONS = [
  "0000_true_leper_queen.sql",
  "0001_add_recurring_transaction_flag.sql",
  "0002_recurring_frequency_model.sql",
] as const;

export interface TestSQLiteDatabase {
  database: SQLiteDatabase;
  close: VoidFunction;
}

export function createTestSQLiteDatabase(): TestSQLiteDatabase {
  const nativeDatabase = new DatabaseSync(":memory:");
  nativeDatabase.exec("PRAGMA foreign_keys = ON");

  const bind = (params: unknown[]) => {
    const values = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    // SAFETY: Tests pass SQLite bind scalars through the same rest-arg shape as production.
    return values as SQLInputValue[];
  };

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

  const execute = (source: string, params: unknown[] = []) => {
    const statement = nativeDatabase.prepare(source);
    if (statement.columns().length > 0) {
      const rows = statement.all(...bind([params])) as Record<string, unknown>[];
      return {
        rows: Object.assign(rows, { _array: rows, length: rows.length }),
        rowsAffected: 0,
        insertId: 0,
      };
    }
    const result = statement.run(...bind([params]));
    const rows: Record<string, unknown>[] = [];
    return {
      rows: Object.assign(rows, { _array: rows, length: 0 }),
      rowsAffected: Number(result.changes),
      insertId: Number(result.lastInsertRowid),
    };
  };

  const database = {
    execAsync: async (source: string) => {
      nativeDatabase.exec(source);
    },
    runAsync: async (source: string, ...params: unknown[]) => {
      const result = nativeDatabase.prepare(source).run(...bind(params));
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    getFirstAsync: async <T>(source: string, ...params: unknown[]) => {
      return (nativeDatabase.prepare(source).get(...bind(params)) as T) ?? null;
    },
    getAllAsync: async <T>(source: string, ...params: unknown[]) => {
      return nativeDatabase.prepare(source).all(...bind(params)) as T[];
    },
    withTransactionAsync: async (task: () => Promise<void>) => runTransaction(task),
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) =>
      runTransaction(() => task(database as unknown as SQLiteDatabase)),
    execute: (source: string, params: unknown[] = []) => execute(source, params),
    executeAsync: async (source: string, params: unknown[] = []) => execute(source, params),
    executeRawAsync: async (source: string, params: unknown[] = []) => {
      const statement = nativeDatabase.prepare(source);
      const columns = statement.columns().map(({ name }) => name);
      const rows = statement.all(...bind([params])) as Record<string, unknown>[];
      return rows.map((row) => columns.map((column) => row[column]));
    },
    prepareSync: (source: string) => {
      const statement = nativeDatabase.prepare(source);
      const executeRows = (params: unknown[] = []) =>
        statement.all(...(params as SQLInputValue[])) as Record<string, unknown>[];

      return {
        executeSync: (params: unknown[] = []) => {
          if (statement.columns().length > 0) {
            const rows = executeRows(params);
            return {
              changes: 0,
              lastInsertRowId: 0,
              getAllSync: () => rows,
              getFirstSync: () => rows[0] ?? null,
            };
          }

          const result = statement.run(...(params as SQLInputValue[]));
          return {
            changes: Number(result.changes),
            lastInsertRowId: Number(result.lastInsertRowid),
            getAllSync: () => [],
            getFirstSync: () => null,
          };
        },
        executeForRawResultSync: (params: unknown[] = []) => {
          const columns = statement.columns().map(({ name }) => name);
          const rows = executeRows(params);
          return {
            getAllSync: () => rows.map((row) => columns.map((column) => row[column])),
          };
        },
      };
    },
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

export async function markLegacyMigrationsApplied(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at NUMERIC
    );
  `);
  await database.runAsync(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    "",
    1_787_000_000_000,
  );
}
