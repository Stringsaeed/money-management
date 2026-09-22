import { useState } from "react";
import {
  useAccountsQuery,
  useCategoriesQuery,
  useRecurringQuery,
  useTransactionsQuery,
  useUpcomingQuery,
} from "@/data/ledger-queries";
import { useSession } from "@/features/auth/use-session";
import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { buildHomeOverview } from "./home-model";
import type { HomeOverviewRange } from "./home-model-types";
import {
  homeIdentity,
  homeSelection,
  recentHomeActivity,
  upcomingHomeActivity,
} from "./home-display";

export function useHomeData() {
  const session = useSession();
  const { scope } = useLedgerScope();
  const accounts = useAccountsQuery();
  const transactions = useTransactionsQuery();
  const categories = useCategoriesQuery();
  const recurring = useRecurringQuery();
  const upcoming = useUpcomingQuery();
  const [range, setRange] = useState<HomeOverviewRange>("month");
  const [selectedCurrency, setSelectedCurrency] = useState<string>();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [mode, setMode] = useState<"line" | "bar">("line");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { currencies, currency, accountId, accountIds, accountLabel } = homeSelection(
    accounts.data,
    selectedCurrency,
    selectedAccount,
  );
  const overview = buildHomeOverview({
    accounts: accounts.data,
    transactions: transactions.data,
    currency,
    range,
    accountId,
  });
  const recent = recentHomeActivity(
    transactions.data,
    currency,
    overview.startDate,
    overview.endDate,
    accountIds,
  );
  const upcomingItems = upcomingHomeActivity(upcoming.data, recurring.data, currency, accountId);
  const { name, seed } = homeIdentity(session.principal);
  return {
    name,
    seed,
    scope,
    overview,
    accounts,
    currencies,
    currency,
    categories: categories.data,
    upcoming: upcomingItems,
    upcomingError: upcoming.isError || recurring.isError,
    upcomingLoading: upcoming.isLoading || recurring.isLoading,
    recent,
    range,
    mode,
    setMode,
    setRange,
    accountId,
    accountLabel,
    filtersOpen,
    setFiltersOpen,
    isLoading: accounts.isLoading || transactions.isLoading,
    isError: accounts.isError || transactions.isError,
    setCurrency: (value: string) => {
      setSelectedCurrency(value);
      setSelectedAccount(null);
    },
    setAccount: setSelectedAccount,
    retry: async () => {
      await Promise.all([
        accounts.retry(),
        transactions.retry(),
        categories.retry(),
        recurring.retry(),
        upcoming.retry(),
      ]);
    },
  };
}
