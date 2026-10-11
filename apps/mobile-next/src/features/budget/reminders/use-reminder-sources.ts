import { useQueries } from "@tanstack/react-query";

import type { V2BudgetView } from "@trove/api/v2/contracts";

import { ledgerClient } from "@/data/ledger-client";
import { budgetKey, useLedgerData, useSelectedBudget } from "@/data/ledger-queries";
import { normalizeTransactionFilters, transactionListKey } from "@/data/transaction-list-keys";

import { budgetToday, dueThrough, nextPaydayDate } from "../due/due-model";
import type { ActiveBudgetView } from "../home/home-model";
import { paydayStatus, salaryWindowStart } from "../payday/payday-status";

import type { ReminderPrefs } from "./reminder-prefs";
import type { BudgetReminderSource } from "./reminder-plan";

/** Upcoming paydays scheduled for each budget with a payday reminder. */
const UPCOMING_PAYDAYS = 2;

export interface ReminderSources {
  /** Every budget's data has loaded, so the plan is complete. A partial plan is never synced. */
  readonly loaded: boolean;
  readonly today: string;
  readonly sources: readonly BudgetReminderSource[];
  /** Some budget wants a payday reminder or has a bill pending. */
  readonly wanted: boolean;
}

const isActive = (view: V2BudgetView | undefined): view is ActiveBudgetView =>
  view !== undefined && view.budget !== null;

const EMPTY: ReminderSources = { loaded: false, today: "", sources: [], wanted: false };

/**
 * What every budget in the ledger contributes to reminders, loaded in the background: the
 * notifications are per ledger, so one budget being on screen must not drop the others'.
 * Shares the cache with the screens' own queries (same keys).
 */
export function useReminderSources(prefs: ReminderPrefs, prefsReady: boolean): ReminderSources {
  const { identityKey, scope } = useLedgerData();
  const { budgets } = useSelectedBudget();
  const key = budgetKey(identityKey, scope);

  const views = useQueries({
    queries: budgets.map((budget) => ({
      queryKey: [...key, "view", budget.currency],
      queryFn: () => ledgerClient.budget.get(scope, budget.currency),
      staleTime: 15_000,
      retry: 1,
    })),
  });
  const active = views.map((result) => (isActive(result.data) ? result.data : null));

  const dues = useQueries({
    queries: budgets.map((budget, index) => {
      const view = active[index];
      const through = view
        ? dueThrough(budgetToday(view.current), nextPaydayDate(view.current))
        : "";
      return {
        queryKey: [...key, "due", budget.currency, through],
        queryFn: () => ledgerClient.recurring.due(scope, budget.currency, through),
        enabled: view !== null && view !== undefined,
        staleTime: 15_000,
        retry: 1,
      };
    }),
  });

  const incomes = useQueries({
    queries: budgets.map((budget, index) => {
      const view = active[index];
      const filters = normalizeTransactionFilters({
        kinds: ["income"],
        accountIds: view?.fundingAccountIds ?? [],
        from: view ? salaryWindowStart(view.current.period.start) : undefined,
        to: view ? budgetToday(view.current) : undefined,
      });
      return {
        queryKey: [...transactionListKey(identityKey, scope), "summary", filters],
        queryFn: () => ledgerClient.transactions.summary(scope, filters),
        enabled: view !== null && view !== undefined,
        staleTime: 15_000,
        retry: 1,
      };
    }),
  });

  const first = active.find((view) => view !== null);
  const complete =
    prefsReady &&
    first !== undefined &&
    budgets.length > 0 &&
    active.every((view) => view !== null) &&
    dues.every((result) => result.data !== undefined) &&
    incomes.every((result) => result.data !== undefined);
  if (!complete || !first) return EMPTY;

  const today = budgetToday(first.current);
  const sources = budgets.flatMap((budget, index): BudgetReminderSource[] => {
    const view = active[index];
    const due = dues[index]?.data;
    const income = incomes[index]?.data;
    if (!view || !due || !income) return [];
    const viewToday = budgetToday(view.current);
    const status = paydayStatus({
      expectsSalary: view.budget.usualSalaryMinor !== null || view.budget.paydayReminder,
      today: viewToday,
      periodStart: view.current.period.start,
      activationPeriodStart: view.budget.activationPeriodStart,
      activatedOn: view.budget.activatedOn,
      incomeCount: income.count,
    });
    return [
      {
        currency: budget.currency,
        bills: due.items,
        payday: {
          rule: view.paydayRule,
          currentPeriodStart: view.current.period.start,
          // Without the payday reminder only a "Not yet" retry is planned (count 0 skips the regular ones).
          count: view.budget.paydayReminder ? UPCOMING_PAYDAYS : 0,
          pending: status.pending,
          snoozedOn: prefs.paydaySnoozedOn[budget.currency] ?? null,
        },
      },
    ];
  });

  return {
    loaded: true,
    today,
    sources,
    wanted: sources.some((source) => source.bills.length > 0 || source.payday.count > 0),
  };
}
