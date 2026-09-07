import type { SQLiteDatabase } from "@/db/sqlite";

import {
  BUDGETING_TABLES,
  CREATE_ASSIGNMENT_APPEND_ONLY_TRIGGERS_SQL,
  CREATE_BUDGETING_SCHEMA_SQL,
  REQUIRED_BUDGETING_COLUMNS,
} from "./budgeting-schema";

const MIGRATION_KEY = "budgetingMigrationVersion";
const MIGRATION_VERSION = 2;
const EXPECTED_TABLE_SQL = expectedTableSql();

export async function migrateBudgeting(database: SQLiteDatabase): Promise<void> {
  await database.execAsync("PRAGMA foreign_keys = ON");

  await runMigrationTransaction(database, async (transaction) => {
    await assertRecurringRulesMigrationComplete(transaction);

    const recordedVersion = await transaction.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      MIGRATION_KEY,
    );
    const existingTables = await existingBudgetingTables(transaction);

    if (recordedVersion !== null) {
      if (recordedVersion.value === "1") {
        await assertCompleteBudgetingSchema(transaction);
        await transaction.execAsync(CREATE_ASSIGNMENT_APPEND_ONLY_TRIGGERS_SQL);
        await stampMigrationVersion(transaction);
        await assertCurrentSchema(transaction, existingTables);
        return;
      }
      if (recordedVersion.value !== String(MIGRATION_VERSION)) {
        throw new Error(
          `Budgeting migration found unsupported migration version ${recordedVersion.value}. Restore a supported database before startup.`,
        );
      }
      await assertCurrentSchema(transaction, existingTables);
      return;
    }

    if (existingTables.length > 0 && existingTables.length !== BUDGETING_TABLES.length) {
      throw new Error(
        "Budgeting migration found an incomplete budgeting schema and will not guess its state.",
      );
    }

    if (existingTables.length === 0) {
      await transaction.execAsync(CREATE_BUDGETING_SCHEMA_SQL);
    }

    await assertCompleteBudgetingSchema(transaction);
    await transaction.execAsync(CREATE_ASSIGNMENT_APPEND_ONLY_TRIGGERS_SQL);
    await stampMigrationVersion(transaction);
    await assertValidForeignKeys(transaction);
  });
}

async function assertCurrentSchema(
  database: SQLiteDatabase,
  existingTables: readonly string[],
): Promise<void> {
  if (existingTables.length !== BUDGETING_TABLES.length) {
    throw incompleteCurrentSchemaError();
  }
  await assertCompleteBudgetingSchema(database);
  await assertAssignmentAppendOnlyTriggers(database);
  await assertValidForeignKeys(database);
}

async function stampMigrationVersion(database: SQLiteDatabase): Promise<void> {
  await database.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    MIGRATION_KEY,
    String(MIGRATION_VERSION),
  );
}

async function assertAssignmentAppendOnlyTriggers(database: SQLiteDatabase): Promise<void> {
  const triggers = await database.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master
     WHERE type = 'trigger'
       AND name IN ('assignments_append_only_update', 'assignments_append_only_delete')`,
  );
  if (triggers.length !== 2) throw incompleteCurrentSchemaError();
}

async function assertCompleteBudgetingSchema(database: SQLiteDatabase): Promise<void> {
  for (const table of BUDGETING_TABLES) {
    const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    const columnNames = new Set(columns.map(({ name }) => name));
    if (REQUIRED_BUDGETING_COLUMNS[table].some((column) => !columnNames.has(column))) {
      throw incompleteCurrentSchemaError();
    }

    const schema = await database.getFirstAsync<{ sql: string | null }>(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
      table,
    );
    if (normalizeSchemaSql(schema?.sql ?? "") !== EXPECTED_TABLE_SQL.get(table)) {
      throw new Error(
        `Budgeting table ${table} does not match the supported structure. Restore a supported database before startup.`,
      );
    }
  }
}

function expectedTableSql(): ReadonlyMap<string, string> {
  const definitions = CREATE_BUDGETING_SCHEMA_SQL.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  return new Map(
    definitions.map((definition) => {
      const match = /^CREATE TABLE\s+(\w+)/i.exec(definition);
      if (!match?.[1])
        throw new Error("Budgeting schema contains an unrecognized table definition.");
      return [match[1], normalizeSchemaSql(definition)] as const;
    }),
  );
}

function normalizeSchemaSql(source: string): string {
  return source
    .toLowerCase()
    .replaceAll(/["`\[\]]/g, "")
    .replaceAll(/\s+/g, "");
}

async function assertValidForeignKeys(database: SQLiteDatabase): Promise<void> {
  const failures = await database.getAllAsync("PRAGMA foreign_key_check");
  if (failures.length > 0) {
    throw new Error("Budgeting migration produced invalid foreign keys.");
  }
}

function incompleteCurrentSchemaError(): Error {
  return new Error(
    "Budgeting migration is stamped as current but its schema is incomplete. Restore a supported database before startup.",
  );
}

async function assertRecurringRulesMigrationComplete(database: SQLiteDatabase): Promise<void> {
  const hasRecurringRules = await tableExists(database, "recurring_rules");
  const hasOccurrences = await tableExists(database, "recurring_occurrences");
  const hasLegacyRules = await tableExists(database, "recurring_payments");
  const hasTransactionLineage = await columnExists(database, "transactions", "recurring_rule_id");

  if (!hasRecurringRules || !hasOccurrences || hasLegacyRules || !hasTransactionLineage) {
    throw new Error(
      "Budgeting migration requires the complete Recurring Rules migration to run first.",
    );
  }
}

async function existingBudgetingTables(database: SQLiteDatabase): Promise<string[]> {
  const tables: string[] = [];
  for (const table of BUDGETING_TABLES) {
    if (await tableExists(database, table)) tables.push(table);
  }
  return tables;
}

async function tableExists(database: SQLiteDatabase, table: string): Promise<boolean> {
  const row = await database.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    table,
  );
  return row !== null;
}

async function columnExists(
  database: SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some(({ name }) => name === column);
}

async function runMigrationTransaction(
  database: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  if (process.env.EXPO_OS === "web") {
    await database.withTransactionAsync(() => task(database));
    return;
  }
  await database.withExclusiveTransactionAsync(task);
}
