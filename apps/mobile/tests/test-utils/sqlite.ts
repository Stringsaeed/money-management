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

/**
 * Split a SQL source into individual statements, respecting string literals,
 * quoted identifiers, and comments. node:sqlite's `prepare()` only accepts a
 * single statement — multi-statement sources (like Drizzle migration files)
 * must be executed statement-by-statement or trailing statements are silently
 * dropped.
 */
function splitStatements(source: string): string[] {
  const statements: string[] = [];
  let current = "";
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === "-" && source[index + 1] === "-") {
      const end = source.indexOf("\n", index);
      index = end === -1 ? source.length : end;
      current += "\n";
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      const end = source.indexOf(char, index + 1);
      const literalEnd = end === -1 ? source.length : end + 1;
      current += source.slice(index, literalEnd);
      index = literalEnd;
      continue;
    }
    if (char === ";") {
      statements.push(current.trim());
      current = "";
      index += 1;
      continue;
    }
    current += char;
    index += 1;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
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
      const [first, ...rest] = splitStatements(source);
      if (rest.length > 0) {
        // Multi-statement sources carry no bound parameters; execute the tail
        // eagerly so nothing is silently dropped by single-statement prepare().
        nativeDatabase.exec(rest.join(";\n"));
      }
      const result = nativeDatabase.prepare(first).run(...(params as SQLInputValue[]));
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
    prepareSync: (source: string) => {
      const [first, ...rest] = splitStatements(source);
      if (rest.length > 0) {
        nativeDatabase.exec(rest.join(";\n"));
      }
      const statement = nativeDatabase.prepare(first);
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
