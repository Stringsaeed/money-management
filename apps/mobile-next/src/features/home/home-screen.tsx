import { useState } from "react";
import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { Banner, colors, EmptyState, layout, radius, Screen, Skeleton, space } from "@/ui/trove";

import { useHomeData } from "./use-home-data";
import { HomeHeader } from "./home-header";
import { HomeOverviewCard } from "./home-overview-card";
import { HomeActivity } from "./home-activity";
import { HomeBudgetPreview } from "./home-budget-preview";
import { HomeUpcoming } from "./home-upcoming";
import { HomeFilters } from "./home-filters";

export function HomeScreen() {
  const home = useHomeData();
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
    <Screen edges={["top"]}>
      <HomeHeader
        name={home.name}
        initials={home.initials}
        household={home.scope.kind === "household"}
        onOpenFilters={() => home.setFiltersOpen(true)}
        onOpenProfile={() => router.push("/(tabs)/settings")}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.accent.fill}
          />
        }
      >
        {home.isLoading ? (
          <View
            accessibilityLabel="Gathering your ledger"
            accessibilityState={{ busy: true }}
            style={styles.sections}
          >
            <Skeleton borderRadius={radius.lg} height={120} />
            <Skeleton borderRadius={radius.lg} height={200} />
            <Skeleton borderRadius={radius.lg} height={240} />
          </View>
        ) : home.isError ? (
          <EmptyState
            title="Your overview is unavailable"
            message="Check your connection and try again."
            icon="warning"
            actionLabel="Try again"
            onAction={() => void refresh()}
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
              <Banner tone="negative" message="Could not refresh. Pull down to try again." />
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
              <EmptyState
                title="No accounts yet"
                message="Add an account to start your overview."
                icon="accounts"
                actionLabel="Add account"
                onAction={() => router.push("/accounts/new")}
              />
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
    </Screen>
  );
}

// Clearance for the floating tab bar.
const TAB_BAR_CLEARANCE = 140;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[4],
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: space[4],
  },
  sections: { gap: layout.sectionGap },
});
