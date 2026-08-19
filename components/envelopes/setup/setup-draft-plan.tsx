import { View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { SetupEnvelopeCard } from "@/components/envelopes/setup/setup-envelope-card";
import { SetupFundingAccountRow } from "@/components/envelopes/setup/setup-funding-account-row";
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
  onDiscard: VoidFunction;
  onMerge: (currency: string) => void;
  onMoveCategory: (currency: string, categoryId: string, envelopeId: string) => void;
  onToggleFundingAccount: (currency: string, accountId: string) => void;
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
  onDiscard,
  onMerge,
  onMoveCategory,
  onToggleFundingAccount,
  onUpdateEnvelope,
}: SetupDraftPlanProps) => (
  <Animated.View entering={FadeIn} layout={LinearTransition} className="gap-5">
    <View className="gap-1">
      <Text className="font-heading-normal text-2xl italic text-ink">Setup Draft resumed ✍️</Text>
      <Text selectable className="font-body-normal text-sm leading-5 text-ink/60">
        Review every Funding Account, Category Mapping, Rollover choice, and optional Assignment.
        Nothing here is active yet.
      </Text>
    </View>
    {draft.workspaces.map((workspace) => (
      <Animated.View key={workspace.currency} layout={LinearTransition} className="gap-3">
        <View className="gap-1">
          <Text className="font-heading-medium text-xl italic text-ink">
            {workspace.currency} workspace
          </Text>
          <Text className="font-body-normal text-sm text-ink/60">Choose Funding Accounts</Text>
        </View>
        {fundingAccounts
          .filter(({ currency }) => currency === workspace.currency)
          .map((account) => (
            <SetupFundingAccountRow
              key={account.id}
              account={account}
              selected={workspace.fundingAccountIds.includes(account.id)}
              onPress={() => onToggleFundingAccount(workspace.currency, account.id)}
            />
          ))}
        {workspace.envelopes.length === 0 ? (
          <Text selectable className="rounded-2xl bg-surface-container p-4 text-sm text-ink/60">
            Blank plan — add Envelopes during final review.
          </Text>
        ) : (
          <>
            {workspace.envelopes.length > 1 ? (
              <Button
                accessibilityLabel={`Merge ${workspace.currency} suggestions`}
                disabled={isSaving}
                onPress={() => onMerge(workspace.currency)}
                variant="outline"
              >
                <Text>Merge first two suggestions</Text>
              </Button>
            ) : null}
            {workspace.envelopes.map((envelope) => (
              <SetupEnvelopeCard
                key={envelope.id}
                categories={categories}
                envelope={envelope}
                onChange={(changes) => onUpdateEnvelope(workspace.currency, envelope.id, changes)}
                onMapCategory={(categoryId) =>
                  onMoveCategory(workspace.currency, categoryId, envelope.id)
                }
              />
            ))}
          </>
        )}
      </Animated.View>
    ))}
    <Button
      accessibilityLabel="Discard Setup Draft"
      disabled={isSaving}
      onPress={onDiscard}
      variant="destructive"
    >
      <Text>Discard Setup Draft</Text>
    </Button>
  </Animated.View>
);
