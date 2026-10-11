import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { leftoverTotal } from "./leftovers-model";

export const PAYDAY_ROUTES = {
  gotPaid: "/budget/payday/got-paid",
  wrapUp: "/budget/payday/wrap-up",
  leftovers: "/budget/payday/leftovers",
  plan: "/budget/payday/plan",
} as const;

export type PaydayStepRoute = (typeof PAYDAY_ROUTES)[keyof typeof PAYDAY_ROUTES];

/** Where the Budget tab lives; every step ends here. */
export const BUDGET_HOME_ROUTE = "/(tabs)/envelopes";

export interface PaydayFlowFacts {
  /** A finished period exists to wrap up. */
  readonly hasPrevious: boolean;
  /** Everyday rollover in this period; Leftovers is skipped when it is 0. */
  readonly leftoversMinor: number;
}

type FlowStep = "gotPaid" | "wrapUp" | "leftovers";

/**
 * The step after `from`: Wrap-up (when a period just ended), Leftovers (when Everyday rolled
 * anything over), then Plan new month. Finishing Plan new month lands on Budget home.
 */
export function nextPaydayStep(from: FlowStep, facts: PaydayFlowFacts): PaydayStepRoute {
  if (from === "gotPaid" && facts.hasPrevious) return PAYDAY_ROUTES.wrapUp;
  if (from !== "leftovers" && facts.leftoversMinor > 0) return PAYDAY_ROUTES.leftovers;
  return PAYDAY_ROUTES.plan;
}

/** What decides which steps the flow shows, read from the budget as it stands. */
export function paydayFlowFacts(view: ActiveBudgetView): PaydayFlowFacts {
  return {
    hasPrevious: view.budget.activationPeriodStart < view.current.period.start,
    leftoversMinor: leftoverTotal(envelopeLines(view)),
  };
}
