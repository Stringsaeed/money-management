import { Redirect } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeListHeader } from "@/components/home/home-list-header";
import { RecentJournalSection } from "@/components/home/recent-journal-section";
import { ONBOARDING_ENABLED } from "@/constants/onboarding";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { colors, spacing } from "@/lib/design-tokens";
import { useAccess } from "@/modules/access";

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    loadingAccounts,
    loadingTx,
    groups,
    currency,
    activeFilterCount,
    activeAccountId,
    hasAnyAccounts,
    loadingAllAccounts,
    resetFilters,
  } = useHomeScreen({ limit: 10 });
  const access = useAccess();

  const showAccount = activeAccountId === null;

  if (
    ONBOARDING_ENABLED &&
    !loadingAccounts &&
    !loadingAllAccounts &&
    !hasAnyAccounts &&
    access.kind !== "signed_in"
  ) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + spacing[5],
        paddingBottom: insets.bottom + spacing[8],
      }}
      style={styles.scroll}
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
