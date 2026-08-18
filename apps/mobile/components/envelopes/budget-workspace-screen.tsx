import { ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { WorkspaceOption } from "@/components/envelopes/workspace-option";
import { WorkspaceRouteStatus } from "@/components/envelopes/workspace-route-status";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import {
  useBudgetWorkspaceSelection,
  useSelectBudgetWorkspace,
} from "@/hooks/use-budget-workspaces";

export const BudgetWorkspaceScreen = () => {
  const selection = useBudgetWorkspaceSelection();
  const selectWorkspace = useSelectBudgetWorkspace();

  if (selection.isLoading) {
    return <WorkspaceRouteStatus loadingLabel="Loading currency workspaces" />;
  }

  if (selection.error) {
    return (
      <WorkspaceRouteStatus
        title="Currency workspaces are unavailable"
        message="Your Funding Pools could not be loaded. Return to Envelopes and try again."
      />
    );
  }

  const workspaceSelection = selection.data;
  if (!workspaceSelection || workspaceSelection.workspaces.length === 0) {
    return (
      <WorkspaceRouteStatus
        title="No currency workspace yet"
        message="Confirm Envelopes setup before choosing a Funding Pool."
      />
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
        {workspaceSelection.workspaces.map(({ currency }) => (
          <WorkspaceOption
            key={currency}
            currency={currency}
            disabled={selectWorkspace.isPending}
            selected={currency === workspaceSelection.selectedCurrency}
            onSelect={selectWorkspace.mutate}
          />
        ))}
      </View>
      {selectWorkspace.error ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          entering={FadeIn}
          exiting={FadeOut}
          layout={layoutTransition}
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
        >
          <Text selectable className="font-body-medium text-sm text-destructive">
            Couldn&apos;t remember {selectWorkspace.variables?.currency ?? "that currency"}. Choose
            it again to retry.
          </Text>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
};
