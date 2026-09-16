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
import { rawColorValues } from "@/lib/design-tokens";
import { today } from "@/utils/date";

import { styles, lightStyles } from "./styles";

export function UpcomingRecurringSection() {
  const colorScheme = useColorScheme();
  const todayString = today();
  const { data: accounts = [], isLoading: isAccountsLoading } = useAccounts();
  const { data: upcoming = [], isError, isLoading } = useUpcomingRecurringRules(3);
  const hasAccounts = accounts.length > 0;
  const addAction = resolveUpcomingAddAction(isAccountsLoading, hasAccounts);

  const iconTint = colorScheme === "dark" ? rawColorValues.dark.ink : rawColorValues.light.ink;

  function handleAddPress() {
    if (addAction.href) router.push(addAction.href);
  }

  return (
    <Animated.View style={styles.upcomingCard} layout={layoutTransition}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <SymbolView name="repeat" size={18} tintColor={iconTint} />
          <Text style={styles.sectionTitle}>Upcoming payments</Text>
        </View>
        <Pressable
          accessibilityLabel="View all recurring rules"
          accessibilityRole="button"
          onPress={() => router.push("/recurring")}
          style={({ pressed }) => [styles.viewAllButton, pressed && lightStyles.viewAllPressed]}
        >
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.loadingWrapShort}
        >
          <ActivityIndicator />
        </Animated.View>
      ) : isError ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
          style={styles.errorUpcomingWrap}
        >
          <Text style={styles.errorUpcomingTitle}>Upcoming payments unavailable</Text>
          <Text style={styles.errorUpcomingSubtitle}>
            Open Recurring Rules to try loading them again.
          </Text>
        </Animated.View>
      ) : upcoming.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
          style={styles.emptyUpcomingWrap}
        >
          <Text style={styles.emptyUpcomingEmoji}>🌱</Text>
          <View style={styles.emptyUpcomingContent}>
            <Text style={styles.emptyUpcomingTitle}>Nothing scheduled yet</Text>
            <Text style={styles.emptyUpcomingSubtitle}>
              Add a Recurring Rule to see what&apos;s next.
            </Text>
          </View>
          <Pressable
            accessibilityLabel={addAction.accessibilityLabel}
            accessibilityRole="button"
            disabled={!addAction.href}
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.emptyUpcomingAddButton,
              pressed && lightStyles.viewAllPressed,
              !addAction.href && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.emptyUpcomingAddText}>{addAction.buttonLabel}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
          style={styles.upcomingListWrap}
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
              {index < upcoming.length - 1 ? <View style={styles.upcomingDivider} /> : null}
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}
