import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

const MIGRATION_KEY = "categoryLifecycleMigrationVersion";
const MIGRATION_VERSION = 1;
const REQUIRED_COLUMNS = ["lifecycle", "lifecycle_changed_at"] as const;

export async function migrateCategoryLifecycle(database: SQLiteDatabase): Promise<void> {
  await database.execAsync("PRAGMA foreign_keys = ON");

  await runInTransaction(database, async (transaction) => {
    const recordedVersion = await transaction.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      MIGRATION_KEY,
    );
    if (recordedVersion) {
      if (recordedVersion.value !== String(MIGRATION_VERSION)) {
        throw new Error(
          `Category lifecycle migration found unsupported migration version ${recordedVersion.value}. Restore a supported database before startup.`,
        );
      }
      await assertCurrentSchema(transaction);
      return;
    }

    const columns = await categoryColumns(transaction);
    const presentLifecycleColumns = REQUIRED_COLUMNS.filter((column) => columns.has(column));
    if (
      presentLifecycleColumns.length > 0 &&
      presentLifecycleColumns.length < REQUIRED_COLUMNS.length
    ) {
      throw new Error(
        "Category lifecycle migration found an incomplete lifecycle schema and will not guess its state.",
      );
    }

    if (presentLifecycleColumns.length === 0) {
      await transaction.execAsync(`
        ALTER TABLE categories
          ADD COLUMN lifecycle TEXT NOT NULL DEFAULT 'active'
          CHECK (lifecycle IN ('active', 'archived'));
        ALTER TABLE categories ADD COLUMN lifecycle_changed_at TEXT;
      `);
    }

    await assertCurrentSchema(transaction);
    await transaction.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      MIGRATION_KEY,
      String(MIGRATION_VERSION),
    );
  });
}

async function categoryColumns(database: SQLiteDatabase): Promise<Set<string>> {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(categories)");
  return new Set(columns.map(({ name }) => name));
}

async function assertCurrentSchema(database: SQLiteDatabase): Promise<void> {
  const columns = await categoryColumns(database);
  if (REQUIRED_COLUMNS.some((column) => !columns.has(column))) {
    throw new Error("Category lifecycle migration is incomplete. Restore a supported database.");
  }
  const schema = await database.getFirstAsync<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'categories'",
  );
  const normalizedSql = (schema?.sql ?? "").toLowerCase().replaceAll(/\s+/g, "");
  if (!normalizedSql.includes("check(lifecyclein('active','archived'))")) {
    throw new Error(
      "Category lifecycle migration found an unsupported lifecycle constraint. Restore a supported database before startup.",
    );
  }
}
