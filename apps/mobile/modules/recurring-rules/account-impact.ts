import type { SQLiteDatabase } from "@/db/sqlite";

import type { RecurringAttentionReason } from "./types";

export interface AccountRuleImpact {
  ruleId: string;
  name: string;
  relationship: "source" | "destination";
}

interface AffectedRuleRow {
  id: string;
  name: string;
  currency: string;
  accountId: string | null;
  toAccountId: string | null;
  lifecycle: "active" | "paused" | "archived" | "completed";
  health: "ready" | "needs_attention";
  attentionReasons: string;
}

export async function findAccountRuleImpacts(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountRuleImpact[]> {
  const rules = await affectedRules(database, accountId);
  return rules
    .flatMap((rule): AccountRuleImpact[] => {
      const impacts: AccountRuleImpact[] = [];
      if (rule.accountId === accountId) {
        impacts.push({ ruleId: rule.id, name: rule.name, relationship: "source" });
      }
      if (rule.toAccountId === accountId) {
        impacts.push({ ruleId: rule.id, name: rule.name, relationship: "destination" });
      }
      return impacts;
    })
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.relationship.localeCompare(right.relationship),
    );
}

export async function markAccountCurrencyChange(
  database: SQLiteDatabase,
  accountId: string,
  currency: string,
  now: string,
): Promise<AccountRuleImpact[]> {
  const rules = await affectedRules(database, accountId);
  const impacts = await findAccountRuleImpacts(database, accountId);

  for (const rule of rules) {
    const reasons = parseReasons(rule.attentionReasons).filter(
      (reason) =>
        !(
          reason.kind === "account-currency-changed" &&
          "accountId" in reason &&
          reason.accountId === accountId
        ),
    );
    addReason(reasons, {
      kind: "account-currency-changed",
      accountId,
      expected: rule.currency,
      actual: currency,
    });
    await database.runAsync(
      `UPDATE recurring_rules
       SET health = 'needs_attention', attention_reasons = ?, revision = revision + 1,
           health_changed_at = CASE WHEN health = 'needs_attention' THEN health_changed_at ELSE ? END,
           updated_at = ?
       WHERE id = ?`,
      JSON.stringify(reasons),
      now,
      now,
      rule.id,
    );
  }
  return impacts;
}

export async function markInactiveRulesForArchivedAccount(
  database: SQLiteDatabase,
  accountId: string,
  now: string,
): Promise<void> {
  const rules = (await affectedRules(database, accountId)).filter(
    (rule) => rule.lifecycle !== "active",
  );
  for (const rule of rules) {
    const reasons = parseReasons(rule.attentionReasons);
    if (rule.accountId === accountId) {
      addReason(reasons, { kind: "missing-source-account", formerAccountId: accountId });
    }
    if (rule.toAccountId === accountId) {
      addReason(reasons, { kind: "missing-destination-account", formerAccountId: accountId });
    }
    await database.runAsync(
      `UPDATE recurring_rules
       SET health = 'needs_attention', attention_reasons = ?, revision = revision + 1,
           health_changed_at = CASE WHEN health = 'needs_attention' THEN health_changed_at ELSE ? END,
           updated_at = ?
       WHERE id = ?`,
      JSON.stringify(reasons),
      now,
      now,
      rule.id,
    );
  }
}

async function affectedRules(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AffectedRuleRow[]> {
  return database.getAllAsync<AffectedRuleRow>(
    `SELECT
      id, name, currency, account_id AS accountId, to_account_id AS toAccountId,
      lifecycle, health, attention_reasons AS attentionReasons
     FROM recurring_rules
     WHERE account_id = ? OR to_account_id = ?
     ORDER BY name, id`,
    accountId,
    accountId,
  );
}

function parseReasons(value: string): RecurringAttentionReason[] {
  try {
    return JSON.parse(value) as RecurringAttentionReason[];
  } catch {
    return [];
  }
}

function addReason(reasons: RecurringAttentionReason[], reason: RecurringAttentionReason): void {
  if (!reasons.some((existing) => JSON.stringify(existing) === JSON.stringify(reason))) {
    reasons.push(reason);
  }
}
