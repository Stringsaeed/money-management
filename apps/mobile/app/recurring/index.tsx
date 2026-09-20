import { router, useLocalSearchParams } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/common/empty-state";
import { WateringCanGraphic } from "@/components/graphics/watering-can";
import { RecurringRuleRow } from "@/components/recurring/recurring-rule-row";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useRecurringRulesList } from "@/hooks/use-recurring-rules";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

const newRecurringRoute = {
  pathname: "/transaction/[id]" as const,
  params: { id: "new", recurring: "true" },
};

type RuleFilter = "current" | "archived" | "needs_attention";

const filters: { value: RuleFilter; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "archived", label: "Archived" },
];

export default function RecurringListScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<RuleFilter>(() => parseFilter(params.filter));
  const { data: rules = [], isLoading } = useRecurringRulesList(filter);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing[20], paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.filterRow}>
        {filters.map((item) => {
          const selected = filter === item.value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.filterChip,
                selected ? styles.filterChipSelected : styles.filterChipIdle,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterLabel,
                  selected ? styles.filterLabelSelected : styles.filterLabelIdle,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : rules.length === 0 ? (
        <EmptyState
          illustration={<WateringCanGraphic />}
          title={filter === "current" ? "No Recurring Rules" : `No ${filterLabel(filter)} Rules`}
          message={emptyMessage(filter)}
          action={
            filter === "current" ? (
              <Button onPress={() => router.push(newRecurringRoute)}>
                <Text>Add Recurring</Text>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[24] }}>
          <View style={styles.list}>
            {rules.map((rule) => (
              <Animated.View
                key={rule.id}
                entering={FadeIn}
                exiting={FadeOut}
                layout={layoutTransition}
              >
                <RecurringRuleRow
                  rule={rule}
                  onPress={() =>
                    router.push({
                      pathname: "/transaction/[id]",
                      params: { id: rule.id, recurring: "true" },
                    })
                  }
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      )}

      <Button
        accessibilityLabel="Add recurring rule"
        onPress={() => router.push(newRecurringRoute)}
        size="fab"
      >
        <Icon as={PlusIcon} size={24} />
      </Button>
    </View>
  );
}

function parseFilter(value: string | undefined): RuleFilter {
  if (value === "archived" || value === "needs_attention") return value;
  return "current";
}

function filterLabel(filter: RuleFilter): string {
  if (filter === "needs_attention") return "Needs-Attention";
  return filter === "archived" ? "Archived" : "Current";
}

function emptyMessage(filter: RuleFilter): string {
  if (filter === "needs_attention")
    return "Rules that need an Account or amount repair appear here.";
  if (filter === "archived") return "Archived Rules stay available for restoration and history.";
  return "Set up a Rule for rent, subscriptions, regular income, or transfers.";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  filterChip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  filterChipSelected: {
    backgroundColor: colors.ink,
  },
  filterChipIdle: {
    backgroundColor: colors.surfaceContainer,
  },
  filterChipPressed: {
    backgroundColor: colors.surfaceDim,
  },
  filterLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
  },
  filterLabelSelected: {
    color: colors.surface,
  },
  filterLabelIdle: {
    color: colors.ink,
    opacity: 0.6,
  },
  loader: {
    marginTop: spacing[10],
  },
  list: {
    gap: spacing[1],
    paddingVertical: spacing[1],
  },
});
