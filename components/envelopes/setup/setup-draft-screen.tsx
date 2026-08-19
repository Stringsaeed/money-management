import { ScrollView, View } from "react-native";

import { SetupDraftPlan } from "@/components/envelopes/setup/setup-draft-plan";
import { SetupIntroduction } from "@/components/envelopes/setup/setup-introduction";
import { WorkspaceRouteStatus } from "@/components/envelopes/workspace-route-status";
import { Text } from "@/components/ui/text";
import { useSetupDraft } from "@/hooks/use-setup-draft";

export const SetupDraftScreen = () => {
  const setup = useSetupDraft();

  if (setup.isLoading) {
    return <WorkspaceRouteStatus loadingLabel="Loading Setup Draft" />;
  }
  if (setup.error || !setup.data) {
    return (
      <WorkspaceRouteStatus
        title="Setup Draft is unavailable"
        message="Your saved plan could not be loaded. Return to Envelopes and try again."
      />
    );
  }

  return (
    <View className="flex-1 bg-surface safe-bottom">
      <ScrollView
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
            onDiscard={setup.discard}
            onMerge={setup.mergeFirstSuggestions}
            onMoveCategory={setup.moveCategory}
            onToggleFundingAccount={setup.toggleFundingAccount}
            onUpdateEnvelope={setup.updateEnvelope}
          />
        ) : (
          <SetupIntroduction
            prerequisites={setup.data.prerequisites}
            isSaving={setup.isSaving}
            onStartBlank={() => setup.start("blank")}
            onStartSuggested={() => setup.start("suggested")}
          />
        )}
        {setup.actionError ? (
          <Text selectable className="font-body-medium text-sm text-destructive">
            {setup.actionError}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};
