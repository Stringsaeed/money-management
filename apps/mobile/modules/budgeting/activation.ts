import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { getProjection } from "./projection";
import type { ActivateWorkspaceRequest, BudgetProjection } from "./types";
import {
  periodForLocalDate,
  requireCurrency,
  requireDistinctAccountIds,
  requireMinorUnits,
} from "./validation";

interface AccountRow {
  id: string;
  type: string;
  currency: string;
  initialBalance: number;
}

const ELIGIBLE_FUNDING_ACCOUNT_TYPES = new Set(["checking", "savings", "cash", "other"]);

export async function activateWorkspace(
  database: SQLiteDatabase,
  request: ActivateWorkspaceRequest,
): Promise<BudgetProjection> {
  const currency = requireCurrency(request.currency);
  const period = periodForLocalDate(request.localDate);
  const accountIds = requireDistinctAccountIds(request.fundingAccountIds);

  return runInTransaction(database, async (transaction) => {
    await requireEligibleAccounts(transaction, accountIds, currency);
    const existingWorkspace = await transaction.getFirstAsync<{ activationPeriod: string }>(
      `SELECT activation_period AS activationPeriod
       FROM budget_workspaces
       WHERE currency = ?`,
      currency,
    );
    if (existingWorkspace) {
      await requireSameActivation(
        transaction,
        currency,
        period,
        accountIds,
        existingWorkspace.activationPeriod,
      );
      const existingProjection = await getProjection(transaction, { currency, period });
      if (!existingProjection) throw new Error(`Budget activation for ${currency} is incomplete.`);
      return existingProjection;
    }

    await persistActivation(transaction, request, currency, period, accountIds);
    const projection = await getProjection(transaction, { currency, period });
    if (!projection) throw new Error(`Budget activation for ${currency} did not persist.`);
    return projection;
  });
}

async function persistActivation(
  database: SQLiteDatabase,
  request: ActivateWorkspaceRequest,
  currency: string,
  period: string,
  accountIds: readonly string[],
): Promise<void> {
  await database.runAsync(
    `INSERT INTO budget_workspaces (
      currency, activation_period, created_at, updated_at
    ) VALUES (?, ?, ?, ?)`,
    currency,
    period,
    request.now,
    request.now,
  );
  for (const accountId of accountIds) {
    await database.runAsync(
      `INSERT INTO funding_memberships (
        account_id, currency, effective_from_period, effective_to_period, created_at
      ) VALUES (?, ?, ?, NULL, ?)`,
      accountId,
      currency,
      period,
      request.now,
    );
  }
}

async function requireSameActivation(
  database: SQLiteDatabase,
  currency: string,
  period: string,
  requestedAccountIds: readonly string[],
  activationPeriod: string,
): Promise<void> {
  const memberships = await database.getAllAsync<{ accountId: string }>(
    `SELECT account_id AS accountId
     FROM funding_memberships
     WHERE currency = ?
       AND effective_from_period = ?
       AND effective_to_period IS NULL
     ORDER BY account_id`,
    currency,
    period,
  );
  const persistedAccountIds = memberships.map(({ accountId }) => accountId);
  const sortedRequestedIds = [...requestedAccountIds].sort();
  if (
    activationPeriod !== period ||
    persistedAccountIds.length !== sortedRequestedIds.length ||
    persistedAccountIds.some((accountId, index) => accountId !== sortedRequestedIds[index])
  ) {
    throw new Error(
      `${currency} budgeting is already active with a different Funding Membership plan.`,
    );
  }
}

async function requireEligibleAccounts(
  database: SQLiteDatabase,
  accountIds: readonly string[],
  currency: string,
): Promise<void> {
  const placeholders = accountIds.map(() => "?").join(", ");
  const accounts = await database.getAllAsync<AccountRow>(
    `SELECT id, type, currency, initial_balance AS initialBalance
     FROM accounts
     WHERE id IN (${placeholders})
     ORDER BY id`,
    ...accountIds,
  );
  if (accounts.length !== accountIds.length) {
    throw new Error("Budget activation requires every selected Funding Account to exist.");
  }
  for (const account of accounts) {
    if (!ELIGIBLE_FUNDING_ACCOUNT_TYPES.has(account.type)) {
      throw new Error(`Account ${account.id} is not eligible for Funding Membership.`);
    }
    if (account.currency !== currency) {
      throw new Error(
        `Cannot activate ${currency} with Account ${account.id} in ${account.currency}.`,
      );
    }
    requireMinorUnits(account.initialBalance, currency);
  }
}
