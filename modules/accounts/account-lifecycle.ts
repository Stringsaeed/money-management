import { format, isMatch, isValid, parseISO, subMonths } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import { getProjection } from "@/modules/budgeting/projection";
import { markInactiveRulesForArchivedAccount } from "@/modules/recurring-rules/account-impact";
import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { loadAccountBalance } from "./account-balance";

export interface AccountLifecycleRequest {
  accountId: string;
  localDate: string;
  now: string;
}

export interface AccountRuleBlocker {
  ruleId: string;
  name: string;
  relationship: "source" | "destination";
}

export interface AccountBudgetDependency {
  kind: "budget-shortfall";
  currency: string;
  amountMinor: number;
}

export type AccountArchiveBlocker =
  | {
      kind: "non-zero-balance";
      balanceMinor: number;
      recoveryAction: "Record transactions or transfers until this Account balance is zero.";
    }
  | {
      kind: "active-recurring-rules";
      rules: AccountRuleBlocker[];
      recoveryAction: "Pause or archive every listed Recurring Rule.";
    }
  | {
      kind: "budget-dependencies";
      dependencies: AccountBudgetDependency[];
      recoveryAction: "Resolve every listed budget dependency before archiving this Account.";
    };

export interface AccountArchivalPreview {
  accountId: string;
  blockers: AccountArchiveBlocker[];
  canArchive: boolean;
}

export interface AccountDeletionPreview {
  accountId: string;
  transactionCount: number;
  recurringRuleCount: number;
  fundingMembershipCount: number;
  budgetHistoryCount: number;
  canDelete: boolean;
}

export class AccountArchiveBlockedError extends Error {
  constructor(readonly preview: AccountArchivalPreview) {
    super(
      `Account ${preview.accountId} cannot be archived until every listed prerequisite is resolved.`,
    );
    this.name = "AccountArchiveBlockedError";
  }
}

export class AccountHasHistoryError extends Error {
  constructor(readonly preview: AccountDeletionPreview) {
    super(
      `Account ${preview.accountId} carries dependent history. Archive it to preserve its financial history.`,
    );
    this.name = "AccountHasHistoryError";
  }
}

export async function previewAccountArchival(
  database: SQLiteDatabase,
  accountId: string,
  localDate: string,
): Promise<AccountArchivalPreview> {
  const period = periodForLedgerDate(localDate);
  const account = await loadAccountBalance(database, accountId);
  if (!account) throw new Error(`Account ${accountId} does not exist.`);
  const blockers: AccountArchiveBlocker[] = [];
  const balanceMinor = account.balance;
  if (balanceMinor !== 0) {
    blockers.push({
      kind: "non-zero-balance",
      balanceMinor,
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

export async function archiveAccount(
  database: SQLiteDatabase,
  request: AccountLifecycleRequest,
): Promise<void> {
  const period = periodForLedgerDate(request.localDate);
  const priorPeriod = format(subMonths(parseISO(`${period}-01`), 1), "yyyy-MM");

  await runInTransaction(database, async (transaction) => {
    await requireAccountLifecycle(transaction, request.accountId, "active");
    const preview = await previewAccountArchival(transaction, request.accountId, request.localDate);
    if (!preview.canArchive) throw new AccountArchiveBlockedError(preview);

    await transaction.runAsync(
      `UPDATE accounts
       SET lifecycle = 'archived', lifecycle_changed_at = ?, updated_at = ?
       WHERE id = ?`,
      request.now,
      request.now,
      request.accountId,
    );
    await endFundingMembership(transaction, request.accountId, period, priorPeriod);
    await markInactiveRulesForArchivedAccount(transaction, request.accountId, request.now);
  });
}

export async function restoreAccount(
  database: SQLiteDatabase,
  request: Pick<AccountLifecycleRequest, "accountId" | "now">,
): Promise<void> {
  await runInTransaction(database, async (transaction) => {
    await requireAccountLifecycle(transaction, request.accountId, "archived");
    await transaction.runAsync(
      `UPDATE accounts
       SET lifecycle = 'active', lifecycle_changed_at = ?, updated_at = ?
       WHERE id = ?`,
      request.now,
      request.now,
      request.accountId,
    );
  });
}

export async function previewAccountDeletion(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountDeletionPreview> {
  await requireAccount(database, accountId);
  const counts = await database.getFirstAsync<{
    transactionCount: number;
    recurringRuleCount: number;
    fundingMembershipCount: number;
    budgetHistoryCount: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM transactions
       WHERE account_id = ? OR to_account_id = ?) AS transactionCount,
      (SELECT COUNT(*) FROM recurring_rules
       WHERE account_id = ? OR to_account_id = ?) AS recurringRuleCount,
      (SELECT COUNT(*) FROM funding_memberships
       WHERE account_id = ?) AS fundingMembershipCount,
      (SELECT COUNT(*) FROM account_budget_history
       WHERE account_id = ?) AS budgetHistoryCount`,
    accountId,
    accountId,
    accountId,
    accountId,
    accountId,
    accountId,
  );
  if (!counts) throw new Error(`Could not inspect Account ${accountId} dependencies.`);
  return {
    accountId,
    ...counts,
    canDelete: Object.values(counts).every((count) => count === 0),
  };
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

export async function deleteAccount(database: SQLiteDatabase, accountId: string): Promise<void> {
  await runInTransaction(database, async (transaction) => {
    const preview = await previewAccountDeletion(transaction, accountId);
    if (!preview.canDelete) throw new AccountHasHistoryError(preview);
    await transaction.runAsync("DELETE FROM accounts WHERE id = ?", accountId);
  });
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

async function endFundingMembership(
  database: SQLiteDatabase,
  accountId: string,
  period: string,
  priorPeriod: string,
): Promise<void> {
  await database.runAsync(
    `DELETE FROM funding_memberships
     WHERE account_id = ? AND effective_from_period >= ?`,
    accountId,
    period,
  );
  await database.runAsync(
    `UPDATE funding_memberships
     SET effective_to_period = ?
     WHERE account_id = ?
       AND effective_from_period < ?
       AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
    priorPeriod,
    accountId,
    period,
    period,
  );
}

async function requireAccount(
  database: SQLiteDatabase,
  accountId: string,
): Promise<{ id: string; initialBalance: number }> {
  const account = await database.getFirstAsync<{ id: string; initialBalance: number }>(
    "SELECT id, initial_balance AS initialBalance FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account) throw new Error(`Account ${accountId} does not exist.`);
  return account;
}

async function requireAccountLifecycle(
  database: SQLiteDatabase,
  accountId: string,
  expectedLifecycle: "active" | "archived",
): Promise<void> {
  const account = await database.getFirstAsync<{ lifecycle: string }>(
    "SELECT lifecycle FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account) throw new Error(`Account ${accountId} does not exist.`);
  if (account.lifecycle !== expectedLifecycle) {
    throw new Error(`Account ${accountId} must be ${expectedLifecycle} for this lifecycle change.`);
  }
}

function periodForLedgerDate(localDate: string): string {
  if (!isMatch(localDate, "yyyy-MM-dd") || !isValid(parseISO(localDate))) {
    throw new Error(`Account lifecycle requires a valid local Ledger Date, received ${localDate}.`);
  }
  return localDate.slice(0, 7);
}
