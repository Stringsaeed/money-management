import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "@/db/sqlite";
import { useState } from "react";

import {
  addSetupDraftEnvelope,
  createBudgetingCoordinator,
  mergeSetupDraftEnvelopes,
  moveSetupDraftCategory,
  removeSetupDraftCategory,
  toggleSetupDraftRollover,
  updateSetupDraftEnvelope,
  updateSetupDraftFundingAccounts,
} from "@/modules/budgeting/budgeting";
import type { SetupDraft, SetupDraftEnvelope } from "@/modules/budgeting/budgeting";
import { UnreadableSetupDraftError } from "@/modules/budgeting/setup-draft-codec";
import { budgetKeys } from "@/modules/ledger-cache";
import { assertLocalLedgerAuthority } from "@/modules/ledger-data-source/contract";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { nowIso, today } from "@/utils/date";
import { generateId } from "@/utils/id";

type DraftTransform = (draft: SetupDraft) => SetupDraft;
type SetupDraftCommand =
  | {
      kind: "start";
      mode: SetupDraft["mode"];
      currencies: readonly string[];
      localDate: string;
      now: string;
    }
  | { kind: "discard" }
  | { kind: "update"; transform: DraftTransform; localDate: string; now: string };

export function useSetupDraft() {
  const selection = useLedgerSourceSelection();
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const coordinator = createBudgetingCoordinator(database);
  const query = useQuery({
    queryKey: budgetKeys.setupDraft,
    queryFn: async () => {
      assertLocalLedgerAuthority(selection, "envelopes.setup-draft");
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
        try {
          await coordinator.discardSetupDraft();
        } catch {
          throw new Error(
            "Setup Draft could not be discarded and remains saved. Retry when storage is available.",
          );
        }
        return null;
      }
      if (command.kind === "start") {
        return coordinator.createSetupDraft({
          mode: command.mode,
          currencies: command.currencies,
          localDate: command.localDate,
          now: command.now,
        });
      }
      const current = await coordinator.loadSetupDraft();
      if (!current) throw new Error("The Setup Draft is missing. Start a new plan and try again.");
      return coordinator.saveSetupDraft({
        draft: command.transform(current),
        localDate: command.localDate,
        now: command.now,
      });
    },
    onSuccess: (draft) => {
      const current = queryClient.getQueryData<typeof query.data>(budgetKeys.setupDraft);
      if (current?.prerequisites) {
        queryClient.setQueryData(budgetKeys.setupDraft, { ...current, draft });
      } else {
        void queryClient.invalidateQueries({ queryKey: budgetKeys.setupDraft });
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
    mutation.mutate({ kind: "update", transform, localDate: today(), now: nowIso() });
  };

  return {
    ...query,
    actionError,
    errorIsUnreadable: query.error instanceof UnreadableSetupDraftError,
    isSaving: mutation.isPending,
    retry: () => {
      setActionError(null);
      void query.refetch();
    },
    start: (mode: SetupDraft["mode"]) => {
      setActionError(null);
      mutation.mutate({
        kind: "start",
        mode,
        currencies: query.data?.prerequisites.currencies ?? [],
        localDate: today(),
        now: nowIso(),
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
    removeCategory: (currency: string, envelopeId: string, categoryId: string) => {
      update((draft) => removeSetupDraftCategory(draft, currency, envelopeId, categoryId));
    },
    toggleRollover: (currency: string, envelopeId: string) => {
      update((draft) => toggleSetupDraftRollover(draft, currency, envelopeId));
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
