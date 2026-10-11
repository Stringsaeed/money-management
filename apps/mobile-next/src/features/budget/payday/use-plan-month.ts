import { useBudgetPeriodsQuery, useLedgerMutations } from "@/data/ledger-queries";

import { historyStarts } from "../envelope/envelope-model";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView } from "../home/home-model";

import { repeatInput, repeatPlan, type RepeatPlan } from "./repeat-plan-model";

export interface PlanMonth {
  readonly plan: RepeatPlan;
  /** A finished period exists to repeat from. */
  readonly hasLastMonth: boolean;
  readonly isLoading: boolean;
  readonly busy: boolean;
  readonly error: string | undefined;
  /** Writes the repeat batch; true when it went through. */
  readonly repeat: () => Promise<boolean>;
}

/** C3's numbers: what repeating last month's plan would write now, and the write itself. */
export function usePlanMonth(view: ActiveBudgetView): PlanMonth {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const { budget, current } = view;

  const [previousStart] = historyStarts(
    view.paydayRule,
    current.period.start,
    budget.activationPeriodStart,
  );
  const { periods, isLoading } = useBudgetPeriodsQuery(previousStart ? [previousStart] : []);
  const previous = periods[0];
  const plan = repeatPlan({
    envelopes: view.envelopes,
    current: current.envelopes,
    previous: previous?.envelopes ?? [],
    unassignedMinor: current.unassignedMinor,
  });

  return {
    plan,
    hasLastMonth: previousStart !== undefined && previous !== null,
    isLoading,
    busy: write.busy,
    error: write.error,
    repeat: () => write.run(() => createAssignments(repeatInput(plan))),
  };
}
