import { View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { styles } from "@/components/envelopes/styles";
import { SetupDraftPlan } from "@/components/envelopes/setup/setup-draft-plan";
import { SetupDraftRouteStatus } from "@/components/envelopes/setup/setup-draft-route-status";
import { SetupIntroduction } from "@/components/envelopes/setup/setup-introduction";
import { Text } from "@/components/ui/text";
import { spacing } from "@/lib/design-tokens";
import { useSetupDraft } from "@/hooks/use-setup-draft";

export const SetupDraftScreen = () => {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.screenFlex1, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screenFlex1}
        contentContainerStyle={[
          styles.scrollContentGap4,
          { paddingBottom: insets.bottom + spacing[2], paddingTop: spacing[4] },
        ]}
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
            <Text selectable style={styles.textDestructive}>
              {setup.actionError}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.ScrollView>
    </View>
  );
};
