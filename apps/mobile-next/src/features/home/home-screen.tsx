import { useState } from "react";
import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Banner, colors, EmptyState, layout, Screen } from "@/ui/trove";

import { HomeContent } from "./home-content";
import { HomeEmpty } from "./home-empty";
import { HomeHeader } from "./home-header";
import { HomeSkeleton } from "./home-skeleton";
import { useHomeData } from "./use-home-data";

/** Board spacing: 11pt under the status bar, 18pt between sections. */
const TOP_GAP = 11;
const SECTION_GAP = 18;
/** The floating tab bar plus the board's breathing room above it, over the bottom inset. */
const TAB_BAR_CLEARANCE = 96;

export function HomeScreen() {
  const home = useHomeData();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const budgetActive = home.budget.kind === "active";
  const openDue = () => router.push(budgetActive ? "/budget/due" : "/recurring");
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
  const empty = !home.isLoading && !home.isError && !home.hasAccounts;

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
        refreshControl={
          <RefreshControl
            onRefresh={() => void refresh()}
            refreshing={refreshing}
            tintColor={colors.accent.fill}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {empty ? (
          <HomeEmpty
            currency={home.currency}
            now={home.now}
            onAddAccount={() => router.push("/accounts/new")}
            onOpenDue={openDue}
            onSetUpCategories={() => router.push("/categories/new")}
          />
        ) : (
          <>
            <HomeHeader
              dueThisWeek={home.isLoading ? 0 : home.dueThisWeek}
              household={home.household}
              initials={home.initials}
              now={home.now}
              onOpenDue={openDue}
              onOpenScope={home.openScope}
              title={home.title}
            />
            {refreshError ? (
              <Banner message="Could not refresh. Pull down to try again." tone="negative" />
            ) : null}
            {home.isLoading ? (
              <HomeSkeleton />
            ) : home.isError ? (
              <EmptyState
                actionLabel="Try again"
                icon="warning"
                message="Check your connection and try again."
                onAction={() => void refresh()}
                title="Your overview is unavailable"
              />
            ) : (
              <HomeContent home={home} onOpenDue={openDue} />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: SECTION_GAP, paddingHorizontal: layout.screenGutter, paddingTop: TOP_GAP },
});
