import { Effect } from "effect";

import { periodContaining, type PaydayRule } from "@trove/domain/budget";

import { dayBefore, LedgerFacts } from "./budget-ledger-facts";
import { BudgetClock } from "./budget-services";

/**
 * `GET /budget/setup-facts` (#367 S2-S4): what the setup flow needs to suggest
 * envelopes and preview "Left to plan" before a budget exists, for the period
 * that contains today under the chosen payday rule.
 */
export const getBudgetSetupFacts = Effect.fn("getBudgetSetupFacts")(function* (rule: PaydayRule) {
  const { today } = yield* BudgetClock;
  const period = periodContaining(rule, today);
  const lastPeriod = periodContaining(rule, dayBefore(period.start));
  return yield* (yield* LedgerFacts).setupFacts(period, lastPeriod, today);
});
