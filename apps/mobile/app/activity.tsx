import { useState } from "react";
import { FlatList, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ActivityDateRangeFilter } from "@/components/activity/activity-date-range-filter";
import { ActivityDetailSheet } from "@/components/activity/activity-detail-sheet";
import { ActivityEntryRow } from "@/components/activity/activity-entry-row";
import { ActivityUserFilter } from "@/components/activity/activity-user-filter";
import { Text } from "@/components/ui/text";
import { useActivity, type ActivityEntry } from "@/hooks/use-activity";
import { useActiveHousehold, useHouseholdDetail } from "@/hooks/use-households";
import { resolveActivityRange, type ActivityRangeKey } from "@/utils/activity";

const PAGE_SIZE = 50;

const EntrySeparator = () => <View className="h-px bg-ledger-outline mx-4" />;

/**
 * Household activity timeline (#95): every committed household change,
 * newest-first, with member and date-range filters and tap-for-details.
 */
export default function ActivityScreen() {
  const { activeHousehold } = useActiveHousehold();
  const householdId = activeHousehold?.householdId ?? null;
  const { data: householdDetail } = useHouseholdDetail(householdId);

  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<ActivityRangeKey>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selectedEntry, setSelectedEntry] = useState<ActivityEntry | null>(null);

  const range = resolveActivityRange(rangeKey);
  const query = useActivity(
    householdId,
    {
      ...(userFilter && { userId: userFilter }),
      ...range,
    },
    limit,
  );

  const changes = query.data?.changes ?? [];
  const hasMore = query.data?.hasMore ?? false;

  return (
    <View className="flex-1 bg-surface safe-bottom">
      <FlatList
        data={changes}
        keyExtractor={(entry) => String(entry.seq)}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-safe-offset-16 pt-2 px-5 gap-2"
        ListHeaderComponent={
          <View className="flex-row flex-wrap gap-2 mb-1">
            <ActivityUserFilter
              members={(householdDetail?.members ?? []).map((m) => ({
                userId: m.userId,
                userName: m.userName,
              }))}
              value={userFilter}
              onChange={setUserFilter}
            />
            <ActivityDateRangeFilter value={rangeKey} onChange={setRangeKey} />
          </View>
        }
        renderItem={({ item }) => (
          <View className="rounded-xl bg-surface-container">
            <ActivityEntryRow entry={item} onPress={setSelectedEntry} />
          </View>
        )}
        ItemSeparatorComponent={EntrySeparator}
        ListEmptyComponent={
          !query.isPending ? (
            <Animated.View
              entering={FadeIn}
              className="items-center py-16 px-8 gap-2 rounded-xl bg-surface-container"
            >
              <Text className="text-4xl mb-1">📜</Text>
              <Text className="font-heading-normal italic text-lg text-ink">No activity yet</Text>
              <Text className="font-body-normal text-sm text-ink/50 text-center">
                Changes made by you or your household will appear here.
              </Text>
            </Animated.View>
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <Text
              accessibilityRole="button"
              accessibilityLabel="Load more activity"
              onPress={() => setLimit((current) => current + PAGE_SIZE)}
              className="font-body-semibold text-sm text-ink/50 text-center py-4"
            >
              Load more ↓
            </Text>
          ) : null
        }
      />

      <ActivityDetailSheet entry={selectedEntry} onDismiss={() => setSelectedEntry(null)} />
    </View>
  );
}
