import { useBudgetPeriodsQuery, useLedgerMutations } from "@/data/ledger-queries";

import { historyStarts } from "../envelope/envelope-model";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView } from "../home/home-model";
import { useBudgetRole } from "../role/use-budget-role";

import { repeatInput, repeatPlan, type RepeatPlan } from "./repeat-plan-model";

/**
 * Last month's plan, as Repeat needs it: there is none (first period), it is on its way, it
 * could not be read, or here it is.
 */
export type LastMonth = "none" | "loading" | "error" | "ready";

/**
 * Whether C3 shows Repeat: not without a last month or while the role loads, refused (with the
 * admin-only line) for anyone who can't edit the plan, offered otherwise.
 */
export type RepeatAccess = "hidden" | "refused" | "offered";

export interface PlanMonth {
  readonly plan: RepeatPlan;
  readonly lastMonth: LastMonth;
  readonly repeatAccess: RepeatAccess;
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
  const previous = history.periods[0];
  const plan = repeatPlan({
    envelopes: view.envelopes,
    current: current.envelopes,
    previous: previous?.envelopes ?? [],
    unassignedMinor: current.unassignedMinor,
  });
  const lastMonth: LastMonth =
    previousStart === undefined
      ? "none"
      : previous
        ? "ready"
        : history.isError
          ? "error"
          : "loading";

  const repeatAccess: RepeatAccess =
    lastMonth === "none" || role.loading ? "hidden" : role.canEditPlan ? "offered" : "refused";

  return {
    plan,
    lastMonth,
    repeatAccess,
    retryLastMonth: history.retry,
    busy: write.busy,
    error: write.error,
    repeat: () => write.run(() => createAssignments(repeatInput(plan))),
  };
}
