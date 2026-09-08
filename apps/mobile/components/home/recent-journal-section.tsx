import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { buildJournalList } from "@/utils/journal-list";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { JournalListItemRow } from "@/components/home/journal-list-item-row";
import type { RecentJournalSectionProps } from "@/components/home/types";

export function RecentJournalSection({
  activeFilterCount,
  currency,
  groups,
  isLoading,
  onResetFilters,
  showAccount,
}: RecentJournalSectionProps) {
  const colorScheme = useColorScheme();
  const items = buildJournalList(groups, currency, showAccount);

  return (
    <Animated.View
      className="mx-5 mt-4 overflow-hidden rounded-lg border border-ledger-outline bg-surface shadow-sm shadow-black/5"
      layout={layoutTransition}
    >
      <View className="flex-row items-center justify-between border-b border-ledger-outline px-4 py-3">
        <View className="flex-row flex-1 items-center gap-2">
          <SymbolView
            name="newspaper"
            size={18}
            tintColor={colorScheme === "dark" ? "#D6E8DC" : "#1C1B1A"}
          />
          <Text className="font-heading-normal text-xl italic text-ink">Recent Journal</Text>
        </View>
        <Pressable
          accessibilityLabel="View all recent transactions"
          accessibilityRole="button"
          className="px-1 py-1 active:opacity-50"
          onPress={() => router.push("/ledger")}
        >
          <Text className="font-body-semibold text-xs text-ink/50">View all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Animated.View
          className="h-24 items-center justify-center"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <ActivityIndicator />
        </Animated.View>
      ) : items.length === 0 ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <HomeEmptyState
            activeFilterCount={activeFilterCount}
            compact
            onResetFilters={onResetFilters}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          {items.map((item) => (
            <JournalListItemRow
              key={item.type === "section-header" ? `header-${item.date}` : item.data.id}
              item={item}
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}
