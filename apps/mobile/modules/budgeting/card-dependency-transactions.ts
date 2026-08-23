import type { AccountDependencyFacts, BudgetTransactionRow } from "./account-dependency-read";
import type { UnfundedCardEntry } from "./card-dependency-types";
import { addBudgetMoney, unsupportedTransactionType } from "./card-dependency-validation";
import { requireMinorUnits } from "./validation";

export function applyLedgerBalance(
  transaction: BudgetTransactionRow,
  balances: Map<string, number>,
): void {
  switch (transaction.type) {
    case "income":
      addBudgetMoney(balances, transaction.accountId, transaction.amountMinor);
      return;
    case "expense":
      addBudgetMoney(balances, transaction.accountId, -transaction.amountMinor);
      return;
    case "transfer":
      addBudgetMoney(balances, transaction.accountId, -transaction.amountMinor);
      if (transaction.toAccountId) {
        addBudgetMoney(balances, transaction.toAccountId, transaction.amountMinor);
      }
      return;
    default:
      throw unsupportedTransactionType(transaction.type);
  }
}

export function applyBudgetTransaction(
  transaction: BudgetTransactionRow,
  period: string,
  facts: AccountDependencyFacts,
  accountTypes: ReadonlyMap<string, string>,
  balances: Map<string, number>,
  availability: Map<string, number>,
  reserveByAccount: Map<string, number>,
  unreservedPaymentByAccount: Map<string, number>,
  unfunded: UnfundedCardEntry[],
): void {
  const sourceIsCard = accountTypes.get(transaction.accountId) === "credit_card";
  if (transaction.type === "expense") {
    if (sourceIsCard) {
      applyCardExpense(transaction, balances, availability, reserveByAccount, unfunded);
    } else {
      addBudgetMoney(balances, transaction.accountId, -transaction.amountMinor);
      if (
        transaction.envelopeId &&
        hasFundingMembership(facts, transaction.accountId, transaction.currency, period)
      ) {
        addBudgetMoney(availability, transaction.envelopeId, -transaction.amountMinor);
      }
    }
    return;
  }
  if (transaction.type === "income") {
    addBudgetMoney(balances, transaction.accountId, transaction.amountMinor);
    return;
  }
  if (transaction.type !== "transfer") throw unsupportedTransactionType(transaction.type);
  addBudgetMoney(balances, transaction.accountId, -transaction.amountMinor);
  if (transaction.toAccountId) {
    addBudgetMoney(balances, transaction.toAccountId, transaction.amountMinor);
  }
  if (transaction.toAccountId && accountTypes.get(transaction.toAccountId) === "credit_card") {
    const isEligiblePayment =
      transaction.sourceCurrency === transaction.destinationCurrency &&
      transaction.currency === transaction.sourceCurrency &&
      hasFundingMembership(facts, transaction.accountId, transaction.sourceCurrency, period);
    if (isEligiblePayment) {
      applyCardPayment(
        transaction.toAccountId,
        transaction.amountMinor,
        reserveByAccount,
        unreservedPaymentByAccount,
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
  addBudgetMoney(balances, transaction.accountId, -transaction.amountMinor);
  const liabilityMinor = transaction.amountMinor - cardCreditUsed;
  if (!transaction.envelopeId || liabilityMinor <= 0) return;
  const availableMinor = Math.max(availability.get(transaction.envelopeId) ?? 0, 0);
  const fundedMinor = Math.min(availableMinor, liabilityMinor);
  addBudgetMoney(availability, transaction.envelopeId, -fundedMinor);
  addBudgetMoney(reserveByAccount, transaction.accountId, fundedMinor);
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
  unreservedPaymentByAccount: Map<string, number>,
  unfunded: UnfundedCardEntry[],
): void {
  const reserveMinor = reserveByAccount.get(accountId) ?? 0;
  const reservePaymentMinor = Math.min(reserveMinor, amountMinor);
  addBudgetMoney(reserveByAccount, accountId, -reservePaymentMinor);
  let remainingMinor = amountMinor - reservePaymentMinor;
  addBudgetMoney(unreservedPaymentByAccount, accountId, remainingMinor);
  for (const entry of unfunded) {
    if (entry.accountId !== accountId || remainingMinor <= 0) continue;
    const paidMinor = Math.min(entry.remainingMinor, remainingMinor);
    entry.remainingMinor -= paidMinor;
    remainingMinor -= paidMinor;
    requireMinorUnits(entry.remainingMinor, "Budget");
    requireMinorUnits(remainingMinor, "Budget");
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
