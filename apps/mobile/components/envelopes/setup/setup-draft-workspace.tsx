import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

import { styles } from "@/components/envelopes/styles";
import { SetupDraftEnvelopeItem } from "@/components/envelopes/setup/setup-draft-envelope-item";
import { SetupFundingAccountRow } from "@/components/envelopes/setup/setup-funding-account-row";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type {
  SetupDraftCategorySuggestion,
  SetupDraftEnvelope,
  SetupDraftFundingAccount,
  SetupDraftWorkspace,
} from "@/modules/budgeting/budgeting";

interface SetupDraftWorkspaceSectionProps {
  categories: readonly SetupDraftCategorySuggestion[];
  fundingAccounts: readonly SetupDraftFundingAccount[];
  isSaving: boolean;
  onAddEnvelope: (currency: string) => void;
  onMerge: (currency: string, envelopeIds: readonly string[]) => void;
  onMoveCategory: (currency: string, categoryId: string, envelopeId: string) => void;
  onRemoveCategory: (currency: string, envelopeId: string, categoryId: string) => void;
  onToggleFundingAccount: (currency: string, accountId: string) => void;
  onToggleRollover: (currency: string, envelopeId: string) => void;
  onUpdateEnvelope: (
    currency: string,
    envelopeId: string,
    changes: Partial<SetupDraftEnvelope>,
  ) => void;
  workspace: SetupDraftWorkspace;
}

export const SetupDraftWorkspaceSection = ({
  categories,
  fundingAccounts,
  isSaving,
  onAddEnvelope,
  onMerge,
  onMoveCategory,
  onRemoveCategory,
  onToggleFundingAccount,
  onToggleRollover,
  onUpdateEnvelope,
  workspace,
}: SetupDraftWorkspaceSectionProps) => {
  const [selectedEnvelopeIds, setSelectedEnvelopeIds] = useState<string[]>([]);
  const handleAdd = () => onAddEnvelope(workspace.currency);
  const handleMerge = () => {
    onMerge(workspace.currency, selectedEnvelopeIds);
    setSelectedEnvelopeIds([]);
  };
  const handleToggleFunding = (accountId: string) =>
    onToggleFundingAccount(workspace.currency, accountId);
  const handleToggleMergeSelection = (envelopeId: string) => {
    setSelectedEnvelopeIds((current) =>
      current.includes(envelopeId)
        ? current.filter((id) => id !== envelopeId)
        : [...current, envelopeId],
    );
  };
  const mergeTarget = workspace.envelopes.find(({ id }) => id === selectedEnvelopeIds[0]);

  return (
    <>
      <View style={styles.gap1}>
        <Text style={styles.workspaceTitle}>{workspace.currency} workspace</Text>
        <Text style={styles.workspaceSubtitle}>Choose Funding Accounts</Text>
      </View>
      {fundingAccounts
        .filter(({ currency }) => currency === workspace.currency)
        .map((account) => (
          <SetupFundingAccountRow
            key={account.id}
            account={account}
            selected={workspace.fundingAccountIds.includes(account.id)}
            onToggle={handleToggleFunding}
          />
        ))}
      <Button accessibilityLabel={`Add ${workspace.currency} Envelope`} onPress={handleAdd}>
        <Text>Add Envelope</Text>
      </Button>
      {workspace.envelopes.length === 0 ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <Text selectable style={styles.blankPlanText}>
            Blank plan — add an Envelope whenever you are ready.
          </Text>
        </Animated.View>
      ) : null}
      {selectedEnvelopeIds.length >= 2 && mergeTarget ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
          <Button
            accessibilityLabel={`Merge ${selectedEnvelopeIds.length} selected ${workspace.currency} Envelopes`}
            disabled={isSaving}
            onPress={handleMerge}
            variant="outline"
          >
            <Text>
              Merge {selectedEnvelopeIds.length} into {mergeTarget.name} (first selected)
            </Text>
          </Button>
        </Animated.View>
      ) : null}
      {workspace.envelopes.map((envelope) => (
        <SetupDraftEnvelopeItem
          key={envelope.id}
          categories={categories}
          currency={workspace.currency}
          envelope={envelope}
          mergeSelected={selectedEnvelopeIds.includes(envelope.id)}
          onMoveCategory={onMoveCategory}
          onRemoveCategory={onRemoveCategory}
          onToggleRollover={onToggleRollover}
          onToggleMergeSelection={handleToggleMergeSelection}
          onUpdateEnvelope={onUpdateEnvelope}
        />
      ))}
    </>
  );
};
