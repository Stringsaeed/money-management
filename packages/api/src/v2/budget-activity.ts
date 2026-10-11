import { Effect } from "effect";

import { selectBudget } from "./budget";
import { ActivityLimitInvalid, BudgetNotFound } from "./budget-errors";
import { BudgetSelection } from "./budget-services";
import { BudgetStore } from "./budget-store";
import type { V2BudgetActivity } from "./contracts";

export const BUDGET_ACTIVITY_DEFAULT_LIMIT = 20;
export const BUDGET_ACTIVITY_MAX_LIMIT = 50;

/**
 * Recent money moves of the selected budget for "who" lines (#375 H3), newest
 * first. Transactions keep their own authorship; this lists only the
 * append-only assignments. No budget yet (and no currency named): empty.
 */
export const listBudgetActivity = Effect.fn("listBudgetActivity")(function* (
  limit: number = BUDGET_ACTIVITY_DEFAULT_LIMIT,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > BUDGET_ACTIVITY_MAX_LIMIT) {
    return yield* new ActivityLimitInvalid({ maxLimit: BUDGET_ACTIVITY_MAX_LIMIT });
  }
  const budget = yield* selectBudget;
  if (!budget) {
    const { currency } = yield* BudgetSelection;
    if (currency) return yield* new BudgetNotFound({ currency });
    return { items: [] } satisfies V2BudgetActivity;
  }
  const items = yield* (yield* BudgetStore).listActivity(budget.id, limit);
  return { items } satisfies V2BudgetActivity;
});
