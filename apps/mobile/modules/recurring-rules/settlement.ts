import type { SQLiteDatabase } from "expo-sqlite";

import {
  dateAfter,
  nextScheduledDateOnOrAfter,
  scheduledDatesThrough,
} from "@trove/domain/calendar";
import { loadAccount, settledDates } from "./persistence";
import type {
  RecurringAttentionReason,
  RecurringEffect,
  RecurringPreview,
  RecurringRule,
  RecurringRulesIdentity,
  SettlementReport,
  SettlementRuleReport,
} from "./types";

export interface RuleSettlementResult extends SettlementRuleReport {
  lifecycle: RecurringRule["lifecycle"];
  revision: number;
}

export class RecurringSettlementError extends Error {
  constructor(
    readonly report: SettlementReport,
    readonly causes: { ruleId: string; cause: unknown }[],
  ) {
    super(
      `Recurring Settlement failed for ${causes.length} Rule${causes.length === 1 ? "" : "s"}.`,
    );
    this.name = "RecurringSettlementError";
  }
}

export async function previewRule(
  database: SQLiteDatabase,
  rule: RecurringRule,
  localDate: string,
): Promise<RecurringPreview | null> {
  const dates = await pendingDates(database, rule, localDate);
  if (dates.length === 0 || rule.amountMinor === null) return null;
  return {
    count: dates.length,
    totalMinor: dates.length * rule.amountMinor,
    currency: rule.currency,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
  };
}

export function previewUnpersistedRule(
  rule: RecurringRule,
  localDate: string,
): RecurringPreview | null {
  const dates = pendingDatesFrom(rule, localDate, []);
  if (dates.length === 0 || rule.amountMinor === null) return null;
  return {
    count: dates.length,
    totalMinor: dates.length * rule.amountMinor,
    currency: rule.currency,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
  };
}

export async function settleRule(
  database: SQLiteDatabase,
  rule: RecurringRule,
  localDate: string,
  now: string,
  identity: RecurringRulesIdentity,
  revisionMode: "increment" | "preserve",
): Promise<RuleSettlementResult> {
  if (rule.lifecycle !== "active") {
    return report(rule, "ineligible", 0, 0);
  }
  if (rule.health !== "ready" || rule.amountMinor === null || rule.accountId === null) {
    return report(rule, "needs_attention", 0, 0);
  }

  const dependencyReasons = await dependencyAttentionReasons(database, rule);
  if (dependencyReasons.length > 0) {
    await database.runAsync(
      `UPDATE recurring_rules
       SET health = 'needs_attention', attention_reasons = ?, health_changed_at = ?,
           last_settlement_attempt_at = ?, updated_at = ?, revision = revision + 1
       WHERE id = ?`,
      JSON.stringify(dependencyReasons),
      now,
      now,
      now,
      rule.id,
    );
    return {
      ...report(rule, "needs_attention", 0, 0),
      revision: rule.revision + 1,
    };
  }

  const dates = await pendingDates(database, rule, localDate);
  for (const scheduledDate of dates) {
    const transactionId = identity.next("transaction");
    await database.runAsync(
      `INSERT INTO transactions (
        id, type, amount, currency, original_amount, original_currency,
        exchange_rate, date, account_id, to_account_id, category_id,
        is_recurring, recurring_rule_id, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      transactionId,
      rule.type,
      rule.amountMinor,
      rule.currency,
      scheduledDate,
      rule.accountId,
      rule.toAccountId,
      rule.categoryId,
      rule.id,
      rule.description || rule.name,
      now,
      now,
    );
    await database.runAsync(
      `INSERT INTO recurring_occurrences (
        rule_id, scheduled_date, transaction_id, settled_at
      ) VALUES (?, ?, ?, ?)`,
      rule.id,
      scheduledDate,
      transactionId,
      now,
    );
  }

  const lifecycle = await lifecycleAfterSettlement(database, rule, localDate);
  const changed = dates.length > 0 || lifecycle !== rule.lifecycle;
  const revision = revisionMode === "increment" && changed ? rule.revision + 1 : rule.revision;
  await database.runAsync(
    `UPDATE recurring_rules
     SET lifecycle = ?, revision = ?, lifecycle_changed_at = ?,
         last_settlement_attempt_at = ?, last_settlement_error = NULL, updated_at = ?
     WHERE id = ?`,
    lifecycle,
    revision,
    lifecycle === rule.lifecycle ? rule.lifecycleChangedAt : now,
    now,
    now,
    rule.id,
  );

  return {
    ...report(
      rule,
      dates.length === 0 ? "not_due" : "settled",
      dates.length,
      dates.length * rule.amountMinor,
    ),
    lifecycle,
    revision,
  };
}

export async function dependencyAttentionReasons(
  database: SQLiteDatabase,
  rule: Pick<RecurringRule, "type" | "currency" | "accountId" | "toAccountId">,
): Promise<RecurringAttentionReason[]> {
  const reasons: RecurringAttentionReason[] = [];
  const sourceAccount = rule.accountId ? await loadAccount(database, rule.accountId) : null;
  if (!sourceAccount) {
    reasons.push({ kind: "missing-source-account", formerAccountId: rule.accountId });
  } else if (sourceAccount.currency !== rule.currency) {
    reasons.push({
      kind: "account-currency-changed",
      accountId: sourceAccount.id,
      expected: rule.currency,
      actual: sourceAccount.currency,
    });
  }

  if (rule.type === "transfer") {
    const destinationAccount = rule.toAccountId
      ? await loadAccount(database, rule.toAccountId)
      : null;
    if (!destinationAccount) {
      reasons.push({
        kind: "missing-destination-account",
        formerAccountId: rule.toAccountId,
      });
    } else if (destinationAccount.currency !== rule.currency) {
      reasons.push({
        kind: "account-currency-changed",
        accountId: destinationAccount.id,
        expected: rule.currency,
        actual: destinationAccount.currency,
      });
    }
  }

  return reasons;
}

export const settlementEffects = (generatedCount: number): RecurringEffect[] =>
  generatedCount > 0 ? ["rules", "upcoming", "ledger", "balances", "summaries"] : ["rules"];

async function pendingDates(
  database: SQLiteDatabase,
  rule: RecurringRule,
  localDate: string,
): Promise<string[]> {
  const existingDates = await settledDates(database, rule.id);
  return pendingDatesFrom(rule, localDate, existingDates);
}

function pendingDatesFrom(
  rule: RecurringRule,
  localDate: string,
  existingDates: string[],
): string[] {
  const existing = new Set(existingDates);
  const dates = scheduledDatesThrough(
    {
      startDate: rule.startDate,
      frequency: rule.frequency,
      intervalCount: rule.intervalCount,
      endDate: rule.endDate,
      endCount: null,
    },
    localDate,
  ).filter((date) => date >= rule.eligibilityFloor && !existing.has(date));

  if (rule.endCount === null) return dates;
  return dates.slice(0, Math.max(0, rule.endCount - existingDates.length));
}

async function lifecycleAfterSettlement(
  database: SQLiteDatabase,
  rule: RecurringRule,
  localDate: string,
): Promise<RecurringRule["lifecycle"]> {
  if (rule.endCount !== null) {
    const dates = await settledDates(database, rule.id);
    if (dates.length >= rule.endCount) return "completed";
  }
  if (rule.endDate) {
    const future = nextScheduledDateOnOrAfter(
      {
        startDate: rule.startDate,
        frequency: rule.frequency,
        intervalCount: rule.intervalCount,
        endDate: rule.endDate,
        endCount: null,
      },
      dateAfter(localDate),
    );
    if (future === null) return "completed";
  }
  return rule.lifecycle;
}

function report(
  rule: RecurringRule,
  kind: SettlementRuleReport["kind"],
  generatedCount: number,
  totalMinor: number,
): RuleSettlementResult {
  return {
    ruleId: rule.id,
    kind,
    generatedCount,
    totalMinor,
    lifecycle: rule.lifecycle,
    revision: rule.revision,
  };
}
