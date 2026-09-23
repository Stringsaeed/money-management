import { useState } from "react";
import { router } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { Text } from "@/ui/text";
import { EmptyState } from "@/ui/empty-state";
import { Button } from "@/ui/button";
import { colors, spacing } from "@/ui/design-tokens";
import { useReducedMotion } from "@/ui/motion";

import { useHomeData } from "./use-home-data";
import { HomeHeader } from "./home-header";
import { HomeOverviewCard } from "./home-overview-card";
import { HomeActivity } from "./home-activity";
import { HomeBudgetPreview } from "./home-budget-preview";
import { HomeUpcoming } from "./home-upcoming";
import { HomeFilters } from "./home-filters";

export function HomeScreen() {
  const home = useHomeData();
  const headerHeight = useHeaderHeight();
  const reducedMotion = useReducedMotion();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    setRefreshError(false);
    try {
      await home.retry();
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <>
      <HomeHeader
        name={home.name}
        seed={home.seed}
        onOpenFilters={() => home.setFiltersOpen(true)}
        onOpenProfile={() => router.push("/(tabs)/settings")}
      />
      <ScrollView
        style={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          Platform.OS === "android" && { paddingTop: headerHeight + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
            progressViewOffset={Platform.OS === "android" ? headerHeight : 0}
          />
        }
      >
        {home.isLoading ? (
          <Text style={styles.status}>Gathering your ledger…</Text>
        ) : home.isError ? (
          <EmptyState
            title="Your overview is unavailable"
            message="Check your connection and try again."
            onRetry={() => void refresh()}
          />
        ) : (
          <EaseView
            initialAnimate={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion
                ? { type: "none" }
                : { type: "timing", duration: 220, easing: "easeOut" }
            }
            style={styles.sections}
          >
            {refreshError ? (
              <Text style={styles.error}>Could not refresh. Pull down to try again.</Text>
            ) : null}
            <HomeOverviewCard
              overview={home.overview}
              mode={home.mode}
              range={home.range}
              accountLabel={home.accountLabel}
              onMode={home.setMode}
              onRange={home.setRange}
            />
            {home.accounts.data.length === 0 ? (
              <View style={styles.emptyAccount}>
                <Text>Add an account to start your overview.</Text>
                <Button title="Add account" onPress={() => router.push("/accounts/new")} />
              </View>
            ) : null}
            <HomeActivity
              transactions={home.recent}
              categories={home.categories}
              household={home.scope.kind === "household"}
              onOpen={(transaction) =>
                router.push({ pathname: "/transactions/[id]", params: { id: transaction.id } })
              }
              onViewAll={() => router.push("/(tabs)/ledger")}
            />
            <HomeBudgetPreview />
            <HomeUpcoming
              items={home.upcoming}
              loading={home.upcomingLoading}
              failed={home.upcomingError}
              onOpen={(id) => router.push({ pathname: "/recurring/[id]", params: { id } })}
              onViewAll={() => router.push("/recurring")}
            />
          </EaseView>
        )}
      </ScrollView>
      <HomeFilters
        open={home.filtersOpen}
        onDismiss={() => home.setFiltersOpen(false)}
        accounts={home.accounts.data}
        currencies={home.currencies}
        currency={home.currency}
        accountId={home.accountId}
        range={home.range}
        onRange={home.setRange}
        onCurrency={home.setCurrency}
        onAccount={home.setAccount}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: 140,
    gap: spacing[4],
  },
  sections: { gap: spacing[5] },
  status: { paddingVertical: spacing[8], color: colors.mutedForeground },
  error: { color: colors.destructive },
  emptyAccount: { gap: spacing[3] },
});
