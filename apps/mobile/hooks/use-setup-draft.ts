import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import {
  addSetupDraftEnvelope,
  createBudgetingCoordinator,
  mergeSetupDraftEnvelopes,
  moveSetupDraftCategory,
  updateSetupDraftEnvelope,
  updateSetupDraftFundingAccounts,
} from "@/modules/budgeting/budgeting";
import type { SetupDraft, SetupDraftEnvelope } from "@/modules/budgeting/budgeting";
import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";

const setupDraftKey = ["setup-draft", "guided-envelope-setup"] as const;

type DraftTransform = (draft: SetupDraft) => SetupDraft;
type SetupDraftCommand =
  | { kind: "start"; mode: SetupDraft["mode"]; currencies: readonly string[] }
  | { kind: "discard" }
  | { kind: "update"; transform: DraftTransform };

export function useSetupDraft() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const coordinator = createBudgetingCoordinator(database);
  const query = useQuery({
    queryKey: setupDraftKey,
    queryFn: async () => {
      const [draft, prerequisites] = await Promise.all([
        coordinator.loadSetupDraft(),
        coordinator.getSetupDraftPrerequisites(),
      ]);
      return { draft, prerequisites };
    },
  });
  const mutation = useMutation({
    mutationFn: async (command: SetupDraftCommand): Promise<SetupDraft | null> => {
      if (command.kind === "discard") {
        await coordinator.discardSetupDraft();
        return null;
      }
      if (command.kind === "start") {
        return coordinator.createSetupDraft({
          mode: command.mode,
          currencies: command.currencies,
          now: nowIso(),
        });
      }
      const current = await coordinator.loadSetupDraft();
      if (!current) throw new Error("The Setup Draft is missing. Start a new plan and try again.");
      return coordinator.saveSetupDraft(command.transform(current), nowIso());
    },
    onSuccess: (draft) => {
      const current = queryClient.getQueryData<typeof query.data>(setupDraftKey);
      if (current?.prerequisites) {
        queryClient.setQueryData(setupDraftKey, { ...current, draft });
      } else {
        void queryClient.invalidateQueries({ queryKey: setupDraftKey });
      }
    },
    onError: (error) => {
      setActionError(
        error instanceof Error
          ? error.message
          : "Setup Draft could not be saved. Review the plan and try again.",
      );
    },
    scope: { id: "guided-envelope-setup" },
  });

  const update = (transform: DraftTransform) => {
    setActionError(null);
    mutation.mutate({ kind: "update", transform });
  };

  return {
    ...query,
    actionError,
    isSaving: mutation.isPending,
    start: (mode: SetupDraft["mode"]) => {
      setActionError(null);
      mutation.mutate({
        kind: "start",
        mode,
        currencies: query.data?.prerequisites.currencies ?? [],
      });
    },
    discard: () => {
      setActionError(null);
      mutation.mutate({ kind: "discard" });
    },
    addEnvelope: (currency: string) => {
      update((draft) =>
        addSetupDraftEnvelope(draft, currency, {
          id: generateId(),
          name: "New Envelope",
          icon: "📦",
          color: "#8B9D83",
        }),
      );
    },
    mergeSuggestions: (currency: string, envelopeIds: readonly string[]) => {
      update((draft) => mergeSetupDraftEnvelopes(draft, currency, envelopeIds));
    },
    moveCategory: (currency: string, categoryId: string, envelopeId: string) => {
      update((draft) => moveSetupDraftCategory(draft, currency, categoryId, envelopeId));
    },
    toggleFundingAccount: (currency: string, accountId: string) => {
      update((draft) => {
        const workspace = draft.workspaces.find((candidate) => candidate.currency === currency);
        if (!workspace) return draft;
        const included = workspace.fundingAccountIds.includes(accountId);
        return updateSetupDraftFundingAccounts(
          draft,
          currency,
          included
            ? workspace.fundingAccountIds.filter((id) => id !== accountId)
            : [...workspace.fundingAccountIds, accountId],
        );
      });
    },
    updateEnvelope: (
      currency: string,
      envelopeId: string,
      changes: Partial<
        Pick<
          SetupDraftEnvelope,
          "name" | "icon" | "color" | "categoryIds" | "positiveRollover" | "initialAssignmentMinor"
        >
      >,
    ) => {
      update((draft) => updateSetupDraftEnvelope(draft, currency, envelopeId, changes));
    },
  };
}
