import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { styles } from "@/components/envelopes/styles";
import { SetupDraftWorkspaceSection } from "@/components/envelopes/setup/setup-draft-workspace";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type {
  SetupDraft,
  SetupDraftCategorySuggestion,
  SetupDraftEnvelope,
  SetupDraftFundingAccount,
} from "@/modules/budgeting/budgeting";

interface SetupDraftPlanProps {
  categories: readonly SetupDraftCategorySuggestion[];
  draft: SetupDraft;
  fundingAccounts: readonly SetupDraftFundingAccount[];
  isSaving: boolean;
  onAddEnvelope: (currency: string) => void;
  onDiscard: VoidFunction;
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
}

export const SetupDraftPlan = ({
  categories,
  draft,
  fundingAccounts,
  isSaving,
  onAddEnvelope,
  onDiscard,
  onMerge,
  onMoveCategory,
  onRemoveCategory,
  onToggleFundingAccount,
  onToggleRollover,
  onUpdateEnvelope,
}: SetupDraftPlanProps) => (
  <>
    <Animated.View entering={FadeIn} layout={LinearTransition} style={styles.draftPlanHeader}>
      <Text style={styles.heading2xlItalicInk}>Setup Draft resumed ✍️</Text>
      <Text selectable style={styles.draftPlanText}>
        Review every Funding Account, Category Mapping, Rollover choice, and optional Assignment.
        Nothing here is active yet.
      </Text>
    </Animated.View>
    {draft.workspaces.map((workspace) => (
      <SetupDraftWorkspaceSection
        key={workspace.currency}
        categories={categories}
        fundingAccounts={fundingAccounts}
        isSaving={isSaving}
        onAddEnvelope={onAddEnvelope}
        onMerge={onMerge}
        onMoveCategory={onMoveCategory}
        onRemoveCategory={onRemoveCategory}
        onToggleFundingAccount={onToggleFundingAccount}
        onToggleRollover={onToggleRollover}
        onUpdateEnvelope={onUpdateEnvelope}
        workspace={workspace}
      />
    ))}
    <Button
      accessibilityLabel="Discard Setup Draft"
      disabled={isSaving}
      onPress={onDiscard}
      variant="destructive"
    >
      <Text>Discard Setup Draft</Text>
    </Button>
  </>
);
