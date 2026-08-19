import { View } from "react-native";

import { SetupPrerequisiteCard } from "@/components/envelopes/setup/setup-prerequisite-card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { SetupDraftPrerequisites } from "@/modules/budgeting/budgeting";

interface SetupIntroductionProps {
  prerequisites: SetupDraftPrerequisites;
  isSaving: boolean;
  onStartBlank: VoidFunction;
  onStartSuggested: VoidFunction;
}

export const SetupIntroduction = ({
  prerequisites,
  isSaving,
  onStartBlank,
  onStartSuggested,
}: SetupIntroductionProps) => {
  const missingAccount = prerequisites.fundingAccounts.length === 0;
  const missingCategory = prerequisites.categories.length === 0;
  return (
    <View className="gap-5">
      <View className="gap-2 rounded-3xl bg-surface-container p-5">
        <Text className="font-heading-normal text-2xl italic text-ink">
          Give your Money a job 🌱
        </Text>
        <Text selectable className="font-body-normal leading-6 text-ink/60">
          Envelopes reserve Money you already hold in Funding Accounts. They never move Account
          balances, and this Setup Draft changes no active budget facts until you confirm it later.
        </Text>
      </View>
      {missingAccount ? <SetupPrerequisiteCard kind="account" /> : null}
      {missingCategory ? <SetupPrerequisiteCard kind="category" /> : null}
      <View className="gap-2">
        <Button
          accessibilityLabel="Use Category suggestions"
          disabled={missingAccount || missingCategory || isSaving}
          onPress={onStartSuggested}
          size="lg"
        >
          <Text>Use Category suggestions</Text>
        </Button>
        <Button
          accessibilityLabel="Start with a blank plan"
          disabled={missingAccount || isSaving}
          onPress={onStartBlank}
          size="lg"
          variant="outline"
        >
          <Text>Start with a blank plan</Text>
        </Button>
      </View>
    </View>
  );
};
