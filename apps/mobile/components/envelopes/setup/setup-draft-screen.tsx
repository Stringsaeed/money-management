import { View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { SetupDraftPlan } from "@/components/envelopes/setup/setup-draft-plan";
import { SetupDraftRouteStatus } from "@/components/envelopes/setup/setup-draft-route-status";
import { SetupIntroduction } from "@/components/envelopes/setup/setup-introduction";
import { Text } from "@/components/ui/text";
import { useSetupDraft } from "@/hooks/use-setup-draft";

export const SetupDraftScreen = () => {
  const setup = useSetupDraft();
  const handleStartBlank = () => setup.start("blank");
  const handleStartSuggested = () => setup.start("suggested");
  const handleRetry = () => setup.retry();

  if (setup.isLoading) {
    return <SetupDraftRouteStatus />;
  }
  if (setup.error || !setup.data?.prerequisites) {
    return (
      <SetupDraftRouteStatus
        actionError={setup.actionError}
        onDiscard={setup.errorIsUnreadable ? setup.discard : undefined}
        onRetry={setup.errorIsUnreadable ? undefined : handleRetry}
        status={setup.errorIsUnreadable ? "unreadable" : "unavailable"}
      />
    );
  }

  return (
    <View className="flex-1 bg-surface safe-top safe-bottom">
      <Animated.ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-5 pb-safe-offset-8 pt-4"
      >
        {setup.data.draft ? (
          <SetupDraftPlan
            categories={setup.data.prerequisites.categories}
            draft={setup.data.draft}
            fundingAccounts={setup.data.prerequisites.fundingAccounts}
            isSaving={setup.isSaving}
            onAddEnvelope={setup.addEnvelope}
            onDiscard={setup.discard}
            onMerge={setup.mergeSuggestions}
            onMoveCategory={setup.moveCategory}
            onRemoveCategory={setup.removeCategory}
            onToggleFundingAccount={setup.toggleFundingAccount}
            onToggleRollover={setup.toggleRollover}
            onUpdateEnvelope={setup.updateEnvelope}
          />
        ) : (
          <Animated.View
            key="introduction"
            entering={FadeIn}
            exiting={FadeOut}
            layout={LinearTransition}
          >
            <SetupIntroduction
              prerequisites={setup.data.prerequisites}
              isSaving={setup.isSaving}
              onStartBlank={handleStartBlank}
              onStartSuggested={handleStartSuggested}
            />
          </Animated.View>
        )}
        {setup.actionError ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <Text selectable className="font-body-medium text-sm text-destructive">
              {setup.actionError}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.ScrollView>
    </View>
  );
};
