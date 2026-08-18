import { eachMonthOfInterval, format, parseISO } from "date-fns";

import type { AccountDependencyFacts, BudgetTransactionRow } from "./account-dependency-read";

export interface UnfundedCardEntry {
  accountId: string;
  envelopeId: string;
  remainingMinor: number;
}

export interface CardBudgetState {
  availability: Map<string, number>;
  balances: Map<string, number>;
  reserveByAccount: Map<string, number>;
  unfunded: UnfundedCardEntry[];
}

export function evaluateCardBudgetState(
  facts: AccountDependencyFacts,
  throughPeriod: string,
): CardBudgetState {
  const availability = new Map<string, number>();
  const balances = new Map(facts.accounts.map((account) => [account.id, account.initialBalance]));
  const accountTypes = new Map(facts.accounts.map((account) => [account.id, account.type]));
  const reserveByAccount = new Map<string, number>();
  const unfunded: UnfundedCardEntry[] = [];
  const periods = eachMonthOfInterval({
    start: parseISO(`${facts.activationPeriod}-01`),
    end: parseISO(`${throughPeriod}-01`),
  }).map((date) => format(date, "yyyy-MM"));

  for (const transaction of facts.transactions.filter(
    (row) => row.date.slice(0, 7) < facts.activationPeriod,
  )) {
    applyLedgerBalance(transaction, balances);
  }

  for (const [index, period] of periods.entries()) {
    if (index > 0) applyRollover(availability, facts, period);
    for (const assignment of facts.assignments.filter((row) => row.period === period)) {
      if (assignment.sourceEnvelopeId) {
        addMoney(availability, assignment.sourceEnvelopeId, -assignment.amountMinor);
      }
      if (assignment.destinationEnvelopeId) {
        const availableMinor = availability.get(assignment.destinationEnvelopeId) ?? 0;
        const cashOverspendingMinor = Math.min(
          Math.max(-availableMinor, 0),
          assignment.amountMinor,
        );
        addMoney(availability, assignment.destinationEnvelopeId, cashOverspendingMinor);
        const remainingAfterCashMinor = assignment.amountMinor - cashOverspendingMinor;
        const remainingMinor = fundOldestCardSpending(
          assignment.destinationEnvelopeId,
          remainingAfterCashMinor,
          unfunded,
          reserveByAccount,
        );
        addMoney(availability, assignment.destinationEnvelopeId, remainingMinor);
      }
    }
    for (const transaction of facts.transactions.filter((row) => row.date.slice(0, 7) === period)) {
      applyTransaction(
        transaction,
        period,
        facts,
        accountTypes,
        balances,
        availability,
        reserveByAccount,
        unfunded,
      );
    }
  }
  return { availability, balances, reserveByAccount, unfunded };
}

function applyLedgerBalance(
  transaction: BudgetTransactionRow,
  balances: Map<string, number>,
): void {
  if (transaction.type === "income") {
    addMoney(balances, transaction.accountId, transaction.amountMinor);
  } else if (transaction.type === "expense") {
    addMoney(balances, transaction.accountId, -transaction.amountMinor);
  } else if (transaction.type === "transfer") {
    addMoney(balances, transaction.accountId, -transaction.amountMinor);
    if (transaction.toAccountId)
      addMoney(balances, transaction.toAccountId, transaction.amountMinor);
  }
}

function applyTransaction(
  transaction: BudgetTransactionRow,
  period: string,
  facts: AccountDependencyFacts,
  accountTypes: ReadonlyMap<string, string>,
  balances: Map<string, number>,
  availability: Map<string, number>,
  reserveByAccount: Map<string, number>,
  unfunded: UnfundedCardEntry[],
): void {
  const sourceIsCard = accountTypes.get(transaction.accountId) === "credit_card";
  if (transaction.type === "expense") {
    if (sourceIsCard) {
      applyCardExpense(transaction, balances, availability, reserveByAccount, unfunded);
    } else if (
      transaction.envelopeId &&
      hasFundingMembership(facts, transaction.accountId, transaction.currency, period)
    ) {
      addMoney(availability, transaction.envelopeId, -transaction.amountMinor);
    }
    return;
  }
  if (transaction.type === "income") {
    if (sourceIsCard) addMoney(balances, transaction.accountId, transaction.amountMinor);
    return;
  }
  if (transaction.type !== "transfer") return;
  if (sourceIsCard) addMoney(balances, transaction.accountId, -transaction.amountMinor);
  if (transaction.toAccountId && accountTypes.get(transaction.toAccountId) === "credit_card") {
    addMoney(balances, transaction.toAccountId, transaction.amountMinor);
    const isEligiblePayment =
      transaction.sourceCurrency === transaction.destinationCurrency &&
      transaction.currency === transaction.sourceCurrency &&
      hasFundingMembership(facts, transaction.accountId, transaction.sourceCurrency, period);
    if (isEligiblePayment) {
      applyCardPayment(
        transaction.toAccountId,
        transaction.amountMinor,
        reserveByAccount,
        unfunded,
      );
    }
  }
}

function applyCardExpense(
  transaction: BudgetTransactionRow,
  balances: Map<string, number>,
  availability: Map<string, number>,
  reserveByAccount: Map<string, number>,
  unfunded: UnfundedCardEntry[],
): void {
  const balance = balances.get(transaction.accountId) ?? 0;
  const cardCreditUsed = Math.min(Math.max(balance, 0), transaction.amountMinor);
  balances.set(transaction.accountId, balance - transaction.amountMinor);
  const liabilityMinor = transaction.amountMinor - cardCreditUsed;
  if (!transaction.envelopeId || liabilityMinor <= 0) return;
  const availableMinor = Math.max(availability.get(transaction.envelopeId) ?? 0, 0);
  const fundedMinor = Math.min(availableMinor, liabilityMinor);
  addMoney(availability, transaction.envelopeId, -fundedMinor);
  addMoney(reserveByAccount, transaction.accountId, fundedMinor);
  if (fundedMinor < liabilityMinor) {
    unfunded.push({
      accountId: transaction.accountId,
      envelopeId: transaction.envelopeId,
      remainingMinor: liabilityMinor - fundedMinor,
    });
  }
}

function applyCardPayment(
  accountId: string,
  amountMinor: number,
  reserveByAccount: Map<string, number>,
  unfunded: UnfundedCardEntry[],
): void {
  const reserveMinor = reserveByAccount.get(accountId) ?? 0;
  const reservePaymentMinor = Math.min(reserveMinor, amountMinor);
  reserveByAccount.set(accountId, reserveMinor - reservePaymentMinor);
  let remainingMinor = amountMinor - reservePaymentMinor;
  for (const entry of unfunded) {
    if (entry.accountId !== accountId || remainingMinor <= 0) continue;
    const paidMinor = Math.min(entry.remainingMinor, remainingMinor);
    entry.remainingMinor -= paidMinor;
    remainingMinor -= paidMinor;
  }
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
    addMoney(reserveByAccount, entry.accountId, fundedMinor);
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

function hasFundingMembership(
  facts: AccountDependencyFacts,
  accountId: string,
  currency: string,
  period: string,
): boolean {
  return facts.memberships.some(
    (membership) =>
      membership.accountId === accountId &&
      membership.currency === currency &&
      membership.effectiveFromPeriod <= period &&
      (membership.effectiveToPeriod === null || membership.effectiveToPeriod >= period),
  );
}

function addMoney(totals: Map<string, number>, key: string, amountMinor: number): void {
  totals.set(key, (totals.get(key) ?? 0) + amountMinor);
}
