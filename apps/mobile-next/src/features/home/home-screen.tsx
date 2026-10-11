import { useState } from "react";
import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Banner, colors, layout, Screen } from "@/ui/trove";

import { HomeBody } from "./home-body";
import { HomeEmptyHeader } from "./home-empty-header";
import { HomeHeader } from "./home-header";
import { useHomeData } from "./use-home-data";

/** Board spacing: 11pt under the status bar, 18pt between sections. */
const TOP_GAP = 11;
const SECTION_GAP = 18;
/** The empty board sits 4pt lower and breathes 22pt between sections. */
const EMPTY_TOP_SHIFT = 4;
const EMPTY_SECTION_GAP = 22;
/** Part of the gap under the pinned header that stays fixed while the content scrolls. */
const HEADER_FOOT = 8;
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
      <View style={[styles.header, empty ? styles.headerEmpty : null]}>
        {empty ? (
          <HomeEmptyHeader now={home.now} onOpenDue={openDue} />
        ) : (
          <HomeHeader
            dueThisWeek={home.isLoading ? 0 : home.dueThisWeek}
            household={home.household}
            initials={home.initials}
            now={home.now}
            onOpenDue={openDue}
            onOpenScope={home.openScope}
            title={home.title}
          />
        )}
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          empty ? styles.contentEmpty : null,
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
        style={styles.scroll}
      >
        {refreshError ? (
          <Banner message="Could not refresh. Pull down to try again." tone="negative" />
        ) : null}
        <HomeBody empty={empty} home={home} onOpenDue={openDue} onRetry={() => void refresh()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Pinned under the status bar; the board's 18pt (22pt when empty) to the first section is split
  // between the header's foot and the scroll's head, so content clips cleanly as it scrolls.
  header: {
    paddingBottom: HEADER_FOOT,
    paddingHorizontal: layout.screenGutter,
    paddingTop: TOP_GAP,
  },
  headerEmpty: { paddingTop: TOP_GAP + EMPTY_TOP_SHIFT },
  scroll: { flex: 1 },
  content: {
    gap: SECTION_GAP,
    paddingHorizontal: layout.screenGutter,
    paddingTop: SECTION_GAP - HEADER_FOOT,
  },
  contentEmpty: { paddingTop: EMPTY_SECTION_GAP - HEADER_FOOT },
});
