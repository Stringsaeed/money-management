import { ApiError } from "@/data/http";

/**
 * Copy for the three currency refusals the budget API can give. Every one means nothing was
 * saved, and says what to do next. `null` for any other error.
 */
export function currencyErrorMessage(cause: unknown): string | null {
  if (!(cause instanceof ApiError)) return null;
  switch (cause.code) {
    case "budget_currency_required":
      return "This ledger has budgets in more than one currency. Pick the budget's currency first. Nothing was saved.";
    case "budget_currency_mismatch":
      return "That account is in another currency than this budget. Pick one in the budget's currency. Nothing was saved.";
    case "invalid_currency":
      return "That currency isn't supported. Pick another one. Nothing was saved.";
    default:
      return null;
  }
}
