import type { SQLiteDatabase } from "expo-sqlite";

import { loadAccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
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
  const dependencies: AccountBudgetDependency[] = [];
  const facts = await loadAccountDependencyFacts(database, account.currency, period);
  if (!facts) return dependencies;
  const budgetState = evaluateCardBudgetState(facts, period);
  if (membership) {
    const unassignedMinor = calculateUnassignedMoney(facts, budgetState, period);
    if (unassignedMinor < 0) {
      dependencies.push({
        kind: "budget-shortfall",
        currency: membership.currency,
        amountMinor: Math.abs(unassignedMinor),
        recoveryAction: SHORTFALL_RECOVERY,
      });
    }
  }
  if (account.type !== "credit_card") return dependencies;
  const reserveMinor = budgetState.reserveByAccount.get(accountId) ?? 0;
  const unfundedMinor = budgetState.unfunded
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

function calculateUnassignedMoney(
  facts: NonNullable<Awaited<ReturnType<typeof loadAccountDependencyFacts>>>,
  state: ReturnType<typeof evaluateCardBudgetState>,
  period: string,
): number {
  const fundingAccountIds = new Set(
    facts.memberships
      .filter(
        (membership) =>
          membership.effectiveFromPeriod <= period &&
          (membership.effectiveToPeriod === null || membership.effectiveToPeriod >= period),
      )
      .map((membership) => membership.accountId),
  );
  let fundingPoolMinor = 0;
  for (const accountId of fundingAccountIds) {
    fundingPoolMinor += state.balances.get(accountId) ?? 0;
  }
  for (const account of facts.accounts) {
    if (account.type === "credit_card") {
      fundingPoolMinor += Math.max(state.balances.get(account.id) ?? 0, 0);
    }
  }
  const availableMinor = [...state.availability.values()].reduce(
    (total, amountMinor) => total + Math.max(amountMinor, 0),
    0,
  );
  const reserveMinor = [...state.reserveByAccount.values()].reduce(
    (total, amountMinor) => total + Math.max(amountMinor, 0),
    0,
  );
  const futureReservationMinor = facts.assignments
    .filter((assignment) => assignment.period > period)
    .reduce((total, assignment) => {
      if (assignment.destinationEnvelopeId && !assignment.sourceEnvelopeId) {
        return total + assignment.amountMinor;
      }
      if (assignment.sourceEnvelopeId && !assignment.destinationEnvelopeId) {
        return total - assignment.amountMinor;
      }
      return total;
    }, 0);
  return fundingPoolMinor - availableMinor - reserveMinor - futureReservationMinor;
}
