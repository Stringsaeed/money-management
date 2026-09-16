import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { rawColorValues } from "@/lib/design-tokens";
import { buildJournalList } from "@/utils/journal-list";

import { HomeEmptyState } from "@/components/home/home-empty-state";
import { JournalListItemRow } from "@/components/home/journal-list-item-row";
import type { RecentJournalSectionProps } from "@/components/home/types";
import { styles, lightStyles } from "./styles";

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

  const iconTint = colorScheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;

  return (
    <Animated.View style={styles.recentJournalCard} layout={layoutTransition}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <SymbolView name="newspaper" size={18} tintColor={iconTint} />
          <Text style={styles.sectionTitle}>Recent Journal</Text>
        </View>
        <Pressable
          accessibilityLabel="View all recent transactions"
          accessibilityRole="button"
          onPress={() => router.push("/ledger")}
          style={({ pressed }) => [styles.viewAllButton, pressed && lightStyles.viewAllPressed]}
        >
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.loadingWrap}
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
