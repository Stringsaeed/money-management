import type { SQLiteDatabase } from "expo-sqlite";

import { DATABASE_RESET_VERSION, resetDatabaseIfNeeded } from "./reset";

interface FakeDb {
  db: SQLiteDatabase;
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
}

function createDb({
  storedVersion,
  tables = [],
}: {
  storedVersion: number | "missing-table";
  tables?: string[];
}): FakeDb {
  const getFirstAsync = jest.fn(async () => {
    if (storedVersion === "missing-table") {
      throw new Error("no such table: app_settings");
    }
    return storedVersion === 0 ? null : { value: String(storedVersion) };
  });

  const getAllAsync = jest.fn(async () => tables.map((name) => ({ name })));
  const execAsync = jest.fn(async () => undefined);

  return {
    db: { execAsync, getAllAsync, getFirstAsync } as unknown as SQLiteDatabase,
    execAsync,
    getAllAsync,
    getFirstAsync,
  };
}

/** The DROP statements issued, in order. */
function droppedTables(execAsync: jest.Mock): string[] {
  return execAsync.mock.calls
    .map(([statement]) => String(statement))
    .filter((statement) => statement.startsWith("DROP TABLE"));
}

describe("db/reset", () => {
  it("does nothing when the install already saw the current reset version", async () => {
    const { db, execAsync } = createDb({
      storedVersion: DATABASE_RESET_VERSION,
      tables: ["accounts"],
    });

    await expect(resetDatabaseIfNeeded(db)).resolves.toBe(false);
    expect(execAsync).not.toHaveBeenCalled();
  });

  it("does nothing when the install is ahead of the current reset version", async () => {
    const { db, execAsync } = createDb({ storedVersion: DATABASE_RESET_VERSION + 1 });

    await expect(resetDatabaseIfNeeded(db)).resolves.toBe(false);
    expect(execAsync).not.toHaveBeenCalled();
  });

  it("drops every user table when the install predates the reset version", async () => {
    const { db, execAsync } = createDb({
      storedVersion: 0,
      tables: ["accounts", "transactions", "__drizzle_migrations"],
    });

    await expect(resetDatabaseIfNeeded(db)).resolves.toBe(true);
    expect(droppedTables(execAsync)).toEqual([
      'DROP TABLE IF EXISTS "accounts"',
      'DROP TABLE IF EXISTS "transactions"',
      // Dropped too, so migrations replay and rebuild the schema.
      'DROP TABLE IF EXISTS "__drizzle_migrations"',
    ]);
  });

  it("preserves existing tables when startup is migrating a supported ledger", async () => {
    const { db, execAsync } = createDb({
      storedVersion: 0,
      tables: ["accounts", "transactions", "__drizzle_migrations"],
    });

    await expect(
      resetDatabaseIfNeeded(db, { preserveExistingTablesThroughVersion: 1 }),
    ).resolves.toBe(true);
    expect(execAsync).not.toHaveBeenCalled();
  });

  it("does not let an older preservation gate disable a future reset", async () => {
    const { db, execAsync } = createDb({ storedVersion: 0, tables: ["accounts"] });

    await resetDatabaseIfNeeded(db, {
      preserveExistingTablesThroughVersion: DATABASE_RESET_VERSION - 1,
    });

    expect(droppedTables(execAsync)).toEqual(['DROP TABLE IF EXISTS "accounts"']);
  });

  it("excludes sqlite internal tables from the wipe", async () => {
    const { db, getAllAsync } = createDb({ storedVersion: 0 });

    await resetDatabaseIfNeeded(db);

    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining("name NOT LIKE 'sqlite_%'"));
  });

  it("disables foreign keys around the drops and restores them after", async () => {
    const { db, execAsync } = createDb({ storedVersion: 0, tables: ["accounts"] });

    await resetDatabaseIfNeeded(db);

    const statements = execAsync.mock.calls.map(([statement]) => String(statement));
    expect(statements[0]).toBe("PRAGMA foreign_keys = OFF");
    expect(statements.at(-1)).toBe("PRAGMA foreign_keys = ON");
  });

  it("restores foreign keys even when a drop fails", async () => {
    const { db, execAsync } = createDb({ storedVersion: 0, tables: ["accounts"] });
    execAsync.mockImplementation(async (statement: string) => {
      if (statement.startsWith("DROP TABLE")) throw new Error("locked");
    });

    await expect(resetDatabaseIfNeeded(db)).rejects.toThrow("locked");

    const statements = execAsync.mock.calls.map(([statement]) => String(statement));
    expect(statements.at(-1)).toBe("PRAGMA foreign_keys = ON");
  });

  it("treats a fresh install with no app_settings as needing the reset stamp", async () => {
    const { db, execAsync } = createDb({ storedVersion: "missing-table" });

    // Nothing to drop, but returning true lets the caller record the version so
    // the next launch skips this path.
    await expect(resetDatabaseIfNeeded(db)).resolves.toBe(true);
    expect(droppedTables(execAsync)).toEqual([]);
  });
});
