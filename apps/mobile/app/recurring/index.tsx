import { router, useLocalSearchParams } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { EmptyState } from "@/components/common/empty-state";
import { WateringCanGraphic } from "@/components/graphics/watering-can";
import { RecurringRuleRow } from "@/components/recurring/recurring-rule-row";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useRecurringRulesList } from "@/hooks/use-recurring-rules";
import { cn } from "@/lib/utils";

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

  return (
    <View className="flex-1 bg-surface pt-safe-offset-20 safe-bottom">
      <View className="flex-row gap-2 px-5 py-3">
        {filters.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.value }}
            className={cn(
              "rounded-full px-3 py-2 active:bg-surface-dim",
              filter === item.value ? "bg-ink" : "bg-surface-container",
            )}
            onPress={() => setFilter(item.value)}
          >
            <Text
              className={cn(
                "font-body-semibold text-xs",
                filter === item.value ? "text-surface" : "text-ink/60",
              )}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-10" />
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
        <ScrollView contentContainerClassName="pb-safe-offset-24">
          <View className="gap-1 py-1">
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
