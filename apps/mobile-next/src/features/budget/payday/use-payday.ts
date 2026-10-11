import { useTransactionSummaryQuery } from "@/data/transaction-list-queries";

import { budgetToday } from "../due/due-model";
import type { ActiveBudgetView } from "../home/home-model";

import { paydayStatus, salaryWindowStart, type PaydayStatus } from "./payday-status";

export interface UsePayday {
  readonly today: string;
  readonly status: PaydayStatus;
}

/**
 * Whether this period's salary still needs logging: a salary is expected and no income has landed
 * in a funding account since the period began (or in the early-pay days just before it).
 */
export function usePayday(view: ActiveBudgetView): UsePayday {
  const today = budgetToday(view.current);
  const periodStart = view.current.period.start;
  const income = useTransactionSummaryQuery({
    kinds: ["income"],
    accountIds: view.fundingAccountIds,
    from: salaryWindowStart(periodStart),
    to: today,
  });
  const status = paydayStatus({
    expectsSalary: view.budget.usualSalaryMinor !== null || view.budget.paydayReminder,
    today,
    periodStart,
    activationPeriodStart: view.budget.activationPeriodStart,
    activatedOn: view.budget.activatedOn,
    incomeCount: income.data?.count ?? null,
  });
  return { today, status };
}
