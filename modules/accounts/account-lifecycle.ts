import { format, isMatch, isValid, parseISO, subMonths } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import type { RecurringAttentionReason } from "@/modules/recurring-rules";
import { runInTransaction } from "@/modules/recurring-rules/persistence";

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

export type AccountArchiveBlocker =
  | {
      kind: "non-zero-balance";
      balanceMinor: number;
      recoveryAction: "Record transactions or transfers until this Account balance is zero.";
    }
  | {
      kind: "active-recurring-rules";
      rules: AccountRuleBlocker[];
      recoveryAction: "Pause, archive, or repair every listed Recurring Rule.";
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
): Promise<AccountArchivalPreview> {
  const account = await requireAccount(database, accountId);
  const blockers: AccountArchiveBlocker[] = [];
  const balanceMinor = await accountBalance(database, accountId, account.initialBalance);
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
      recoveryAction: "Pause, archive, or repair every listed Recurring Rule.",
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
    const preview = await previewAccountArchival(transaction, request.accountId);
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
  }>(
    `SELECT
      (SELECT COUNT(*) FROM transactions
       WHERE account_id = ? OR to_account_id = ?) AS transactionCount,
      (SELECT COUNT(*) FROM recurring_rules
       WHERE account_id = ? OR to_account_id = ?) AS recurringRuleCount,
      (SELECT COUNT(*) FROM funding_memberships
       WHERE account_id = ?) AS fundingMembershipCount`,
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

export async function deleteAccount(database: SQLiteDatabase, accountId: string): Promise<void> {
  await runInTransaction(database, async (transaction) => {
    const preview = await previewAccountDeletion(transaction, accountId);
    if (!preview.canDelete) throw new AccountHasHistoryError(preview);
    await transaction.runAsync("DELETE FROM accounts WHERE id = ?", accountId);
  });
}

async function accountBalance(
  database: SQLiteDatabase,
  accountId: string,
  initialBalance: number,
): Promise<number> {
  const result = await database.getFirstAsync<{ activity: number }>(
    `SELECT COALESCE(SUM(
       CASE
         WHEN type = 'income' AND account_id = ? THEN amount
         WHEN type = 'expense' AND account_id = ? THEN -amount
         WHEN type = 'transfer' AND account_id = ? THEN -amount
         WHEN type = 'transfer' AND to_account_id = ? THEN amount
         ELSE 0
       END
     ), 0) AS activity
     FROM transactions
     WHERE account_id = ? OR to_account_id = ?`,
    accountId,
    accountId,
    accountId,
    accountId,
    accountId,
    accountId,
  );
  return initialBalance + (result?.activity ?? 0);
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

async function markInactiveRulesForArchivedAccount(
  database: SQLiteDatabase,
  accountId: string,
  now: string,
): Promise<void> {
  const rules = await database.getAllAsync<{
    id: string;
    accountId: string | null;
    toAccountId: string | null;
    health: "ready" | "needs_attention";
    attentionReasons: string;
  }>(
    `SELECT id, account_id AS accountId, to_account_id AS toAccountId, health,
            attention_reasons AS attentionReasons
     FROM recurring_rules
     WHERE lifecycle <> 'active' AND (account_id = ? OR to_account_id = ?)
     ORDER BY id`,
    accountId,
    accountId,
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
