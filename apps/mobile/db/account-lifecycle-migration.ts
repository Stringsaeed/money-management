import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

const MIGRATION_KEY = "accountLifecycleMigrationVersion";
const MIGRATION_VERSION = 1;
const REQUIRED_COLUMNS = ["lifecycle", "lifecycle_changed_at"] as const;
const EXPECTED_COLUMNS = {
  lifecycle: { type: "TEXT", notnull: 1, defaultValue: "'active'", primaryKey: 0 },
  lifecycle_changed_at: { type: "TEXT", notnull: 0, defaultValue: null, primaryKey: 0 },
} as const;

const ACCOUNT_BUDGET_HISTORY_SQL = `CREATE TABLE account_budget_history (
  account_id TEXT PRIMARY KEY NOT NULL,
  first_membership_period TEXT NOT NULL,
  first_recorded_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
)`;

const ACCOUNT_BUDGET_HISTORY_TRIGGER = `CREATE TRIGGER record_account_budget_history
  AFTER INSERT ON funding_memberships
  BEGIN
    INSERT INTO account_budget_history (
      account_id, first_membership_period, first_recorded_at
    ) VALUES (NEW.account_id, NEW.effective_from_period, NEW.created_at)
    ON CONFLICT(account_id) DO NOTHING;
  END`;

const ACTIVE_ACCOUNT_GUARDS = {
  active_account_transaction_insert: `CREATE TRIGGER active_account_transaction_insert
    BEFORE INSERT ON transactions
    WHEN EXISTS (
      SELECT 1 FROM accounts
      WHERE id IN (NEW.account_id, NEW.to_account_id) AND lifecycle <> 'active'
    )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Account is unavailable for new activity.');
    END`,
  active_account_transaction_update: `CREATE TRIGGER active_account_transaction_update
    BEFORE UPDATE OF account_id, to_account_id ON transactions
    WHEN (NEW.account_id IS NOT OLD.account_id OR NEW.to_account_id IS NOT OLD.to_account_id)
      AND EXISTS (
        SELECT 1 FROM accounts
        WHERE id IN (NEW.account_id, NEW.to_account_id) AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Account is unavailable for new activity.');
    END`,
  active_account_recurring_rule_insert: `CREATE TRIGGER active_account_recurring_rule_insert
    BEFORE INSERT ON recurring_rules
    WHEN EXISTS (
      SELECT 1 FROM accounts
      WHERE id IN (NEW.account_id, NEW.to_account_id) AND lifecycle <> 'active'
    )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Account is unavailable for new activity.');
    END`,
  active_account_recurring_rule_update: `CREATE TRIGGER active_account_recurring_rule_update
    BEFORE UPDATE OF account_id, to_account_id ON recurring_rules
    WHEN (NEW.account_id IS NOT OLD.account_id OR NEW.to_account_id IS NOT OLD.to_account_id)
      AND EXISTS (
        SELECT 1 FROM accounts
        WHERE id IN (NEW.account_id, NEW.to_account_id) AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Account is unavailable for new activity.');
    END`,
  active_account_funding_membership_insert: `CREATE TRIGGER active_account_funding_membership_insert
    BEFORE INSERT ON funding_memberships
    WHEN EXISTS (
      SELECT 1 FROM accounts WHERE id = NEW.account_id AND lifecycle <> 'active'
    )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Account cannot join a Funding Pool.');
    END`,
  active_account_funding_membership_update: `CREATE TRIGGER active_account_funding_membership_update
    BEFORE UPDATE OF account_id ON funding_memberships
    WHEN NEW.account_id IS NOT OLD.account_id
      AND EXISTS (
        SELECT 1 FROM accounts WHERE id = NEW.account_id AND lifecycle <> 'active'
      )
    BEGIN
      SELECT RAISE(ABORT, 'Archived Account cannot join a Funding Pool.');
    END`,
} as const;

interface TableColumn {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export async function migrateAccountLifecycle(database: SQLiteDatabase): Promise<void> {
  await database.execAsync("PRAGMA foreign_keys = ON");

  await runInTransaction(database, async (transaction) => {
    const recordedVersion = await transaction.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      MIGRATION_KEY,
    );
    if (recordedVersion) {
      if (recordedVersion.value !== String(MIGRATION_VERSION)) {
        throw new Error(
          `Account lifecycle migration found unsupported migration version ${recordedVersion.value}. Restore a supported database before startup.`,
        );
      }
      await assertCurrentSchema(transaction);
      return;
    }

    const columns = await accountColumns(transaction);
    const presentLifecycleColumns = REQUIRED_COLUMNS.filter((column) => columns.has(column));
    if (
      presentLifecycleColumns.length > 0 &&
      presentLifecycleColumns.length < REQUIRED_COLUMNS.length
    ) {
      throw new Error(
        "Account lifecycle migration found an incomplete lifecycle schema and will not guess its state.",
      );
    }

    if (presentLifecycleColumns.length === 0) {
      await transaction.execAsync(`
        ALTER TABLE accounts
          ADD COLUMN lifecycle TEXT NOT NULL DEFAULT 'active'
          CHECK (lifecycle IN ('active', 'archived'));
        ALTER TABLE accounts ADD COLUMN lifecycle_changed_at TEXT;
      `);
    }

    await assertAccountColumns(transaction);
    await transaction.execAsync(`${ACCOUNT_BUDGET_HISTORY_SQL};`);
    await transaction.runAsync(
      `INSERT INTO account_budget_history (
        account_id, first_membership_period, first_recorded_at
       )
       SELECT account_id, MIN(effective_from_period), MIN(created_at)
       FROM funding_memberships
       GROUP BY account_id`,
    );
    await transaction.execAsync(`${Object.values(ACTIVE_ACCOUNT_GUARDS).join(";\n")};`);
    await transaction.execAsync(`${ACCOUNT_BUDGET_HISTORY_TRIGGER};`);
    await assertCurrentSchema(transaction);
    await transaction.runAsync(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      MIGRATION_KEY,
      String(MIGRATION_VERSION),
    );
  });
}

async function accountColumns(database: SQLiteDatabase): Promise<Map<string, TableColumn>> {
  const columns = await database.getAllAsync<TableColumn>("PRAGMA table_info(accounts)");
  return new Map(columns.map((column) => [column.name, column]));
}

async function assertCurrentSchema(database: SQLiteDatabase): Promise<void> {
  await assertAccountColumns(database);
  const historyTable = await database.getFirstAsync<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'account_budget_history'",
  );
  if (
    normalizeSchemaSql(historyTable?.sql ?? "") !== normalizeSchemaSql(ACCOUNT_BUDGET_HISTORY_SQL)
  ) {
    throw new Error(
      "Account budget history does not match the supported structure. Restore a supported database before startup.",
    );
  }
  for (const [name, expectedSql] of Object.entries(ACTIVE_ACCOUNT_GUARDS)) {
    const trigger = await database.getFirstAsync<{ sql: string | null }>(
      "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?",
      name,
    );
    if (normalizeSchemaSql(trigger?.sql ?? "") !== normalizeSchemaSql(expectedSql)) {
      throw new Error(
        `Account lifecycle trigger ${name} does not match the supported structure. Restore a supported database before startup.`,
      );
    }
  }
  const historyTrigger = await database.getFirstAsync<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'record_account_budget_history'",
  );
  if (
    normalizeSchemaSql(historyTrigger?.sql ?? "") !==
    normalizeSchemaSql(ACCOUNT_BUDGET_HISTORY_TRIGGER)
  ) {
    throw new Error(
      "Account budget history tracking does not match the supported structure. Restore a supported database before startup.",
    );
  }
}

async function assertAccountColumns(database: SQLiteDatabase): Promise<void> {
  const columns = await accountColumns(database);
  if (REQUIRED_COLUMNS.some((column) => !columns.has(column))) {
    throw new Error("Account lifecycle migration is incomplete. Restore a supported database.");
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
        `Account lifecycle column ${name} does not match the supported structure. Restore a supported database before startup.`,
      );
    }
  }
  const schema = await database.getFirstAsync<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'accounts'",
  );
  const normalizedSql = normalizeSchemaSql(schema?.sql ?? "");
  if (!normalizedSql.includes("check(lifecyclein('active','archived'))")) {
    throw new Error(
      "Account lifecycle migration found an unsupported lifecycle constraint. Restore a supported database before startup.",
    );
  }
}

function normalizeSchemaSql(source: string): string {
  return source
    .toLowerCase()
    .replaceAll(/["`\[\]]/g, "")
    .replaceAll(/\s+/g, "");
}
