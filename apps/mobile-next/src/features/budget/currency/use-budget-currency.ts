import { DEFAULT_BUDGET_CURRENCY } from "@/data/budget-currency";
import { useSelectedBudget } from "@/data/ledger-queries";
import { formatMoneyMinor } from "@/utils/money";

/**
 * The currency of the budget on screen. Budget screens only render once a budget is selected;
 * the default covers the moment before that so a component never has to handle "no currency".
 * Setup screens do not use this: they read the currency of the budget being set up.
 */
export function useBudgetCurrency(): string {
  return useSelectedBudget().currency ?? DEFAULT_BUDGET_CURRENCY;
}

/** Formats minor units in the selected budget's currency. */
export function useBudgetMoney(): (minor: number) => string {
  const currency = useBudgetCurrency();
  return (minor) => formatMoneyMinor(minor, currency);
}
