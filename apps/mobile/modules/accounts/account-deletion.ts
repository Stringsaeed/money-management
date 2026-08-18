import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { AccountHasHistoryError, type AccountDeletionPreview } from "./account-lifecycle-types";

export async function previewAccountDeletion(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountDeletionPreview> {
  await requireAccount(database, accountId);
  const counts = await database.getFirstAsync<
    Omit<AccountDeletionPreview, "accountId" | "canDelete">
  >(
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

export async function deleteAccount(database: SQLiteDatabase, accountId: string): Promise<void> {
  await runInTransaction(database, async (transaction) => {
    const preview = await previewAccountDeletion(transaction, accountId);
    if (!preview.canDelete) throw new AccountHasHistoryError(preview);
    await transaction.runAsync("DELETE FROM accounts WHERE id = ?", accountId);
  });
}

async function requireAccount(database: SQLiteDatabase, accountId: string): Promise<void> {
  const account = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account) throw new Error(`Account ${accountId} does not exist.`);
}
