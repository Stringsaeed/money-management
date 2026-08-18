import { eachMonthOfInterval, format, parseISO } from "date-fns";

import type { AccountDependencyFacts } from "./account-dependency-read";
import { applyBudgetTransaction, applyLedgerBalance } from "./card-dependency-transactions";
import type { CardBudgetState, UnfundedCardEntry } from "./card-dependency-types";
import {
  addBudgetMoney,
  isUnsupportedCrossCurrencyTransfer,
  validateAccountDependencyFacts,
} from "./card-dependency-validation";

export function evaluateCardBudgetState(
  facts: AccountDependencyFacts,
  throughPeriod: string,
): CardBudgetState {
  validateAccountDependencyFacts(facts);
  const availability = new Map<string, number>();
  const balances = new Map(facts.accounts.map((account) => [account.id, account.initialBalance]));
  const accountTypes = new Map(facts.accounts.map((account) => [account.id, account.type]));
  const reserveByAccount = new Map<string, number>();
  const unreservedPaymentByAccount = new Map<string, number>();
  const unfunded: UnfundedCardEntry[] = [];
  const periods = eachMonthOfInterval({
    start: parseISO(`${facts.activationPeriod}-01`),
    end: parseISO(`${throughPeriod}-01`),
  }).map((date) => format(date, "yyyy-MM"));

  const supportedTransactions = facts.transactions.filter(
    (transaction) => !isUnsupportedCrossCurrencyTransfer(transaction),
  );

  for (const transaction of supportedTransactions.filter(
    (row) => row.date.slice(0, 7) < facts.activationPeriod,
  )) {
    applyLedgerBalance(transaction, balances);
  }

  for (const [index, period] of periods.entries()) {
    if (index > 0) applyRollover(availability, facts, period);
    for (const assignment of facts.assignments.filter((row) => row.period === period)) {
      if (assignment.sourceEnvelopeId) {
        addBudgetMoney(availability, assignment.sourceEnvelopeId, -assignment.amountMinor);
      }
      if (assignment.destinationEnvelopeId) {
        const availableMinor = availability.get(assignment.destinationEnvelopeId) ?? 0;
        const cashOverspendingMinor = Math.min(
          Math.max(-availableMinor, 0),
          assignment.amountMinor,
        );
        addBudgetMoney(availability, assignment.destinationEnvelopeId, cashOverspendingMinor);
        const remainingAfterCashMinor = assignment.amountMinor - cashOverspendingMinor;
        const remainingMinor = fundOldestCardSpending(
          assignment.destinationEnvelopeId,
          remainingAfterCashMinor,
          unfunded,
          reserveByAccount,
        );
        addBudgetMoney(availability, assignment.destinationEnvelopeId, remainingMinor);
      }
    }
    for (const transaction of supportedTransactions.filter(
      (row) => row.date.slice(0, 7) === period,
    )) {
      applyBudgetTransaction(
        transaction,
        period,
        facts,
        accountTypes,
        balances,
        availability,
        reserveByAccount,
        unreservedPaymentByAccount,
        unfunded,
      );
    }
  }
  return {
    availability,
    balances,
    reserveByAccount,
    unreservedPaymentByAccount,
    unfunded,
  };
}

function fundOldestCardSpending(
  envelopeId: string,
  amountMinor: number,
  unfunded: UnfundedCardEntry[],
  reserveByAccount: Map<string, number>,
): number {
  let remainingMinor = amountMinor;
  for (const entry of unfunded) {
    if (entry.envelopeId !== envelopeId || remainingMinor <= 0) continue;
    const fundedMinor = Math.min(entry.remainingMinor, remainingMinor);
    entry.remainingMinor -= fundedMinor;
    remainingMinor -= fundedMinor;
    addBudgetMoney(reserveByAccount, entry.accountId, fundedMinor);
  }
  return remainingMinor;
}

function applyRollover(
  availability: Map<string, number>,
  facts: AccountDependencyFacts,
  period: string,
): void {
  for (const [envelopeId, amountMinor] of availability) {
    const setting = facts.rollovers
      .filter((row) => row.envelopeId === envelopeId && row.effectiveFromPeriod <= period)
      .at(-1);
    if (amountMinor > 0 && setting?.positiveRollover === 0) availability.set(envelopeId, 0);
  }
}
