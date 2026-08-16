import type { SQLiteDatabase } from "expo-sqlite";

import type { Account } from "@/types";

import {
  archiveAndDetachAccountRules,
  findAccountRuleImpacts,
  markAccountCurrencyChange,
  type AccountRuleImpact,
} from "./recurring-rules/account-impact";
import { runInTransaction } from "./recurring-rules/persistence";

export interface AccountDeletionPreview {
  accountId: string;
  rules: AccountRuleImpact[];
}

type AccountChanges = Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>;
type BindValue = string | number | boolean | null;

export function previewAccountDeletion(
  database: SQLiteDatabase,
  accountId: string,
): Promise<AccountDeletionPreview> {
  return findAccountRuleImpacts(database, accountId).then((rules) => ({ accountId, rules }));
}

export function deleteAccountWithRecurringRules(
  database: SQLiteDatabase,
  request: { accountId: string; now: string },
): Promise<AccountDeletionPreview> {
  return runInTransaction(database, async (transaction) => {
    await requireAccount(transaction, request.accountId);
    const rules = await archiveAndDetachAccountRules(transaction, request.accountId, request.now);
    await transaction.runAsync("DELETE FROM accounts WHERE id = ?", request.accountId);
    return { accountId: request.accountId, rules };
  });
}

export function updateAccountWithRecurringRules(
  database: SQLiteDatabase,
  request: { accountId: string; changes: AccountChanges; now: string },
): Promise<{ accountId: string; rulesNeedingAttention: AccountRuleImpact[] }> {
  return runInTransaction(database, async (transaction) => {
    const account = await requireAccount(transaction, request.accountId);
    await updateAccount(transaction, request.accountId, request.changes, request.now);
    const rulesNeedingAttention =
      request.changes.currency && request.changes.currency !== account.currency
        ? await markAccountCurrencyChange(
            transaction,
            request.accountId,
            request.changes.currency,
            request.now,
          )
        : [];
    return { accountId: request.accountId, rulesNeedingAttention };
  });
}

async function requireAccount(
  database: SQLiteDatabase,
  accountId: string,
): Promise<{ id: string; currency: string }> {
  const account = await database.getFirstAsync<{ id: string; currency: string }>(
    "SELECT id, currency FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account) throw new Error(`Account ${accountId} does not exist.`);
  return account;
}

async function updateAccount(
  database: SQLiteDatabase,
  accountId: string,
  changes: AccountChanges,
  now: string,
): Promise<void> {
  const columns: [keyof AccountChanges, string][] = [
    ["name", "name"],
    ["type", "type"],
    ["currency", "currency"],
    ["color", "color"],
    ["icon", "icon"],
    ["initialBalance", "initial_balance"],
    ["excludeFromTotal", "exclude_from_total"],
    ["sortOrder", "sort_order"],
  ];
  const assignments: string[] = [];
  const values: BindValue[] = [];
  for (const [property, column] of columns) {
    if (changes[property] === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(changes[property] as BindValue);
  }
  assignments.push("updated_at = ?");
  values.push(now, accountId);
  await database.runAsync(`UPDATE accounts SET ${assignments.join(", ")} WHERE id = ?`, ...values);
}
