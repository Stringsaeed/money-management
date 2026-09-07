import type { SQLiteDatabase } from "@/db/sqlite";

import type {
  RecurringAttentionReason,
  RecurringRule,
  RecurringRuleDraft,
  RecurringRuleHealth,
  RecurringRuleLifecycle,
} from "./types";

interface RuleRow {
  id: string;
  name: string;
  type: RecurringRule["type"];
  amountMinor: number | null;
  currency: string;
  accountId: string | null;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  frequency: RecurringRule["frequency"];
  intervalCount: number;
  startDate: string;
  endDate: string | null;
  endCount: number | null;
  timeZone: string;
  lifecycle: RecurringRuleLifecycle;
  health: RecurringRuleHealth;
  attentionReasons: string;
  attentionDetails: string | null;
  eligibilityFloor: string;
  revision: number;
  lifecycleChangedAt: string | null;
  healthChangedAt: string | null;
  lastSettlementAttemptAt: string | null;
  lastSettlementError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDependency {
  id: string;
  currency: string;
}

export async function loadRule(
  database: SQLiteDatabase,
  ruleId: string,
): Promise<RecurringRule | null> {
  const row = await database.getFirstAsync<RuleRow>(`${RULE_SELECT} WHERE id = ?`, ruleId);
  return row ? mapRule(row) : null;
}

export async function listRules(database: SQLiteDatabase): Promise<RecurringRule[]> {
  const rows = await database.getAllAsync<RuleRow>(`${RULE_SELECT} ORDER BY name, id`);
  return rows.map(mapRule);
}

export async function insertRule(
  database: SQLiteDatabase,
  ruleId: string,
  draft: RecurringRuleDraft,
  now: string,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO recurring_rules (
      id, name, type, amount_minor, currency, account_id, to_account_id,
      category_id, description, frequency, interval_count, start_date,
      end_date, end_count, time_zone, lifecycle, health, attention_reasons,
      eligibility_floor, revision, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'ready', '[]', ?, 1, ?, ?)`,
    ruleId,
    draft.name,
    draft.type,
    draft.amountMinor,
    draft.currency,
    draft.accountId,
    draft.toAccountId,
    draft.categoryId,
    draft.description,
    draft.frequency,
    draft.intervalCount,
    draft.startDate,
    draft.endDate,
    draft.endCount,
    draft.timeZone,
    draft.startDate,
    now,
    now,
  );
}

export async function updateRuleDraft(
  database: SQLiteDatabase,
  ruleId: string,
  draft: RecurringRuleDraft,
  state: {
    lifecycle: RecurringRuleLifecycle;
    health: RecurringRuleHealth;
    attentionReasons: RecurringAttentionReason[];
    eligibilityFloor: string;
    revision: number;
    now: string;
    lifecycleChangedAt: string | null;
    healthChangedAt: string | null;
  },
): Promise<void> {
  await database.runAsync(
    `UPDATE recurring_rules SET
      name = ?, type = ?, amount_minor = ?, currency = ?, account_id = ?,
      to_account_id = ?, category_id = ?, description = ?, frequency = ?,
      interval_count = ?, start_date = ?, end_date = ?, end_count = ?,
      time_zone = ?, lifecycle = ?, health = ?, attention_reasons = ?,
      attention_details = NULL, eligibility_floor = ?, revision = ?,
      lifecycle_changed_at = ?, health_changed_at = ?, updated_at = ?
     WHERE id = ?`,
    draft.name,
    draft.type,
    draft.amountMinor,
    draft.currency,
    draft.accountId,
    draft.toAccountId,
    draft.categoryId,
    draft.description,
    draft.frequency,
    draft.intervalCount,
    draft.startDate,
    draft.endDate,
    draft.endCount,
    draft.timeZone,
    state.lifecycle,
    state.health,
    JSON.stringify(state.attentionReasons),
    state.eligibilityFloor,
    state.revision,
    state.lifecycleChangedAt,
    state.healthChangedAt,
    state.now,
    ruleId,
  );
}

export async function updateRuleLifecycle(
  database: SQLiteDatabase,
  ruleId: string,
  lifecycle: RecurringRuleLifecycle,
  eligibilityFloor: string,
  revision: number,
  now: string,
): Promise<void> {
  await database.runAsync(
    `UPDATE recurring_rules
     SET lifecycle = ?, eligibility_floor = ?, revision = ?,
         lifecycle_changed_at = ?, updated_at = ?
     WHERE id = ?`,
    lifecycle,
    eligibilityFloor,
    revision,
    now,
    now,
    ruleId,
  );
}

export async function loadAccount(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountDependency | null> {
  return database.getFirstAsync<AccountDependency>(
    "SELECT id, currency FROM accounts WHERE id = ? AND lifecycle = 'active'",
    accountId,
  );
}

export async function settledDates(database: SQLiteDatabase, ruleId: string): Promise<string[]> {
  const rows = await database.getAllAsync<{ scheduledDate: string }>(
    `SELECT scheduled_date AS scheduledDate
     FROM recurring_occurrences
     WHERE rule_id = ?
     ORDER BY scheduled_date`,
    ruleId,
  );
  return rows.map(({ scheduledDate }) => scheduledDate);
}

export async function runInTransaction<T>(
  database: SQLiteDatabase,
  task: (transaction: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  let result: T | undefined;
  if (process.env.EXPO_OS === "web") {
    await database.withTransactionAsync(async () => {
      result = await task(database);
    });
  } else {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      result = await task(transaction);
    });
  }
  return result as T;
}

function mapRule(row: RuleRow): RecurringRule {
  return {
    ...row,
    attentionReasons: parseJson<RecurringAttentionReason[]>(row.attentionReasons, []),
    attentionDetails: row.attentionDetails
      ? parseJson<Record<string, unknown>>(row.attentionDetails, {})
      : null,
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const RULE_SELECT = `
  SELECT
    id,
    name,
    type,
    amount_minor AS amountMinor,
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
    time_zone AS timeZone,
    lifecycle,
    health,
    attention_reasons AS attentionReasons,
    attention_details AS attentionDetails,
    eligibility_floor AS eligibilityFloor,
    revision,
    lifecycle_changed_at AS lifecycleChangedAt,
    health_changed_at AS healthChangedAt,
    last_settlement_attempt_at AS lastSettlementAttemptAt,
    last_settlement_error AS lastSettlementError,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM recurring_rules
`;
