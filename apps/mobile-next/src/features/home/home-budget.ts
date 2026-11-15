import type { V2BudgetView, V2Transaction } from "@trove/api/v2/contracts";

import type { ActiveBudgetView } from "@/features/budget/home/home-model";

import {
  dailyEverydaySpend,
  everydayAllowanceMinor,
  spendTicks,
  type SpendTick,
} from "@/features/budget/home/spend-ticks";

/** What Home shows about the budget: nothing (flag off or unknown), the plan CTA, or safe to spend. */
export type HomeBudget =
  | { readonly kind: "hidden" }
  | { readonly kind: "none" }
  | {
      readonly kind: "active";
      readonly currency: string;
      readonly safeToSpendMinor: number;
      readonly perDayMinor: number;
      readonly daysLeft: number;
      readonly ticks: readonly SpendTick[];
    };

/** The active budget, or null while the flag is off, the view is loading, or there is none. */
export function activeBudgetOf(
  budgeting: boolean,
  view: V2BudgetView | undefined,
): ActiveBudgetView | null {
  return budgeting && view && view.budget !== null ? view : null;
}

export interface HomeBudgetInput {
  readonly budgeting: boolean;
  readonly view: V2BudgetView | undefined;
  readonly failed: boolean;
  readonly currency: string;
  readonly expenses: readonly V2Transaction[];
  readonly today: string;
}

/** Folds the budget view and this period's spending into what the Home slip prints. */
export function homeBudget({
  budgeting,
  view,
  failed,
  currency,
  expenses,
  today,
}: HomeBudgetInput): HomeBudget {
  if (!budgeting || failed || !view) return { kind: "hidden" };
  const active = activeBudgetOf(budgeting, view);
  if (!active) return { kind: "none" };
  return {
    kind: "active",
    currency,
    safeToSpendMinor: active.current.safeToSpendMinor,
    perDayMinor: active.current.perDayMinor,
    daysLeft: active.current.daysLeft,
    ticks: spendTicks({
      period: active.current.period,
      today,
      spendByDay: dailyEverydaySpend(expenses, active, currency, today),
      allowanceMinor: everydayAllowanceMinor(active),
    }),
  };
}
