import { router } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { today } from "@/utils/date";
import { useTransactions } from "@/hooks/use-transactions";

import { UpcomingRecurringRow } from "@/components/home/upcoming-recurring-row";

export function UpcomingRecurringSection() {
  const todayString = today();
  const {
    data: upcoming = [],
    isError,
    isLoading,
  } = useTransactions({
    isRecurring: true,
    startsOnOrAfter: todayString,
    sort: "asc",
    limit: 3,
  });

  return (
    <Animated.View
      className="mx-5 mt-5 overflow-hidden rounded-lg border border-ledger-outline bg-surface shadow-sm shadow-black/5"
      layout={layoutTransition}
    >
      <View className="flex-row items-center justify-between border-b border-ledger-outline px-4 py-3">
        <Text className="font-heading-normal text-xl italic text-ink">Upcoming payments</Text>
        <Pressable
          accessibilityLabel="View all recurring payments"
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
            Open recurring payments to try loading them again.
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
              Add subscriptions or recurring payments to see what’s next.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Add a recurring payment"
            accessibilityRole="button"
            className="px-1 py-2 active:opacity-50"
            onPress={() =>
              router.push({
                pathname: "/transaction/[id]",
                params: { id: "new", recurring: "true" },
              })
            }
          >
            <Text className="font-body-semibold text-xs text-ink">Add →</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          className="overflow-hidden bg-surface-container/40"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          {upcoming.map((transaction, index) => (
            <Animated.View key={transaction.id} layout={layoutTransition}>
              <UpcomingRecurringRow
                transaction={transaction}
                today={todayString}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
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
