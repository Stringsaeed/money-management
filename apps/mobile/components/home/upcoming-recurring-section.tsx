import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, useColorScheme, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { UpcomingRecurringRow } from "@/components/home/upcoming-recurring-row";
import { resolveUpcomingAddAction } from "@/components/home/upcoming-add-action";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { useUpcomingRecurringRules } from "@/hooks/use-recurring-rules";
import { today } from "@/utils/date";

export function UpcomingRecurringSection() {
  const colorScheme = useColorScheme();
  const todayString = today();
  const { data: accounts = [], isLoading: isAccountsLoading } = useAccounts();
  const { data: upcoming = [], isError, isLoading } = useUpcomingRecurringRules(3);
  const hasAccounts = accounts.length > 0;
  const addAction = resolveUpcomingAddAction(isAccountsLoading, hasAccounts);

  function handleAddPress() {
    if (addAction.href) router.push(addAction.href);
  }

  return (
    <Animated.View
      className="mx-5 mt-5 overflow-hidden rounded-lg border border-ledger-outline bg-surface shadow-sm shadow-black/5"
      layout={layoutTransition}
    >
      <View className="flex-row items-center justify-between border-b border-ledger-outline px-4 py-3">
        <View className="flex-row flex-1 items-center gap-2">
          <SymbolView
            name="repeat"
            size={18}
            tintColor={colorScheme === "dark" ? "#D6E8DC" : "#1C1B1A"}
          />
          <Text className="font-heading-normal text-xl italic text-ink">Upcoming payments</Text>
        </View>
        <Pressable
          accessibilityLabel="View all recurring rules"
          accessibilityRole="button"
          className="px-1 py-1 active:opacity-50"
          onPress={() => router.push("/recurring")}
        >
          <Text className="font-body-semibold text-xs text-ink/50">View all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Animated.View
          className="h-20 items-center justify-center"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <ActivityIndicator />
        </Animated.View>
      ) : isError ? (
        <Animated.View
          className="gap-1 bg-surface-container/40 px-4 py-4"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text className="font-body-medium text-sm text-ink">Upcoming payments unavailable</Text>
          <Text className="font-body-normal text-xs leading-5 text-ink/45">
            Open Recurring Rules to try loading them again.
          </Text>
        </Animated.View>
      ) : upcoming.length === 0 ? (
        <Animated.View
          className="flex-row items-center gap-3 bg-surface-container/40 px-4 py-3"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text className="text-xl">🌱</Text>
          <View className="flex-1">
            <Text className="font-body-medium text-sm text-ink">Nothing scheduled yet</Text>
            <Text className="font-body-normal text-xs leading-5 text-ink/45">
              Add a Recurring Rule to see what’s next.
            </Text>
          </View>
          <Pressable
            accessibilityLabel={addAction.accessibilityLabel}
            accessibilityRole="button"
            className="px-1 py-2 active:opacity-50 disabled:opacity-50"
            disabled={!addAction.href}
            onPress={handleAddPress}
          >
            <Text className="font-body-semibold text-xs text-ink">{addAction.buttonLabel}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          className="overflow-hidden bg-surface-container/40"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          {upcoming.map(({ rule, scheduledDate }, index) => (
            <Animated.View key={rule.id} layout={layoutTransition}>
              <UpcomingRecurringRow
                rule={rule}
                occurrenceDate={scheduledDate}
                today={todayString}
                onPress={() =>
                  router.push({
                    pathname: "/transaction/[id]",
                    params: { id: rule.id, recurring: "true" },
                  })
                }
              />
              {index < upcoming.length - 1 ? (
                <View className="ml-16 h-px bg-ledger-outline" />
              ) : null}
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}
