import type { SQLiteDatabase } from "expo-sqlite";

import { getProjection } from "@/modules/budgeting/projection";

import { loadAccountBalance } from "./account-balance";
import { accountLifecyclePeriod } from "./account-ledger-date";
import type {
  AccountArchivalPreview,
  AccountBudgetDependency,
  AccountRuleBlocker,
} from "./account-lifecycle-types";

export async function previewAccountArchival(
  database: SQLiteDatabase,
  accountId: string,
  localDate: string,
): Promise<AccountArchivalPreview> {
  const period = accountLifecyclePeriod(localDate);
  const account = await loadAccountBalance(database, accountId);
  if (!account) throw new Error(`Account ${accountId} does not exist.`);
  const blockers: AccountArchivalPreview["blockers"] = [];
  if (account.balance !== 0) {
    blockers.push({
      kind: "non-zero-balance",
      balanceMinor: account.balance,
      recoveryAction: "Record transactions or transfers until this Account balance is zero.",
    });
  }

  const rules = await activeRuleBlockers(database, accountId);
  if (rules.length > 0) {
    blockers.push({
      kind: "active-recurring-rules",
      rules,
      recoveryAction: "Pause or archive every listed Recurring Rule.",
    });
  }

  const budgetDependencies = await activeBudgetDependencies(database, accountId, period);
  if (budgetDependencies.length > 0) {
    blockers.push({
      kind: "budget-dependencies",
      dependencies: budgetDependencies,
      recoveryAction: "Resolve every listed budget dependency before archiving this Account.",
    });
  }

  return { accountId, blockers, canArchive: blockers.length === 0 };
}

async function activeRuleBlockers(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountRuleBlocker[]> {
  const rules = await database.getAllAsync<{
    id: string;
    name: string;
    accountId: string | null;
    toAccountId: string | null;
  }>(
    `SELECT id, name, account_id AS accountId, to_account_id AS toAccountId
     FROM recurring_rules
     WHERE lifecycle = 'active' AND (account_id = ? OR to_account_id = ?)
     ORDER BY name, id`,
    accountId,
    accountId,
  );
  return rules.flatMap((rule): AccountRuleBlocker[] => {
    const blockers: AccountRuleBlocker[] = [];
    if (rule.accountId === accountId) {
      blockers.push({ ruleId: rule.id, name: rule.name, relationship: "source" });
    }
    if (rule.toAccountId === accountId) {
      blockers.push({ ruleId: rule.id, name: rule.name, relationship: "destination" });
    }
    return blockers;
  });
}

async function activeBudgetDependencies(
  database: SQLiteDatabase,
  accountId: string,
  period: string,
): Promise<AccountBudgetDependency[]> {
  const memberships = await database.getAllAsync<{ currency: string }>(
    `SELECT DISTINCT currency
     FROM funding_memberships
     WHERE account_id = ?
       AND effective_from_period <= ?
       AND (effective_to_period IS NULL OR effective_to_period >= ?)
     ORDER BY currency`,
    accountId,
    period,
    period,
  );
  const dependencies: AccountBudgetDependency[] = [];
  for (const membership of memberships) {
    const projection = await getProjection(database, { currency: membership.currency, period });
    if (projection && projection.unassignedMoney.amountMinor < 0) {
      dependencies.push({
        kind: "budget-shortfall",
        currency: membership.currency,
        amountMinor: Math.abs(projection.unassignedMoney.amountMinor),
      });
    }
  }
  return dependencies;
}
