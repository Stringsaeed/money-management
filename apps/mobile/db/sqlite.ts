import { createContext, createElement, use, type ReactNode } from "react";
import { Platform } from "react-native";
import {
  open,
  openAsync,
  type DB,
  type OPSQLiteConnection,
  type QueryResult,
  type Scalar,
} from "@op-engineering/op-sqlite";
import { Directory, Paths } from "expo-file-system";

import { DB_NAME } from "./constants";

export type SQLiteBindValue = Scalar;

export interface SQLiteRunResult {
  changes: number;
  lastInsertRowId: number;
}

export type SQLiteDatabase = OPSQLiteConnection;

const SqliteContext = createContext<SQLiteDatabase | null>(null);
const openCache = new Map<string, Promise<SQLiteDatabase>>();

export function useSQLiteContext(): SQLiteDatabase {
  const database = use(SqliteContext);
  if (database == null) {
    throw new Error("useSQLiteContext must be used inside SQLiteProvider.");
  }
  return database;
}

interface SQLiteProviderProps {
  children: ReactNode;
  databaseName?: string;
  onInit?: (database: SQLiteDatabase) => Promise<void>;
  useSuspense?: boolean;
}

export function SQLiteProvider({ children, databaseName = DB_NAME, onInit }: SQLiteProviderProps) {
  const database = use(openLedgerDatabase(databaseName, onInit));
  return createElement(SqliteContext.Provider, { value: database }, children);
}

export function wrapOpSqlite(client: DB): SQLiteDatabase {
  const execute = (query: string, params: Scalar[] = []) =>
    drizzleResult(client.executeSync(query, params));

  const executeAsync = async (query: string, params: Scalar[] = []) => execute(query, params);

  const executeRawAsync = async (query: string, params: Scalar[] = []) =>
    client.executeRawSync(query, params).rawRows ?? [];

  const database: SQLiteDatabase = {
    execute,
    executeAsync,
    executeRawAsync,
    execAsync: async (source: string) => {
      try {
        await executeAsync(source);
      } catch {
        for (const statement of splitStatements(source)) {
          await executeAsync(statement);
        }
      }
    },
    runAsync: async (source: string, ...params: unknown[]) => {
      const result = await executeAsync(source, bindParams(params));
      return {
        changes: Number(result.rowsAffected ?? 0),
        lastInsertRowId: Number(result.insertId ?? 0),
      };
    },
    getFirstAsync: async <T>(source: string, ...params: unknown[]) => {
      const result = await executeAsync(source, bindParams(params));
      const row = rowsOf(result)[0];
      if (row == null) return null;
      // SAFETY: The caller names T from the SELECT column list.
      return row as T;
    },
    getAllAsync: async <T>(source: string, ...params: unknown[]) => {
      const result = await executeAsync(source, bindParams(params));
      // SAFETY: The caller names T from the SELECT column list.
      return rowsOf(result) as T[];
    },
    withTransactionAsync: async (task: () => Promise<void>) => {
      await client.transaction(async () => {
        await task();
      });
    },
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) => {
      await executeAsync("BEGIN EXCLUSIVE");
      try {
        await task(database);
        await executeAsync("COMMIT");
      } catch (error) {
        await executeAsync("ROLLBACK");
        throw error;
      }
    },
  };

  return database;
}

function openLedgerDatabase(
  databaseName: string,
  onInit?: (database: SQLiteDatabase) => Promise<void>,
): Promise<SQLiteDatabase> {
  const cached = openCache.get(databaseName);
  if (cached) return cached;

  const opened = (async () => {
    const database = wrapOpSqlite(await openNative(databaseName));
    await onInit?.(database);
    return database;
  })();

  openCache.set(databaseName, opened);
  return opened;
}

async function openNative(name: string) {
  const location = sqliteDirectoryPath();
  const options = location ? { name, location } : { name };
  if (Platform.OS === "web") {
    return openAsync(options);
  }
  return open(options);
}

function sqliteDirectoryPath(): string | undefined {
  try {
    const directory = new Directory(Paths.document, "SQLite");
    if (!directory.exists) {
      directory.create();
    }
    return directory.uri.replace(/^file:\/\//, "");
  } catch {
    return undefined;
  }
}

function bindParams(params: readonly unknown[]): Scalar[] {
  const values = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  // SAFETY: Call sites pass SQLite bind scalars or one scalar array, same as expo-sqlite.
  return values as Scalar[];
}

function drizzleResult(result: QueryResult): QueryResult {
  const rows = rowsOf(result);
  return {
    ...result,
    rows: Object.assign(rows, { _array: rows, length: rows.length }),
  };
}

function rowsOf(result: QueryResult): Record<string, Scalar>[] {
  return Array.isArray(result.rows) ? result.rows : [];
}

function splitStatements(source: string): string[] {
  return source
    .replaceAll("--> statement-breakpoint", ";")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}
