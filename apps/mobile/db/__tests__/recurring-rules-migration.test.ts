import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "@/db/sqlite";

import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { migrateRecurringRules } from "../recurring-rules-migration";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

async function createLegacyDatabase() {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  return testDatabase.database;
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("migrateRecurringRules", () => {
  it("preserves a legacy Rule and reconstructs its Settled Occurrences", async () => {
    const database = await createLegacyDatabase();

    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "account-1",
      "Main",
      "checking",
      "USD",
      "#8B9D83",
      "banknote.fill",
      0,
      0,
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO recurring_payments (
        id, name, type, amount, currency, account_id, description,
        frequency, interval_count, start_date, last_generated_date,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "rule-1",
      "Rent",
      "expense",
      120_000,
      "USD",
      "account-1",
      "Monthly rent",
      "month",
      1,
      "2026-01-31",
      "2026-03-31",
      1,
      "2026-01-01T00:00:00.000Z",
      "2026-03-31T08:00:00.000Z",
    );

    for (const [id, date] of [
      ["transaction-1", "2026-01-31"],
      ["transaction-2", "2026-02-28"],
      ["transaction-3", "2026-03-31"],
    ] as const) {
      await database.runAsync(
        `INSERT INTO transactions (
          id, type, amount, currency, date, account_id, is_recurring,
          recurring_payment_id, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        "expense",
        120_000,
        "USD",
        date,
        "account-1",
        1,
        "rule-1",
        "Monthly rent",
        `${date}T08:00:00.000Z`,
        `${date}T08:00:00.000Z`,
      );
    }

    await migrateRecurringRules(database, {
      timeZone: "Asia/Dubai",
      localDate: "2026-04-15",
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'recurring_payments'"),
    ).resolves.toBeNull();
    await expect(
      database.getFirstAsync(
        `SELECT
          id, lifecycle, health, time_zone AS timeZone,
          eligibility_floor AS eligibilityFloor, revision
        FROM recurring_rules WHERE id = ?`,
        "rule-1",
      ),
    ).resolves.toEqual({
      id: "rule-1",
      lifecycle: "active",
      health: "ready",
      timeZone: "Asia/Dubai",
      eligibilityFloor: "2026-01-31",
      revision: 1,
    });
    await expect(
      database.getAllAsync(
        `SELECT scheduled_date AS scheduledDate, transaction_id AS transactionId
         FROM recurring_occurrences
         WHERE rule_id = ?
         ORDER BY scheduled_date`,
        "rule-1",
      ),
    ).resolves.toEqual([
      { scheduledDate: "2026-01-31", transactionId: "transaction-1" },
      { scheduledDate: "2026-02-28", transactionId: "transaction-2" },
      { scheduledDate: "2026-03-31", transactionId: "transaction-3" },
    ]);
    await expect(
      database.getAllAsync(
        `SELECT recurring_rule_id AS recurringRuleId
         FROM transactions
         ORDER BY id`,
      ),
    ).resolves.toEqual([
      { recurringRuleId: "rule-1" },
      { recurringRuleId: "rule-1" },
      { recurringRuleId: "rule-1" },
    ]);

    await database.runAsync("DELETE FROM transactions WHERE id = ?", "transaction-1");
    await expect(
      database.getFirstAsync(
        `SELECT transaction_id AS transactionId
         FROM recurring_occurrences
         WHERE rule_id = ? AND scheduled_date = ?`,
        "rule-1",
        "2026-01-31",
      ),
    ).resolves.toEqual({ transactionId: null });
    await expect(
      database.runAsync(
        `INSERT INTO recurring_occurrences (
          rule_id, scheduled_date, transaction_id, settled_at
        ) VALUES (?, ?, ?, ?)`,
        "rule-1",
        "2026-01-31",
        null,
        "2026-04-15T09:00:00.000Z",
      ),
    ).rejects.toThrow();
  });

  it("preserves ambiguous legacy transactions without guessing their Occurrence", async () => {
    const database = await createLegacyDatabase();

    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "account-1",
      "Main",
      "checking",
      "USD",
      "#8B9D83",
      "banknote.fill",
      0,
      0,
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO recurring_payments (
        id, name, type, amount, currency, account_id, description,
        frequency, interval_count, start_date, last_generated_date,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "rule-1",
      "Rent",
      "expense",
      120_000,
      "USD",
      "account-1",
      "Monthly rent",
      "month",
      1,
      "2026-01-31",
      "2026-01-31",
      1,
      "2026-01-01T00:00:00.000Z",
      "2026-01-31T08:00:00.000Z",
    );

    for (const id of ["transaction-1", "transaction-2"]) {
      await database.runAsync(
        `INSERT INTO transactions (
          id, type, amount, currency, date, account_id, is_recurring,
          recurring_payment_id, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        "expense",
        120_000,
        "USD",
        "2026-01-31",
        "account-1",
        1,
        "rule-1",
        "Monthly rent",
        `2026-01-31T0${id.endsWith("1") ? "8" : "9"}:00:00.000Z`,
        "2026-01-31T10:00:00.000Z",
      );
    }

    await migrateRecurringRules(database, {
      timeZone: "Asia/Dubai",
      localDate: "2026-02-01",
      now: "2026-02-01T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync(
        `SELECT transaction_id AS transactionId
         FROM recurring_occurrences
         WHERE rule_id = ? AND scheduled_date = ?`,
        "rule-1",
        "2026-01-31",
      ),
    ).resolves.toEqual({ transactionId: null });
    await expect(
      database.getAllAsync(
        `SELECT id, recurring_rule_id AS recurringRuleId
         FROM transactions
         ORDER BY id`,
      ),
    ).resolves.toEqual([
      { id: "transaction-1", recurringRuleId: "rule-1" },
      { id: "transaction-2", recurringRuleId: "rule-1" },
    ]);
  });

  it("maps an inactive Rule to Completed when no anchored date remains before its end", async () => {
    const database = await createLegacyDatabase();

    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "account-1",
      "Main",
      "checking",
      "USD",
      "#8B9D83",
      "banknote.fill",
      0,
      0,
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO recurring_payments (
        id, name, type, amount, currency, account_id, description,
        frequency, interval_count, start_date, end_date,
        last_generated_date, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "rule-1",
      "Short plan",
      "expense",
      10_00,
      "USD",
      "account-1",
      "",
      "month",
      1,
      "2026-01-31",
      "2026-02-15",
      "2026-01-31",
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-02-15T08:00:00.000Z",
    );

    await migrateRecurringRules(database, {
      timeZone: "Asia/Dubai",
      localDate: "2026-04-15",
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync(
        `SELECT lifecycle, eligibility_floor AS eligibilityFloor
         FROM recurring_rules WHERE id = ?`,
        "rule-1",
      ),
    ).resolves.toEqual({
      lifecycle: "completed",
      eligibilityFloor: "2026-04-16",
    });
  });

  it("preserves an orphaned legacy Rule as Needs Attention", async () => {
    const database = await createLegacyDatabase();
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.runAsync(
      `INSERT INTO recurring_payments (
        id, name, type, amount, currency, account_id, description,
        frequency, interval_count, start_date, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "rule-1",
      "Orphaned rent",
      "expense",
      120_000,
      "USD",
      "missing-account",
      "Monthly rent",
      "month",
      1,
      "2026-01-31",
      1,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.execAsync("PRAGMA foreign_keys = ON");

    await migrateRecurringRules(database, {
      timeZone: "Asia/Dubai",
      localDate: "2026-04-15",
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(
      database.getFirstAsync(
        `SELECT
          account_id AS accountId,
          health,
          attention_reasons AS attentionReasons
        FROM recurring_rules WHERE id = ?`,
        "rule-1",
      ),
    ).resolves.toEqual({
      accountId: null,
      health: "needs_attention",
      attentionReasons: JSON.stringify([
        { kind: "missing-source-account", formerAccountId: "missing-account" },
      ]),
    });
  });

  it("preserves an invalid legacy cadence as Needs Attention", async () => {
    const database = await createLegacyDatabase();
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "account-1",
      "Main",
      "checking",
      "USD",
      "#8B9D83",
      "banknote.fill",
      0,
      0,
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.runAsync(
      `INSERT INTO recurring_payments (
        id, name, type, amount, currency, account_id, description,
        frequency, interval_count, start_date, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "rule-1",
      "Broken",
      "expense",
      10_00,
      "USD",
      "account-1",
      "",
      "fortnight",
      1,
      "2026-01-01",
      1,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );

    await expect(
      migrateRecurringRules(database, {
        timeZone: "Asia/Dubai",
        localDate: "2026-04-15",
        now: "2026-04-15T08:00:00.000Z",
      }),
    ).resolves.toBeUndefined();

    await expect(
      database.getFirstAsync(
        `SELECT
          frequency,
          interval_count AS intervalCount,
          health,
          attention_reasons AS attentionReasons,
          attention_details AS attentionDetails,
          eligibility_floor AS eligibilityFloor
        FROM recurring_rules WHERE id = ?`,
        "rule-1",
      ),
    ).resolves.toEqual({
      frequency: "month",
      intervalCount: 1,
      health: "needs_attention",
      attentionReasons: JSON.stringify([{ kind: "invalid-legacy-cadence" }]),
      attentionDetails: JSON.stringify({
        legacyCadence: {
          frequency: "fortnight",
          intervalCount: 1,
          lastGeneratedDate: null,
        },
      }),
      eligibilityFloor: "2026-04-16",
    });
  });

  it("keeps a migrated transfer destination protected until account coordination runs", async () => {
    const database = await createLegacyDatabase();

    for (const [id, name] of [
      ["account-1", "Main"],
      ["account-2", "Savings"],
    ] as const) {
      await database.runAsync(
        `INSERT INTO accounts (
          id, name, type, currency, color, icon, initial_balance,
          exclude_from_total, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        name,
        "checking",
        "USD",
        "#8B9D83",
        "banknote.fill",
        0,
        0,
        0,
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      );
    }
    await database.runAsync(
      `INSERT INTO recurring_payments (
        id, name, type, amount, currency, account_id, to_account_id,
        description, frequency, interval_count, start_date,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "rule-1",
      "Savings sweep",
      "transfer",
      50_00,
      "USD",
      "account-1",
      "account-2",
      "",
      "month",
      1,
      "2026-01-01",
      1,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );

    await migrateRecurringRules(database, {
      timeZone: "Asia/Dubai",
      localDate: "2026-04-15",
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(
      database.runAsync("DELETE FROM accounts WHERE id = ?", "account-2"),
    ).rejects.toThrow();
    await expect(
      database.getFirstAsync("SELECT id FROM recurring_rules WHERE id = ?", "rule-1"),
    ).resolves.toEqual({ id: "rule-1" });
  });

  it("uses the supported non-exclusive migration transaction on web", async () => {
    const database = await createLegacyDatabase();
    const previousPlatform = process.env.EXPO_OS;
    process.env.EXPO_OS = "web";

    try {
      await migrateRecurringRules(database, {
        timeZone: "Asia/Dubai",
        localDate: "2026-04-15",
        now: "2026-04-15T08:00:00.000Z",
      });
    } finally {
      process.env.EXPO_OS = previousPlatform;
    }

    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "recurringRulesMigrationVersion",
      ),
    ).resolves.toEqual({ value: "1" });
  });

  it("rolls back destructive schema changes when final validation fails", async () => {
    const database = await createLegacyDatabase();
    await database.runAsync(
      `INSERT INTO accounts (
        id, name, type, currency, color, icon, initial_balance,
        exclude_from_total, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "account-1",
      "Main",
      "checking",
      "USD",
      "#8B9D83",
      "banknote.fill",
      0,
      0,
      0,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    await database.execAsync("PRAGMA foreign_keys = OFF");
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, date, account_id, is_recurring,
        recurring_payment_id, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "transaction-1",
      "expense",
      10_00,
      "USD",
      "2026-01-01",
      "account-1",
      1,
      "missing-rule",
      "Broken lineage",
      "2026-01-01T08:00:00.000Z",
      "2026-01-01T08:00:00.000Z",
    );
    await database.execAsync("PRAGMA foreign_keys = ON");

    await expect(
      migrateRecurringRules(database, {
        timeZone: "Asia/Dubai",
        localDate: "2026-04-15",
        now: "2026-04-15T08:00:00.000Z",
      }),
    ).rejects.toThrow("invalid foreign keys");

    await expect(
      database.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'recurring_payments'"),
    ).resolves.toEqual({ name: "recurring_payments" });
    await expect(
      database.getAllAsync<{ name: string }>("PRAGMA table_info(transactions)"),
    ).resolves.toContainEqual(expect.objectContaining({ name: "recurring_payment_id" }));
    await expect(
      database.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'recurring_rules'"),
    ).resolves.toBeNull();
  });

  it("refuses to stamp an incomplete migrated schema", async () => {
    const database = await createLegacyDatabase();
    await database.execAsync("DROP TABLE recurring_payments");

    await expect(
      migrateRecurringRules(database, {
        timeZone: "Asia/Dubai",
        localDate: "2026-04-15",
        now: "2026-04-15T08:00:00.000Z",
      }),
    ).rejects.toThrow("complete legacy schema or the complete migrated schema");

    await expect(
      database.getFirstAsync(
        "SELECT value FROM app_settings WHERE key = ?",
        "recurringRulesMigrationVersion",
      ),
    ).resolves.toBeNull();
  });
});
