import { format, parseISO, subMonths } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import { type AccountDependencyFacts, loadAccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import type { UnfundedCardEntry } from "./card-dependency-types";
import { isUnsupportedCrossCurrencyTransfer } from "./card-dependency-validation";
import type { AccountBudgetDependency, AccountDependencyOptions } from "./types";
import { addMoney } from "./validation";

const SHORTFALL_RECOVERY =
  "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.";
const CASH_OVERSPENDING_RECOVERY =
  "Assign or move Money to cover every cash Envelope with negative availability.";
const RESERVE_RECOVERY =
  "Make a same-currency Card Payment from a Funding Account until this reserve is zero.";
const UNFUNDED_RECOVERY =
  "Assign Money to cover this card spending, or pay it from a same-currency Funding Account.";
const CROSS_CURRENCY_RECOVERY =
  "Correct this Transfer to use same-currency Accounts, or remove it before archiving.";

export async function getAccountBudgetDependencies(
  database: SQLiteDatabase,
  accountId: string,
  period: string,
  options: AccountDependencyOptions = {},
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
  const evaluationFacts = options.endingMembership
    ? endMembershipForEvaluation(facts, accountId, period)
    : facts;
  for (const transaction of facts.transactions) {
    if (
      isUnsupportedCrossCurrencyTransfer(transaction) &&
      (transaction.accountId === accountId || transaction.toAccountId === accountId)
    ) {
      dependencies.push({
        kind: "unsupported-cross-currency-transfer",
        amountMinor: transaction.amountMinor,
        currency: transaction.sourceCurrency,
        destinationCurrency: transaction.destinationCurrency,
        recoveryAction: CROSS_CURRENCY_RECOVERY,
        transactionId: transaction.id,
      });
    }
  }
  const budgetState = evaluateCardBudgetState(evaluationFacts, period);
  const unreservedCardPaymentMinor = budgetState.unreservedPaymentByAccount.get(accountId) ?? 0;
  if (membership || unreservedCardPaymentMinor > 0) {
    const { cashOverspendingMinor, unassignedMinor } = calculateBudgetHealth(
      evaluationFacts,
      budgetState,
      period,
      account.currency,
    );
    if (unassignedMinor < 0) {
      dependencies.push({
        kind: "budget-shortfall",
        currency: account.currency,
        amountMinor: membership
          ? Math.abs(unassignedMinor)
          : Math.min(Math.abs(unassignedMinor), unreservedCardPaymentMinor),
        recoveryAction: SHORTFALL_RECOVERY,
      });
    }
    if (cashOverspendingMinor > 0) {
      dependencies.push({
        kind: "cash-envelope-overspending",
        currency: account.currency,
        amountMinor: cashOverspendingMinor,
        recoveryAction: CASH_OVERSPENDING_RECOVERY,
      });
    }
  }
  if (account.type !== "credit_card") return dependencies;
  const reserveMinor = budgetState.reserveByAccount.get(accountId) ?? 0;
  const unfundedMinor = sumUnfundedCardSpending(budgetState.unfunded, accountId, account.currency);
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

export function sumUnfundedCardSpending(
  entries: readonly UnfundedCardEntry[],
  accountId: string,
  currency: string,
): number {
  return entries
    .filter((entry) => entry.accountId === accountId)
    .reduce((total, entry) => addMoney(total, entry.remainingMinor, currency), 0);
}

function endMembershipForEvaluation(
  facts: AccountDependencyFacts,
  accountId: string,
  period: string,
): AccountDependencyFacts {
  const priorPeriod = format(subMonths(parseISO(`${period}-01`), 1), "yyyy-MM");
  return {
    ...facts,
    memberships: facts.memberships.flatMap((membership) => {
      if (membership.accountId !== accountId) return [membership];
      if (membership.effectiveFromPeriod >= period) return [];
      if (membership.effectiveToPeriod !== null && membership.effectiveToPeriod < period) {
        return [membership];
      }
      return [{ ...membership, effectiveToPeriod: priorPeriod }];
    }),
  };
}

function calculateBudgetHealth(
  facts: NonNullable<Awaited<ReturnType<typeof loadAccountDependencyFacts>>>,
  state: ReturnType<typeof evaluateCardBudgetState>,
  period: string,
  currency: string,
): { cashOverspendingMinor: number; unassignedMinor: number } {
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
    fundingPoolMinor = addMoney(fundingPoolMinor, state.balances.get(accountId) ?? 0, currency);
  }
  for (const account of facts.accounts) {
    if (account.type === "credit_card") {
      fundingPoolMinor = addMoney(
        fundingPoolMinor,
        Math.max(state.balances.get(account.id) ?? 0, 0),
        currency,
      );
    }
  }
  const signedAvailabilityMinor = [...state.availability.values()].reduce(
    (total, amountMinor) => addMoney(total, amountMinor, currency),
    0,
  );
  const cashOverspendingMinor = [...state.availability.values()].reduce(
    (total, amountMinor) => addMoney(total, Math.max(-amountMinor, 0), currency),
    0,
  );
  const reserveMinor = [...state.reserveByAccount.values()].reduce(
    (total, amountMinor) => addMoney(total, Math.max(amountMinor, 0), currency),
    0,
  );
  const futureReservationMinor = facts.assignments
    .filter((assignment) => assignment.period > period)
    .reduce((total, assignment) => {
      if (assignment.destinationEnvelopeId && !assignment.sourceEnvelopeId) {
        return addMoney(total, assignment.amountMinor, currency);
      }
      if (assignment.sourceEnvelopeId && !assignment.destinationEnvelopeId) {
        return addMoney(total, -assignment.amountMinor, currency);
      }
      return total;
    }, 0);
  return {
    cashOverspendingMinor,
    unassignedMinor: [signedAvailabilityMinor, reserveMinor, futureReservationMinor].reduce(
      (total, amountMinor) => addMoney(total, -amountMinor, currency),
      fundingPoolMinor,
    ),
  };
}
