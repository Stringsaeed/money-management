import { Redirect } from "expo-router";
import { ScrollView } from "react-native";

import { HomeListHeader } from "@/components/home/home-list-header";
import { RecentJournalSection } from "@/components/home/recent-journal-section";
import { useHomeScreen } from "@/hooks/use-home-screen";

export default function HomeScreen() {
  const {
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccountId,
    accounts,
    resetFilters,
  } = useHomeScreen({ limit: 10 });

  const showAccount = activeAccountId === null;

  if (!loadingAccounts && accounts.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pt-safe-offset-20 pb-safe-offset-32"
    >
      <HomeListHeader />
      <RecentJournalSection
        activeFilterCount={activeFilterCount}
        currency={currency}
        groups={groups}
        isLoading={loadingTx}
        onResetFilters={resetFilters}
        showAccount={showAccount}
      />
    </ScrollView>
  );
}
