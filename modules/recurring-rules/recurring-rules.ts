import { changeRecurringRule } from "./change";
import { ConfirmationStore } from "./confirmation";
import { readRecurringRules } from "./read";
import { settleRecurringRules } from "./runtime";
import type { CreateRecurringRulesOptions, RecurringRules, SettlementReport } from "./types";

export function createRecurringRules(options: CreateRecurringRulesOptions): RecurringRules {
  const confirmations = new ConfirmationStore(options);
  let inFlightSettlement: Promise<SettlementReport> | null = null;

  return {
    read: (query) => readRecurringRules(options, query),
    change: (intent) => changeRecurringRule(options, confirmations, intent),
    settle: () => {
      if (inFlightSettlement) return inFlightSettlement;
      inFlightSettlement = settleRecurringRules(options).finally(() => {
        inFlightSettlement = null;
      });
      return inFlightSettlement;
    },
  };
}
