import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ledgerClient } from "@/data/ledger-client";
import {
  useLedgerData,
  useAccountsQuery,
  useCategoriesQuery,
  useRecurringQuery,
  useUpcomingQuery,
} from "@/data/ledger-queries";
import { scopeKey } from "@/data/ledger-collections";
import { useSession } from "@/features/auth/use-session";
import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { homeRangeDates, overviewFromBuckets } from "./home-model";
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
  const ledger = useLedgerData();
  const accounts = useAccountsQuery();
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
  const dates = homeRangeDates(range);
  const home = useQuery({
    queryKey: [
      "v2",
      "home",
      scopeKey(ledger.identityKey, ledger.scope),
      "recent",
      currency,
      accountId,
      dates.from,
      dates.to,
      [...accountIds].sort(),
    ],
    queryFn: () =>
      ledgerClient.home(ledger.scope, {
        currency,
        accountIds: [...accountIds],
        from: dates.from,
        to: dates.to,
      }),
    enabled: !accounts.isLoading,
    staleTime: 15_000,
    retry: 1,
  });
  const chart = useQuery({
    queryKey: [
      "v2",
      "home",
      scopeKey(ledger.identityKey, ledger.scope),
      "overview",
      range,
      currency,
      accountId,
      dates.from,
      dates.to,
    ],
    queryFn: () =>
      ledgerClient.homeOverview(ledger.scope, {
        range,
        currency,
        accountId: accountId ?? undefined,
        from: dates.from,
        to: dates.to,
      }),
    staleTime: 15_000,
    retry: 1,
  });
  const overview = overviewFromBuckets(
    chart.data ?? { openingBalanceMinor: 0, buckets: [] },
    currency,
    range,
  );
  const recent = recentHomeActivity(
    home.data?.recentTransactions ?? [],
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
    isLoading: accounts.isLoading || home.isLoading || chart.isLoading,
    isError: accounts.isError || home.isError || chart.isError,
    setCurrency: (value: string) => {
      setSelectedCurrency(value);
      setSelectedAccount(null);
    },
    setAccount: setSelectedAccount,
    retry: async () => {
      await Promise.all([
        accounts.retry(),
        home.refetch(),
        chart.refetch(),
        categories.retry(),
        recurring.retry(),
        upcoming.retry(),
      ]);
    },
  };
}
