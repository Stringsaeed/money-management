import type { SQLiteDatabase } from "expo-sqlite";

import { markInactiveRulesForArchivedAccount } from "@/modules/recurring-rules/account-impact";
import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { previewAccountArchival } from "./account-archive-preview";
import { endAccountFundingMembership } from "./account-funding-membership";
import { accountLifecyclePeriod } from "./account-ledger-date";
import {
  AccountArchiveBlockedError,
  type AccountLifecycleRequest,
} from "./account-lifecycle-types";

export { previewAccountArchival } from "./account-archive-preview";
export { deleteAccount, previewAccountDeletion } from "./account-deletion";
export {
  AccountArchiveBlockedError,
  AccountHasHistoryError,
  type AccountArchivalPreview,
  type AccountArchiveBlocker,
  type AccountBudgetDependency,
  type AccountDeletionPreview,
  type AccountRuleBlocker,
} from "./account-lifecycle-types";

export async function archiveAccount(
  database: SQLiteDatabase,
  request: AccountLifecycleRequest,
): Promise<void> {
  const period = accountLifecyclePeriod(request.localDate);
  await runInTransaction(database, async (transaction) => {
    await requireAccountLifecycle(transaction, request.accountId, "active");
    const preview = await previewAccountArchival(transaction, request.accountId, request.localDate);
    if (!preview.canArchive) throw new AccountArchiveBlockedError(preview);

    await endAccountFundingMembership(transaction, request.accountId, period);
    await markInactiveRulesForArchivedAccount(transaction, request.accountId, request.now);
    await transaction.runAsync(
      `UPDATE accounts
       SET lifecycle = 'archived', lifecycle_changed_at = ?, updated_at = ?
       WHERE id = ?`,
      request.now,
      request.now,
      request.accountId,
    );
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
