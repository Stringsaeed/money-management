import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import {
  useBudgetWorkspaceSelection,
  useSelectBudgetWorkspace,
} from "@/hooks/use-budget-workspaces";
import { cn } from "@/lib/utils";

export function BudgetWorkspaceScreen() {
  const selection = useBudgetWorkspaceSelection();
  const selectWorkspace = useSelectBudgetWorkspace();

  if (selection.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface pt-safe">
        <ActivityIndicator accessibilityLabel="Loading currency workspaces" />
      </View>
    );
  }

  if (selection.error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-surface px-5 pt-safe">
        <Text className="font-body-semibold text-ink">Currency workspaces are unavailable</Text>
        <Text className="text-center font-body-normal text-sm text-ink/60">
          Your Funding Pools could not be loaded. Return to Envelopes and try again.
        </Text>
      </View>
    );
  }

  const workspaceSelection = selection.data;
  if (!workspaceSelection || workspaceSelection.workspaces.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-surface px-5 pt-safe">
        <Text className="font-body-semibold text-ink">No currency workspace yet</Text>
        <Text className="text-center font-body-normal text-sm text-ink/60">
          Confirm Envelopes setup before choosing a Funding Pool.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface pt-safe-offset-20"
      contentContainerClassName="gap-4 px-5 pb-safe-offset-24"
      contentInsetAdjustmentBehavior="automatic"
    >
      <Animated.View entering={FadeIn} exiting={FadeOut} className="gap-2">
        <Text className="font-heading-medium text-2xl italic text-ink">Currency workspace</Text>
        <Text className="font-body-normal text-sm text-ink/60">
          Each Funding Pool stays exact and independent. Choose which currency to plan.
        </Text>
      </Animated.View>

      <View accessibilityRole="radiogroup" className="gap-2">
        {workspaceSelection.workspaces.map(({ currency }) => {
          const selected = currency === workspaceSelection.selectedCurrency;
          return (
            <Pressable
              key={currency}
              accessibilityLabel={`${currency} currency workspace`}
              accessibilityRole="radio"
              accessibilityState={{ disabled: selectWorkspace.isPending, selected }}
              className={cn(
                "min-h-14 flex-row items-center justify-between rounded-xl border px-4 py-3 active:bg-surface-dim",
                selected ? "border-ink bg-surface-container" : "border-ledger-outline bg-surface",
              )}
              disabled={selectWorkspace.isPending}
              onPress={() => {
                if (!selected) selectWorkspace.mutate({ currency });
              }}
            >
              <Text className="font-body-semibold text-base text-ink">{currency}</Text>
              {selected ? (
                <Text className="font-body-medium text-xs text-ink">Selected ✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
