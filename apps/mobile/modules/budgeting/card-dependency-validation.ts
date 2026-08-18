import type { AccountDependencyFacts, BudgetTransactionRow } from "./account-dependency-read";
import { requireCurrency, requireMinorUnits } from "./validation";

export function addBudgetMoney(
  totals: Map<string, number>,
  key: string,
  amountMinor: number,
): void {
  requireMinorUnits(amountMinor, "Budget");
  const totalMinor = (totals.get(key) ?? 0) + amountMinor;
  requireMinorUnits(totalMinor, "Budget");
  totals.set(key, totalMinor);
}

export function validateAccountDependencyFacts(facts: AccountDependencyFacts): void {
  const accountTypes = new Set([
    "checking",
    "savings",
    "cash",
    "credit_card",
    "investment",
    "other",
  ]);
  const transactionTypes = new Set(["income", "expense", "transfer"]);
  for (const account of facts.accounts) {
    requireCurrency(account.currency);
    requireMinorUnits(account.initialBalance, account.currency);
    if (!accountTypes.has(account.type)) {
      throw new Error(`Unsupported Account type in budget history: ${account.type}.`);
    }
  }
  for (const assignment of facts.assignments) {
    requireMinorUnits(assignment.amountMinor, "Budget");
  }
  for (const transaction of facts.transactions) {
    requireCurrency(transaction.currency);
    requireMinorUnits(transaction.amountMinor, transaction.currency);
    if (!transactionTypes.has(transaction.type)) {
      throw unsupportedTransactionType(transaction.type);
    }
  }
}

export function isUnsupportedCrossCurrencyTransfer(
  transaction: BudgetTransactionRow,
): transaction is BudgetTransactionRow & { destinationCurrency: string; type: "transfer" } {
  return (
    transaction.type === "transfer" &&
    transaction.destinationCurrency !== null &&
    transaction.sourceCurrency !== transaction.destinationCurrency
  );
}

export function unsupportedTransactionType(type: unknown): Error {
  return new Error(`Unsupported Transaction type in budget history: ${String(type)}.`);
}
