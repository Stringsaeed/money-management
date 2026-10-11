import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

import { ledgerClient } from "@/data/ledger-client";
import { scopeKey } from "@/data/ledger-collections";
import {
  useAccountsQuery,
  useBudgetQuery,
  useCategoriesQuery,
  useLedgerData,
  useRecurringQuery,
  useSelectedBudget,
  useTransactionsQuery,
  useUpcomingQuery,
} from "@/data/ledger-queries";
import { useSession } from "@/features/auth/use-session";
import { useBudgetingEnabled } from "@/features/feature-flags";
import { useLedgerScope } from "@/navigation/ledger-scope-context";

import { activeBudgetOf, homeBudget } from "./home-budget";
import type { HomeChartView } from "./home-chart-view";
import { homeCurrency, homeGreeting, homeIdentity } from "./home-display";
import { homeChartWindow, homeSummary } from "./home-summary";
import { homeUpcoming } from "./home-upcoming-model";

const EMPTY_BUCKETS = { openingBalanceMinor: 0, buckets: [] } as const;

interface QueryState {
  readonly isLoading: boolean;
  readonly isError: boolean;
}

/** Home waits on accounts and the chart, and on the budget only while Budgeting is on. */
function loadState(input: {
  readonly accounts: QueryState;
  readonly overview: QueryState;
  readonly budget: QueryState;
  readonly budgeting: boolean;
}) {
  const { accounts, overview, budget, budgeting } = input;
  return {
    isLoading: accounts.isLoading || overview.isLoading || (budgeting && budget.isLoading),
    isError: accounts.isError || overview.isError,
  };
}

export function useHomeData() {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const session = useSession();
  const { scope, setScopeSheetOpen } = useLedgerScope();
  const ledger = useLedgerData();
  const budgeting = useBudgetingEnabled();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const recurring = useRecurringQuery();
  const upcoming = useUpcomingQuery();
  const selectedBudget = useSelectedBudget();
  const budget = useBudgetQuery();
  const [chartView, setChartView] = useState<HomeChartView>("bar");

  const activeBudget = activeBudgetOf(budgeting, budget.data);
  const currency = homeCurrency(accounts.data, activeBudget ? selectedBudget.currency : null);
  const chartWindow = homeChartWindow(now);
  const overview = useQuery({
    queryKey: [
      "v2",
      "home",
      scopeKey(ledger.identityKey, ledger.scope),
      "months",
      currency,
      chartWindow.from,
      chartWindow.to,
    ],
    queryFn: () =>
      ledgerClient.homeOverview(ledger.scope, { range: "year", currency, ...chartWindow }),
    enabled: !accounts.isLoading,
    staleTime: 15_000,
    retry: 1,
  });
  const summary = homeSummary(overview.data ?? EMPTY_BUCKETS, now);
  const expenses = useTransactionsQuery({
    kind: "expense",
    fromDate: activeBudget?.current.period.start ?? today,
    toDate: today,
  });
  const upcomingView = homeUpcoming({
    occurrences: upcoming.data,
    rules: recurring.data,
    categories: categories.data,
    currency,
    today,
    budget: activeBudget,
  });
  const { name, initials } = homeIdentity(session.principal);

  return {
    now,
    title: `${homeGreeting(now.getHours())}, ${name}`,
    initials,
    household: scope.kind === "household",
    openScope: () => setScopeSheetOpen(true),
    currency,
    netWorth: summary.netWorth,
    months: summary.months,
    budget: homeBudget({
      budgeting,
      view: budget.data,
      failed: budget.isError,
      currency: selectedBudget.currency ?? currency,
      expenses: expenses.data,
      today,
    }),
    upcoming: upcomingView.items,
    upcomingLoading: upcoming.isLoading || recurring.isLoading,
    upcomingError: upcoming.isError || recurring.isError,
    dueThisWeek: upcomingView.dueThisWeek,
    chartView,
    setChartView,
    hasAccounts: accounts.data.some((account) => !account.archived),
    ...loadState({ accounts, overview, budget, budgeting }),
    retry: async () => {
      await Promise.all([
        accounts.retry(),
        overview.refetch(),
        categories.retry(),
        recurring.retry(),
        upcoming.retry(),
        budget.retry(),
      ]);
    },
  };
}

export type HomeData = ReturnType<typeof useHomeData>;
