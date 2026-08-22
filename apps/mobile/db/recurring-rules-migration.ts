import type { SQLiteDatabase } from "expo-sqlite";

import {
  dateAfter,
  scheduledDatesThrough,
  type RecurringRuleFrequency,
} from "@trove/domain/calendar";

const MIGRATION_KEY = "recurringRulesMigrationVersion";
const MIGRATION_VERSION = 1;

interface RecurringRulesMigrationOptions {
  timeZone: string;
  localDate: string;
  now: string;
}

interface LegacyRuleRow {
  id: string;
  name: string;
  type: string;
  amount: number;
  currency: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  frequency: string;
  intervalCount: number;
  startDate: string;
  endDate: string | null;
  endCount: number | null;
  lastGeneratedDate: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

interface LegacyTransactionRow {
  id: string;
  ruleId: string;
  date: string;
  createdAt: string;
}

interface AccountRow {
  id: string;
  currency: string;
}

type AttentionReason =
  | { kind: "missing-source-account"; formerAccountId: string }
  | { kind: "missing-destination-account"; formerAccountId: string | null }
  | {
      kind: "account-currency-changed";
      accountId: string;
      expected: string;
      actual: string;
    }
  | { kind: "invalid-legacy-amount" }
  | { kind: "invalid-legacy-cadence" };

interface LegacyCadence {
  frequency: RecurringRuleFrequency;
  intervalCount: number;
  canReconstruct: boolean;
}

export async function migrateRecurringRules(
  database: SQLiteDatabase,
  options: RecurringRulesMigrationOptions,
): Promise<void> {
  assertTimeZone(options.timeZone);
  await database.execAsync("PRAGMA foreign_keys = ON");

  await runMigrationTransaction(database, async (transaction) => {
    const recordedVersion = await transaction.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      MIGRATION_KEY,
    );
    if (Number(recordedVersion?.value) >= MIGRATION_VERSION) return;

    if (!(await tableExists(transaction, "recurring_payments"))) {
      const hasCompleteMigratedSchema =
        (await tableExists(transaction, "recurring_rules")) &&
        (await tableExists(transaction, "recurring_occurrences")) &&
        (await columnExists(transaction, "transactions", "recurring_rule_id"));
      if (!hasCompleteMigratedSchema) {
        throw new Error(
          "Recurring Rules migration cannot find either the complete legacy schema or the complete migrated schema.",
        );
      }
      await recordMigration(transaction);
      return;
    }

    await transaction.execAsync("PRAGMA defer_foreign_keys = ON");
    await transaction.execAsync(CREATE_RECURRING_RULES_SQL);

    const legacyRules = await transaction.getAllAsync<LegacyRuleRow>(LEGACY_RULES_QUERY);
    const legacyTransactions =
      await transaction.getAllAsync<LegacyTransactionRow>(LEGACY_TRANSACTIONS_QUERY);
    const accountRows = await transaction.getAllAsync<AccountRow>(
      "SELECT id, currency FROM accounts ORDER BY id",
    );
    const accountsById = new Map(accountRows.map((account) => [account.id, account]));
    const legacyTransactionCount = await countRows(transaction, "transactions");
    const legacyLineageCount = legacyTransactions.length;
    const settledDatesByRule = new Map<string, string[]>();
    let expectedOccurrenceCount = 0;

    for (const rule of legacyRules) {
      const cadence = legacyCadence(rule);
      const settledDates =
        cadence.canReconstruct && rule.lastGeneratedDate
          ? scheduledDatesThrough(
              {
                startDate: rule.startDate,
                frequency: cadence.frequency,
                intervalCount: cadence.intervalCount,
                endDate: rule.endDate,
                endCount: rule.endCount,
              },
              rule.lastGeneratedDate,
            )
          : [];
      settledDatesByRule.set(rule.id, settledDates);
      const lifecycle = cadence.canReconstruct
        ? legacyLifecycle(rule, cadence.frequency, settledDates.length)
        : rule.isActive
          ? "active"
          : "paused";
      const eligibilityFloor =
        lifecycle === "active" && cadence.canReconstruct
          ? rule.startDate
          : cadence.canReconstruct
            ? dateAfter(options.localDate)
            : dateAfter(rule.lastGeneratedDate ?? options.localDate);
      const readiness = legacyReadiness(rule, cadence, accountsById);

      await transaction.runAsync(
        INSERT_RULE_SQL,
        rule.id,
        rule.name,
        rule.type,
        readiness.amountMinor,
        rule.currency,
        readiness.accountId,
        readiness.toAccountId,
        rule.categoryId,
        rule.description,
        cadence.frequency,
        cadence.intervalCount,
        rule.startDate,
        rule.endDate,
        rule.endCount,
        options.timeZone,
        lifecycle,
        readiness.health,
        JSON.stringify(readiness.reasons),
        readiness.attentionDetails,
        eligibilityFloor,
        lifecycle === "active" ? null : options.now,
        readiness.health === "needs_attention" ? options.now : null,
        rule.createdAt,
        rule.updatedAt,
      );
    }

    await transaction.execAsync(REBUILD_TRANSACTIONS_SQL);
    await transaction.execAsync(CREATE_OCCURRENCES_SQL);

    for (const rule of legacyRules) {
      const dates = settledDatesByRule.get(rule.id) ?? [];
      expectedOccurrenceCount += dates.length;
      const transactionsByDate = matchingTransactionsByDate(legacyTransactions, rule.id);

      for (const scheduledDate of dates) {
        const matchingTransactions = transactionsByDate.get(scheduledDate) ?? [];
        const generatedTransaction =
          matchingTransactions.length === 1 ? matchingTransactions[0] : undefined;
        await transaction.runAsync(
          `INSERT INTO recurring_occurrences (
            rule_id, scheduled_date, transaction_id, settled_at
          ) VALUES (?, ?, ?, ?)`,
          rule.id,
          scheduledDate,
          generatedTransaction?.id ?? null,
          options.now,
        );
      }
    }

    await transaction.execAsync("DROP TABLE recurring_payments");
    await assertEqualCount(transaction, "Recurring Rule", legacyRules.length, "recurring_rules");
    await assertEqualCount(transaction, "Transaction", legacyTransactionCount, "transactions");
    await assertEqualCount(
      transaction,
      "Settled Occurrence",
      expectedOccurrenceCount,
      "recurring_occurrences",
    );
    const migratedLineageCount = await countRows(
      transaction,
      "transactions",
      "recurring_rule_id IS NOT NULL",
    );
    if (migratedLineageCount !== legacyLineageCount) {
      throw new Error(
        `Recurring Rules migration lost lineage: expected ${legacyLineageCount}, received ${migratedLineageCount}.`,
      );
    }
    const foreignKeyFailures = await transaction.getAllAsync("PRAGMA foreign_key_check");
    if (foreignKeyFailures.length > 0) {
      throw new Error("Recurring Rules migration produced invalid foreign keys.");
    }
    await recordMigration(transaction);
  });
}

async function assertEqualCount(
  transaction: SQLiteDatabase,
  label: string,
  expected: number,
  table: string,
): Promise<void> {
  const actual = await countRows(transaction, table);
  if (actual !== expected) {
    throw new Error(
      `Recurring Rules migration changed ${label} count: expected ${expected}, received ${actual}.`,
    );
  }
}

async function countRows(
  transaction: SQLiteDatabase,
  table: string,
  predicate?: string,
): Promise<number> {
  const row = await transaction.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}${predicate ? ` WHERE ${predicate}` : ""}`,
  );
  return row?.count ?? 0;
}

async function tableExists(transaction: SQLiteDatabase, table: string): Promise<boolean> {
  const row = await transaction.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    table,
  );
  return row !== null;
}

async function columnExists(
  transaction: SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await transaction.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some(({ name }) => name === column);
}

function legacyReadiness(
  rule: LegacyRuleRow,
  cadence: LegacyCadence,
  accountsById: Map<string, AccountRow>,
): {
  amountMinor: number | null;
  accountId: string | null;
  toAccountId: string | null;
  health: "ready" | "needs_attention";
  reasons: AttentionReason[];
  attentionDetails: string | null;
} {
  const reasons: AttentionReason[] = [];
  const sourceAccount = accountsById.get(rule.accountId);
  const destinationAccount = rule.toAccountId ? accountsById.get(rule.toAccountId) : undefined;
  const amountMinor = Number.isSafeInteger(rule.amount) && rule.amount > 0 ? rule.amount : null;

  if (!sourceAccount) {
    reasons.push({ kind: "missing-source-account", formerAccountId: rule.accountId });
  } else if (sourceAccount.currency !== rule.currency) {
    reasons.push({
      kind: "account-currency-changed",
      accountId: rule.accountId,
      expected: rule.currency,
      actual: sourceAccount.currency,
    });
  }

  if (rule.type === "transfer" && !destinationAccount) {
    reasons.push({
      kind: "missing-destination-account",
      formerAccountId: rule.toAccountId,
    });
  }

  if (amountMinor === null) reasons.push({ kind: "invalid-legacy-amount" });
  if (!cadence.canReconstruct) reasons.push({ kind: "invalid-legacy-cadence" });

  const attentionDetails = {
    ...(amountMinor === null ? { legacyAmount: rule.amount } : {}),
    ...(!cadence.canReconstruct
      ? {
          legacyCadence: {
            frequency: rule.frequency,
            intervalCount: rule.intervalCount,
            lastGeneratedDate: rule.lastGeneratedDate,
          },
        }
      : {}),
  };

  return {
    amountMinor,
    accountId: sourceAccount ? rule.accountId : null,
    toAccountId: destinationAccount ? rule.toAccountId : null,
    health: reasons.length === 0 ? "ready" : "needs_attention",
    reasons,
    attentionDetails: reasons.length === 0 ? null : JSON.stringify(attentionDetails),
  };
}

function legacyLifecycle(
  rule: LegacyRuleRow,
  frequency: RecurringRuleFrequency,
  settledCount: number,
): "active" | "paused" | "completed" {
  const countLimit = rule.endCount;
  const dateLimit = rule.endDate
    ? scheduledDatesThrough(
        {
          startDate: rule.startDate,
          frequency,
          intervalCount: rule.intervalCount,
          endDate: rule.endDate,
          endCount: null,
        },
        rule.endDate,
      ).length
    : null;
  const terminalCount = [countLimit, dateLimit]
    .filter((count): count is number => count !== null)
    .reduce<number | null>(
      (minimum, count) => (minimum === null ? count : Math.min(minimum, count)),
      null,
    );

  if (terminalCount !== null && settledCount >= terminalCount) return "completed";
  return rule.isActive ? "active" : "paused";
}

function matchingTransactionsByDate(
  transactions: LegacyTransactionRow[],
  ruleId: string,
): Map<string, LegacyTransactionRow[]> {
  const matches = transactions
    .filter((transaction) => transaction.ruleId === ruleId)
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    );
  const byDate = new Map<string, LegacyTransactionRow[]>();

  for (const transaction of matches) {
    const dateMatches = byDate.get(transaction.date) ?? [];
    dateMatches.push(transaction);
    byDate.set(transaction.date, dateMatches);
  }

  return byDate;
}

function legacyCadence(rule: LegacyRuleRow): LegacyCadence {
  const frequency = isFrequency(rule.frequency) ? rule.frequency : "month";
  const intervalCount =
    Number.isSafeInteger(rule.intervalCount) && rule.intervalCount > 0 ? rule.intervalCount : 1;

  return {
    frequency,
    intervalCount,
    canReconstruct: isFrequency(rule.frequency) && intervalCount === rule.intervalCount,
  };
}

function isFrequency(value: string): value is RecurringRuleFrequency {
  return value === "day" || value === "week" || value === "month" || value === "year";
}

function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
  } catch {
    throw new Error(`Cannot migrate Recurring Rules with invalid time zone: ${timeZone}`);
  }
}

async function recordMigration(transaction: SQLiteDatabase): Promise<void> {
  await transaction.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    MIGRATION_KEY,
    String(MIGRATION_VERSION),
  );
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

const LEGACY_RULES_QUERY = `
  SELECT
    id,
    name,
    type,
    amount,
    currency,
    account_id AS accountId,
    to_account_id AS toAccountId,
    category_id AS categoryId,
    description,
    frequency,
    interval_count AS intervalCount,
    start_date AS startDate,
    end_date AS endDate,
    end_count AS endCount,
    last_generated_date AS lastGeneratedDate,
    is_active AS isActive,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM recurring_payments
  ORDER BY id
`;

const LEGACY_TRANSACTIONS_QUERY = `
  SELECT
    id,
    recurring_payment_id AS ruleId,
    date,
    created_at AS createdAt
  FROM transactions
  WHERE recurring_payment_id IS NOT NULL
  ORDER BY recurring_payment_id, date, created_at, id
`;

const CREATE_RECURRING_RULES_SQL = `
  CREATE TABLE recurring_rules (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount_minor INTEGER,
    currency TEXT NOT NULL,
    account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
    to_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    frequency TEXT NOT NULL CHECK (frequency IN ('day', 'week', 'month', 'year')),
    interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0),
    start_date TEXT NOT NULL,
    end_date TEXT,
    end_count INTEGER CHECK (end_count IS NULL OR end_count > 0),
    time_zone TEXT NOT NULL,
    lifecycle TEXT NOT NULL DEFAULT 'active'
      CHECK (lifecycle IN ('active', 'paused', 'archived', 'completed')),
    health TEXT NOT NULL DEFAULT 'ready'
      CHECK (health IN ('ready', 'needs_attention')),
    attention_reasons TEXT NOT NULL DEFAULT '[]',
    attention_details TEXT,
    eligibility_floor TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
    lifecycle_changed_at TEXT,
    health_changed_at TEXT,
    last_settlement_attempt_at TEXT,
    last_settlement_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (health = 'needs_attention' OR amount_minor IS NOT NULL),
    CHECK (health = 'needs_attention' OR account_id IS NOT NULL)
  )
`;

const INSERT_RULE_SQL = `
  INSERT INTO recurring_rules (
    id, name, type, amount_minor, currency, account_id, to_account_id,
    category_id, description, frequency, interval_count, start_date,
    end_date, end_count, time_zone, lifecycle, health,
    attention_reasons, attention_details, eligibility_floor, revision,
    lifecycle_changed_at, health_changed_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
`;

const REBUILD_TRANSACTIONS_SQL = `
  ALTER TABLE transactions RENAME TO transactions_legacy;

  CREATE TABLE transactions (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    original_amount INTEGER,
    original_currency TEXT,
    exchange_rate INTEGER,
    date TEXT NOT NULL,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_rule_id TEXT REFERENCES recurring_rules(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  INSERT INTO transactions (
    id, type, amount, currency, original_amount, original_currency,
    exchange_rate, date, account_id, to_account_id, category_id,
    is_recurring, recurring_rule_id, description, created_at, updated_at
  )
  SELECT
    id, type, amount, currency, original_amount, original_currency,
    exchange_rate, date, account_id, to_account_id, category_id,
    is_recurring, recurring_payment_id, description, created_at, updated_at
  FROM transactions_legacy;

  DROP TABLE transactions_legacy;
  CREATE INDEX idx_transactions_recurring_rule_id ON transactions(recurring_rule_id);
`;

const CREATE_OCCURRENCES_SQL = `
  CREATE TABLE recurring_occurrences (
    rule_id TEXT NOT NULL REFERENCES recurring_rules(id) ON DELETE RESTRICT,
    scheduled_date TEXT NOT NULL,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    settled_at TEXT NOT NULL,
    PRIMARY KEY (rule_id, scheduled_date)
  );
  CREATE UNIQUE INDEX uq_recurring_occurrence_transaction
    ON recurring_occurrences(transaction_id)
    WHERE transaction_id IS NOT NULL;
`;
