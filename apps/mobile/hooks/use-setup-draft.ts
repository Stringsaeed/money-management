import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import {
  createBudgetingCoordinator,
  mergeSetupDraftEnvelopes,
  moveSetupDraftCategory,
  updateSetupDraftEnvelope,
  updateSetupDraftFundingAccounts,
} from "@/modules/budgeting/budgeting";
import type { SetupDraft, SetupDraftEnvelope } from "@/modules/budgeting/budgeting";
import { nowIso } from "@/utils/date";

const setupDraftKey = ["setup-draft", "guided-envelope-setup"] as const;

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
    mutationFn: (task: () => Promise<SetupDraft | null>) => task(),
    onSuccess: (draft) => {
      queryClient.setQueryData(setupDraftKey, (current: typeof query.data) =>
        current ? { ...current, draft } : current,
      );
    },
    onError: (error) => {
      setActionError(
        error instanceof Error
          ? error.message
          : "Setup Draft could not be saved. Review the plan and try again.",
      );
    },
  });

  const start = (mode: SetupDraft["mode"]) => {
    setActionError(null);
    mutation.mutate(() =>
      coordinator.createSetupDraft({
        mode,
        currencies: query.data?.prerequisites.currencies ?? [],
        now: nowIso(),
      }),
    );
  };
  const save = (draft: SetupDraft) => {
    setActionError(null);
    mutation.mutate(() => coordinator.saveSetupDraft(draft, nowIso()));
  };

  return {
    ...query,
    actionError,
    isSaving: mutation.isPending,
    start,
    discard: () => {
      setActionError(null);
      mutation.mutate(async () => {
        await coordinator.discardSetupDraft();
        return null;
      });
    },
    mergeFirstSuggestions: (currency: string) => {
      const draft = query.data?.draft;
      const workspace = draft?.workspaces.find((candidate) => candidate.currency === currency);
      if (!draft || !workspace || workspace.envelopes.length < 2) return;
      save(
        mergeSetupDraftEnvelopes(
          draft,
          currency,
          workspace.envelopes.slice(0, 2).map(({ id }) => id),
        ),
      );
    },
    moveCategory: (currency: string, categoryId: string, envelopeId: string) => {
      const draft = query.data?.draft;
      if (!draft) return;
      save(moveSetupDraftCategory(draft, currency, categoryId, envelopeId));
    },
    toggleFundingAccount: (currency: string, accountId: string) => {
      const draft = query.data?.draft;
      const workspace = draft?.workspaces.find((candidate) => candidate.currency === currency);
      if (!draft || !workspace) return;
      const included = workspace.fundingAccountIds.includes(accountId);
      save(
        updateSetupDraftFundingAccounts(
          draft,
          currency,
          included
            ? workspace.fundingAccountIds.filter((id) => id !== accountId)
            : [...workspace.fundingAccountIds, accountId],
        ),
      );
    },
    updateEnvelope: (
      currency: string,
      envelopeId: string,
      changes: Partial<
        Pick<SetupDraftEnvelope, "categoryIds" | "positiveRollover" | "initialAssignmentMinor">
      >,
    ) => {
      const draft = query.data?.draft;
      if (!draft) return;
      save(updateSetupDraftEnvelope(draft, currency, envelopeId, changes));
    },
  };
}
