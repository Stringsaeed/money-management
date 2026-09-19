import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityDateRangeFilter } from "@/components/activity/activity-date-range-filter";
import { ActivityDetailSheet } from "@/components/activity/activity-detail-sheet";
import { ActivityEntryRow } from "@/components/activity/activity-entry-row";
import { ActivityUserFilter } from "@/components/activity/activity-user-filter";
import { Text } from "@/components/ui/text";
import { useActivity, type ActivityEntry } from "@/hooks/use-activity";
import { useActiveHousehold, useHouseholdDetail } from "@/hooks/use-households";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import { resolveActivityRange, type ActivityRangeKey } from "@/utils/activity";

const PAGE_SIZE = 50;

const EntrySeparator = () => <View style={styles.separator} />;

function ActivityEmptyState() {
  return (
    <Animated.View entering={FadeIn} style={styles.empty}>
      <Text style={styles.emptyEmoji}>📜</Text>
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptyMessage}>
        Changes made by you or your household will appear here.
      </Text>
    </Animated.View>
  );
}

function ActivityLoadMore({ onPress }: { onPress: () => void }) {
  return (
    <Text
      accessibilityRole="button"
      accessibilityLabel="Load more activity"
      onPress={onPress}
      style={styles.loadMore}
    >
      Load more ↓
    </Text>
  );
}

interface ActivityTimelineProps {
  readonly householdId: string | null;
}

function ActivityTimeline({ householdId }: ActivityTimelineProps) {
  const insets = useSafeAreaInsets();
  const { data: householdDetail } = useHouseholdDetail(householdId);

  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<ActivityRangeKey>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selectedEntry, setSelectedEntry] = useState<ActivityEntry | null>(null);

  const range = resolveActivityRange(rangeKey);
  const filters = userFilter ? { userId: userFilter, ...range } : range;
  const query = useActivity(householdId, filters, limit);

  const changes = query.data?.changes ?? [];
  const hasMore = query.data?.hasMore ?? false;
  const members = (householdDetail?.members ?? []).map((member) => ({
    userId: member.userId,
    userName: member.userName,
  }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={changes}
        keyExtractor={(entry) => String(entry.seq)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[16] },
        ]}
        ListHeaderComponent={
          <View style={styles.filters}>
            <ActivityUserFilter members={members} value={userFilter} onChange={setUserFilter} />
            <ActivityDateRangeFilter value={rangeKey} onChange={setRangeKey} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <ActivityEntryRow entry={item} onPress={setSelectedEntry} />
          </View>
        )}
        ItemSeparatorComponent={EntrySeparator}
        ListEmptyComponent={query.isPending ? null : <ActivityEmptyState />}
        ListFooterComponent={
          hasMore ? (
            <ActivityLoadMore onPress={() => setLimit((current) => current + PAGE_SIZE)} />
          ) : null
        }
      />

      <ActivityDetailSheet entry={selectedEntry} onDismiss={() => setSelectedEntry(null)} />
    </View>
  );
}

/**
 * Household activity timeline (#95): every committed household change,
 * newest-first, with member and date-range filters and tap-for-details.
 */
export default function ActivityScreen() {
  const { activeHousehold } = useActiveHousehold();
  return <ActivityTimeline householdId={activeHousehold?.householdId ?? null} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingTop: spacing[2],
    paddingHorizontal: spacing[5],
    gap: spacing[2],
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  entryCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.ledgerOutline,
    marginHorizontal: spacing[4],
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[8],
    gap: spacing[2],
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
  },
  emptyEmoji: {
    fontSize: typography.text4xl,
    marginBottom: spacing[1],
  },
  emptyTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontStyle: "italic",
    fontSize: typography.textLg,
    color: colors.ink,
  },
  emptyMessage: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
    textAlign: "center",
  },
  loadMore: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
    textAlign: "center",
    paddingVertical: spacing[4],
  },
});
