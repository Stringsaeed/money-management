import type { SQLiteDatabase } from "expo-sqlite";

import { endAccountFundingMembership } from "@/modules/accounts/account-funding-membership";
import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { getProjection } from "./projection";
import { isEligibleFundingAccountType } from "./funding-account-eligibility";
import type { BudgetProjection, UpdateFundingMembershipRequest } from "./types";
import { periodForLocalDate } from "./validation";

interface AccountRow {
  currency: string;
  lifecycle: "active" | "archived";
  type: string;
}

export async function updateFundingMembership(
  database: SQLiteDatabase,
  request: UpdateFundingMembershipRequest,
): Promise<BudgetProjection> {
  const period = periodForLocalDate(request.localDate);
  const account = await database.getFirstAsync<AccountRow>(
    "SELECT currency, lifecycle, type FROM accounts WHERE id = ?",
    request.accountId,
  );
  if (!account) throw new Error(`Account ${request.accountId} does not exist.`);
  if (request.included && account.lifecycle !== "active") {
    throw new Error(`Archived Account ${request.accountId} cannot join a Funding Pool.`);
  }
  if (request.included && !isEligibleFundingAccountType(account.type)) {
    throw new Error(`Account ${request.accountId} is not eligible for Funding Membership.`);
  }

  return runInTransaction(database, async (transaction) => {
    const workspace = await transaction.getFirstAsync<{ currency: string }>(
      "SELECT currency FROM budget_workspaces WHERE currency = ?",
      account.currency,
    );
    if (!workspace) {
      throw new Error(
        `Activate the ${account.currency} budget workspace before changing Funding Membership.`,
      );
    }

    await endAccountFundingMembership(transaction, request.accountId, period);
    if (request.included) {
      await transaction.runAsync(
        `INSERT INTO funding_memberships (
          account_id, currency, effective_from_period, effective_to_period, created_at
        ) VALUES (?, ?, ?, NULL, ?)`,
        request.accountId,
        account.currency,
        period,
        request.now,
      );
    }

    const projection = await getProjection(transaction, { currency: account.currency, period });
    if (!projection) {
      throw new Error(`The ${account.currency} Funding Pool is unavailable for ${period}.`);
    }
    return projection;
  });
}
