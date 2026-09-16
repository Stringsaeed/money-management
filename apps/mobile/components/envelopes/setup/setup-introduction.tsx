import { View } from "react-native";

import { styles } from "@/components/envelopes/styles";
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
    <View style={styles.gap5}>
      <View style={styles.setupIntroCard}>
        <Text style={styles.heading2xlItalicInk}>Give your Money a job 🌱</Text>
        <Text selectable style={styles.setupIntroText}>
          Envelopes reserve Money you already hold in Funding Accounts. They never move Account
          balances, and this Setup Draft changes no active budget facts until you confirm it later.
        </Text>
      </View>
      {missingAccount ? <SetupPrerequisiteCard kind="account" /> : null}
      {missingCategory ? <SetupPrerequisiteCard kind="category" /> : null}
      <View style={styles.gap2}>
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
