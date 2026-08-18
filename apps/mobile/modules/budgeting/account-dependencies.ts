import type { SQLiteDatabase } from "expo-sqlite";

import { loadAccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import { getProjection } from "./projection";
import type { AccountBudgetDependency } from "./types";

const SHORTFALL_RECOVERY =
  "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.";
const RESERVE_RECOVERY =
  "Make a same-currency Card Payment from a Funding Account until this reserve is zero.";
const UNFUNDED_RECOVERY =
  "Assign Money to cover this card spending, or pay it from a same-currency Funding Account.";

export async function getAccountBudgetDependencies(
  database: SQLiteDatabase,
  accountId: string,
  period: string,
): Promise<AccountBudgetDependency[]> {
  const account = await database.getFirstAsync<{ currency: string; type: string }>(
    "SELECT currency, type FROM accounts WHERE id = ?",
    accountId,
  );
  if (!account) return [];

  const dependencies: AccountBudgetDependency[] = [];
  const membership = await database.getFirstAsync<{ currency: string }>(
    `SELECT currency FROM funding_memberships
     WHERE account_id = ?
       AND effective_from_period <= ?
       AND (effective_to_period IS NULL OR effective_to_period >= ?)
     ORDER BY currency LIMIT 1`,
    accountId,
    period,
    period,
  );
  if (membership) {
    const projection = await getProjection(database, { currency: membership.currency, period });
    if (projection && projection.unassignedMoney.amountMinor < 0) {
      dependencies.push({
        kind: "budget-shortfall",
        currency: membership.currency,
        amountMinor: Math.abs(projection.unassignedMoney.amountMinor),
        recoveryAction: SHORTFALL_RECOVERY,
      });
    }
  }
  if (account.type !== "credit_card") return dependencies;

  const facts = await loadAccountDependencyFacts(database, account.currency, period);
  if (!facts) return dependencies;
  const cardState = evaluateCardBudgetState(facts, period);
  const reserveMinor = cardState.reserveByAccount.get(accountId) ?? 0;
  const unfundedMinor = cardState.unfunded
    .filter((entry) => entry.accountId === accountId)
    .reduce((total, entry) => total + entry.remainingMinor, 0);
  if (reserveMinor > 0) {
    dependencies.push({
      kind: "card-payment-reserve",
      currency: account.currency,
      amountMinor: reserveMinor,
      recoveryAction: RESERVE_RECOVERY,
    });
  }
  if (unfundedMinor > 0) {
    dependencies.push({
      kind: "unfunded-card-spending",
      currency: account.currency,
      amountMinor: unfundedMinor,
      recoveryAction: UNFUNDED_RECOVERY,
    });
  }
  return dependencies;
}
