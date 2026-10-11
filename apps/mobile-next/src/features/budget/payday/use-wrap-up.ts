import { useBudgetPeriodsQuery } from "@/data/ledger-queries";
import { currencyFractionDigits } from "@/utils/money";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { historyStarts } from "../envelope/envelope-model";
import type { ActiveBudgetView } from "../home/home-model";

import {
  RAISE_PERIODS,
  raiseSuggestion,
  wrapUpEnvelopes,
  wrapUpSummary,
  type RaiseSuggestion,
  type WrapUpSummary,
} from "./wrap-up-model";

export type WrapUp =
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | {
      readonly status: "ready";
      readonly periodStart: string;
      readonly periodEnd: string;
      /** The period that ended is the one the budget started in, so it may be partial. */
      readonly firstMonth: boolean;
      readonly summary: WrapUpSummary;
      readonly suggestion: RaiseSuggestion | null;
    };

/** The period just ended, summarised, plus the two before it for the "raise" suggestion. */
export function useWrapUp(view: ActiveBudgetView): WrapUp {
  const { budget, current, paydayRule, envelopes } = view;
  const starts = historyStarts(paydayRule, current.period.start, budget.activationPeriodStart);
  const recent = starts.slice(0, RAISE_PERIODS);
  const { periods, isLoading } = useBudgetPeriodsQuery(recent);
  const currency = useBudgetCurrency();
  const minorUnitsPerWhole = 10 ** currencyFractionDigits(currency);

  const [latest] = periods;
  if (recent.length === 0) return { status: "unavailable" };
  if (isLoading || latest === undefined) return { status: "loading" };
  if (latest === null) return { status: "unavailable" };

  const history = periods.map((period) => (period ? wrapUpEnvelopes(period, envelopes) : null));
  const complete = history.filter((lines) => lines !== null);
  return {
    status: "ready",
    periodStart: latest.period.start,
    periodEnd: latest.period.end,
    firstMonth: latest.period.start === budget.activationPeriodStart,
    summary: wrapUpSummary(wrapUpEnvelopes(latest, envelopes)),
    suggestion:
      complete.length === RAISE_PERIODS ? raiseSuggestion(complete, minorUnitsPerWhole) : null,
  };
}
