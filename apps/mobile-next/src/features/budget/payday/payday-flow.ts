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

/** The steps after Got paid, in order. */
export type PaydayStep = "wrapUp" | "leftovers" | "plan";

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

/** The steps this payday shows, in order: the same ones `nextPaydayStep` walks through. */
export function paydaySteps(facts: PaydayFlowFacts): PaydayStep[] {
  const steps: PaydayStep[] = [];
  if (facts.hasPrevious) steps.push("wrapUp");
  if (facts.leftoversMinor > 0) steps.push("leftovers");
  steps.push("plan");
  return steps;
}

export interface PaydayStepPosition {
  /** 1-based; a step the flow would skip counts as the first. */
  readonly step: number;
  readonly of: number;
  /** The first step closes the flow; later ones go back to the step before. */
  readonly first: boolean;
}

/** Where `step` sits in this payday's steps, for the header's progress segments. */
export function paydayStepPosition(step: PaydayStep, facts: PaydayFlowFacts): PaydayStepPosition {
  const steps = paydaySteps(facts);
  const index = steps.indexOf(step);
  return { step: Math.max(index, 0) + 1, of: steps.length, first: index <= 0 };
}

/** The step a route opens, for copy that names what comes next. */
export function paydayStepOf(route: PaydayStepRoute): PaydayStep | null {
  if (route === PAYDAY_ROUTES.wrapUp) return "wrapUp";
  if (route === PAYDAY_ROUTES.leftovers) return "leftovers";
  if (route === PAYDAY_ROUTES.plan) return "plan";
  return null;
}
