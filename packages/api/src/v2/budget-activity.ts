import { Effect } from "effect";

import { ActivityLimitInvalid } from "./budget-errors";
import { BudgetStore } from "./budget-store";
import type { V2BudgetActivity } from "./contracts";

export const BUDGET_ACTIVITY_DEFAULT_LIMIT = 20;
export const BUDGET_ACTIVITY_MAX_LIMIT = 50;

/**
 * Recent money moves for "who" lines (#375 H3), newest first. Transactions keep
 * their own authorship; this lists only the append-only assignments.
 */
export const listBudgetActivity = Effect.fn("listBudgetActivity")(function* (
  limit: number = BUDGET_ACTIVITY_DEFAULT_LIMIT,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > BUDGET_ACTIVITY_MAX_LIMIT) {
    return yield* new ActivityLimitInvalid({ maxLimit: BUDGET_ACTIVITY_MAX_LIMIT });
  }
  const store = yield* BudgetStore;
  const budget = yield* store.findBudget;
  if (!budget) return { items: [] } satisfies V2BudgetActivity;
  return { items: yield* store.listActivity(budget.id, limit) } satisfies V2BudgetActivity;
});
