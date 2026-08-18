import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

const MIGRATION_KEY = "categoryLifecycleMigrationVersion";
const MIGRATION_VERSION = 1;
const REQUIRED_COLUMNS = ["lifecycle", "lifecycle_changed_at"] as const;
const EXPECTED_COLUMNS = {
  lifecycle: { type: "TEXT", notnull: 1, defaultValue: "'active'", primaryKey: 0 },
  lifecycle_changed_at: { type: "TEXT", notnull: 0, defaultValue: null, primaryKey: 0 },
} as const;
const ACTIVITY_GUARD_TRIGGERS = {
  category_active_transaction_insert: `CREATE TRIGGER category_active_transaction_insert
    BEFORE INSERT ON transactions
    WHEN NEW.category_id IS NOT NULL
      AND NEW.recurring_rule_id IS NULL
      AND EXISTS (
        SELECT 1 FROM categories
        WHERE id = NEW.category_id AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Category is unavailable for new activity.');
    END`,
  category_active_transaction_update: `CREATE TRIGGER category_active_transaction_update
    BEFORE UPDATE OF category_id ON transactions
    WHEN NEW.category_id IS NOT OLD.category_id
      AND NEW.category_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM categories
        WHERE id = NEW.category_id AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Category is unavailable for new activity.');
    END`,
  category_active_recurring_rule_insert: `CREATE TRIGGER category_active_recurring_rule_insert
    BEFORE INSERT ON recurring_rules
    WHEN NEW.category_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM categories
        WHERE id = NEW.category_id AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Category is unavailable for new activity.');
    END`,
  category_active_recurring_rule_update: `CREATE TRIGGER category_active_recurring_rule_update
    BEFORE UPDATE OF category_id ON recurring_rules
    WHEN NEW.category_id IS NOT OLD.category_id
      AND NEW.category_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM categories
        WHERE id = NEW.category_id AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Category is unavailable for new activity.');
    END`,
} as const;

interface TableColumn {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

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

    await assertCategoryColumns(transaction);
    await transaction.execAsync(`${Object.values(ACTIVITY_GUARD_TRIGGERS).join(";\n")};`);
    await assertCurrentSchema(transaction);
    await transaction.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      MIGRATION_KEY,
      String(MIGRATION_VERSION),
    );
  });
}

async function categoryColumns(database: SQLiteDatabase): Promise<Map<string, TableColumn>> {
  const columns = await database.getAllAsync<TableColumn>("PRAGMA table_info(categories)");
  return new Map(columns.map((column) => [column.name, column]));
}

async function assertCurrentSchema(database: SQLiteDatabase): Promise<void> {
  await assertCategoryColumns(database);
  await assertActivityGuardTriggers(database);
}

async function assertCategoryColumns(database: SQLiteDatabase): Promise<void> {
  const columns = await categoryColumns(database);
  if (REQUIRED_COLUMNS.some((column) => !columns.has(column))) {
    throw new Error("Category lifecycle migration is incomplete. Restore a supported database.");
  }
  for (const [name, expected] of Object.entries(EXPECTED_COLUMNS)) {
    const actual = columns.get(name);
    if (
      actual?.type.toUpperCase() !== expected.type ||
      actual.notnull !== expected.notnull ||
      actual.dflt_value !== expected.defaultValue ||
      actual.pk !== expected.primaryKey
    ) {
      throw new Error(
        `Category lifecycle column ${name} does not match the supported structure. Restore a supported database before startup.`,
      );
    }
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

async function assertActivityGuardTriggers(database: SQLiteDatabase): Promise<void> {
  for (const [name, expectedSql] of Object.entries(ACTIVITY_GUARD_TRIGGERS)) {
    const trigger = await database.getFirstAsync<{ sql: string | null }>(
      "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?",
      name,
    );
    if (normalizeSchemaSql(trigger?.sql ?? "") !== normalizeSchemaSql(expectedSql)) {
      throw new Error(
        `Category lifecycle trigger ${name} does not match the supported structure. Restore a supported database before startup.`,
      );
    }
  }
}

function normalizeSchemaSql(source: string): string {
  return source
    .toLowerCase()
    .replaceAll(/["`\[\]]/g, "")
    .replaceAll(/\s+/g, "");
}
