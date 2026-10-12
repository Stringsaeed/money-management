import type { V2EnvelopeTotals } from "@trove/api/v2/contracts";

import { useBudgetPeriodsQuery, useLedgerMutations } from "@/data/ledger-queries";
import { useTransactionSummaryQuery } from "@/data/transaction-list-queries";

import { budgetToday } from "../due/due-model";
import { historyStarts } from "../envelope/envelope-model";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView } from "../home/home-model";
import { useBudgetRole } from "../role/use-budget-role";

import {
  lastMonthOf,
  periodIncome,
  planAccessOf,
  repeatAccessOf,
  type LastMonth,
  type PlanAccess,
  type RepeatAccess,
} from "./plan-month-model";
import { repeatInput, repeatPlan, type RepeatPlan } from "./repeat-plan-model";

export type { LastMonth, PlanAccess, RepeatAccess } from "./plan-month-model";

export interface PlanMonth {
  readonly plan: RepeatPlan;
  readonly lastMonth: LastMonth;
  readonly repeatAccess: RepeatAccess;
  readonly planAccess: PlanAccess;
  /** Last month's per-envelope totals once loaded, for "Last month · 1,540" hints. */
  readonly previous: readonly V2EnvelopeTotals[] | null;
  /** Income into the budget's accounts since the period began; `null` while unknown. */
  readonly incomeMinor: number | null;
  /** Reads last month again after a failure. */
  readonly retryLastMonth: () => Promise<void>;
  readonly busy: boolean;
  readonly error: string | undefined;
  /** Writes the repeat batch; true when it went through. */
  readonly repeat: () => Promise<boolean>;
}

/** C3's numbers: what repeating last month's plan would write now, and the write itself. */
export function usePlanMonth(view: ActiveBudgetView): PlanMonth {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const role = useBudgetRole();
  const { budget, current } = view;

  const [previousStart] = historyStarts(
    view.paydayRule,
    current.period.start,
    budget.activationPeriodStart,
  );
  const history = useBudgetPeriodsQuery(previousStart ? [previousStart] : []);
  const previous = history.periods[0]?.envelopes ?? null;
  const plan = repeatPlan({
    envelopes: view.envelopes,
    current: current.envelopes,
    previous: previous ?? [],
    unassignedMinor: current.unassignedMinor,
  });
  const lastMonth = lastMonthOf(previousStart !== undefined, previous !== null, history.isError);
  const planAccess = planAccessOf(role.loading, role.canEditPlan);

  const income = useTransactionSummaryQuery({
    kinds: ["income"],
    accountIds: view.fundingAccountIds,
    from: current.period.start,
    to: budgetToday(current),
  });

  return {
    plan,
    lastMonth,
    repeatAccess: repeatAccessOf(lastMonth, planAccess),
    planAccess,
    previous,
    incomeMinor: periodIncome(income.data, income.isError, budget.currency),
    retryLastMonth: history.retry,
    busy: write.busy,
    error: write.error,
    repeat: () => write.run(() => createAssignments(repeatInput(plan))),
  };
}
