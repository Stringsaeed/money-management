import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import {
  RecurringSettlementError,
  type RecurringChange,
  type RecurringChangeResult,
  type RecurringRule,
} from "@/modules/recurring-rules";
import { useRecurringRulesModule } from "@/modules/recurring-rules/provider";
import { assertLocalLedgerAuthority } from "@/modules/ledger-data-source/contract";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";
import { cohereRecurringEffects, recurringRuleKeys } from "@/modules/ledger-cache";

type ChangeOfKind<Kind extends RecurringChange["kind"]> = Extract<RecurringChange, { kind: Kind }>;
type ChangeVariables<Kind extends RecurringChange["kind"]> = Omit<ChangeOfKind<Kind>, "kind">;

export function useRecurringRulesList(
  filter: "current" | "archived" | "needs_attention" = "current",
) {
  const recurringRules = useRecurringRulesModule();
  const revision = useRecurringCollectionRevision();
  return useQuery({
    queryKey: [...recurringRuleKeys.list(filter), revision],
    queryFn: async () => {
      const result = await recurringRules.read({ kind: "list", filter });
      if (result.kind !== "list")
        throw new Error("Recurring Rules list returned the wrong result.");
      return result.rules;
    },
  });
}

export function useRecurringRule(ruleId: string | undefined) {
  const recurringRules = useRecurringRulesModule();
  const revision = useRecurringCollectionRevision();
  return useQuery({
    queryKey: [...recurringRuleKeys.detail(ruleId ?? ""), revision],
    enabled: !!ruleId,
    queryFn: async () => {
      const result = await recurringRules.read({ kind: "detail", ruleId: ruleId! });
      if (result.kind !== "detail") {
        throw new Error("Recurring Rule detail returned the wrong result.");
      }
      return result.rule;
    },
  });
}

export function useUpcomingRecurringRules(limit = 3) {
  const recurringRules = useRecurringRulesModule();
  const revision = useRecurringCollectionRevision();
  return useQuery({
    queryKey: [...recurringRuleKeys.upcoming(limit), revision],
    queryFn: async () => {
      const result = await recurringRules.read({ kind: "upcoming", limit });
      if (result.kind !== "upcoming") {
        throw new Error("Upcoming Recurring Rules returned the wrong result.");
      }
      return result.items;
    },
  });
}

export const useCreateRecurringRule = () => useRecurringChange("create");
export const useEditRecurringRule = () => useRecurringChange("edit");
export const usePauseRecurringRule = () => useRecurringChange("pause");
export const useResumeRecurringRule = () => useRecurringChange("resume");
export const useArchiveRecurringRule = () => useRecurringChange("archive");
export const useRestoreRecurringRule = () => useRecurringChange("restore");
export const useRepairRecurringRule = () => useRecurringChange("repair");

export function useSettleRecurringRules() {
  const selection = useLedgerSourceSelection();
  const recurringRules = useRecurringRulesModule();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      assertLocalLedgerAuthority(selection, "recurring.settle");
      return recurringRules.settle();
    },
    onSuccess: (report) => cohereRecurringEffects(queryClient, report.effects),
    onError: (error) => {
      if (error instanceof RecurringSettlementError) {
        return cohereRecurringEffects(queryClient, error.report.effects);
      }
    },
  });
}

function useRecurringChange<Kind extends RecurringChange["kind"]>(kind: Kind) {
  const selection = useLedgerSourceSelection();
  const recurringRules = useRecurringRulesModule();
  const queryClient = useQueryClient();
  return useMutation<RecurringChangeResult, Error, ChangeVariables<Kind>>({
    mutationFn: (variables) => {
      if (
        selection.kind === "local" &&
        (kind === "create" || kind === "edit" || kind === "repair")
      ) {
        assertLocalLedgerAuthority(selection, `recurring.${kind}`);
      }
      return recurringRules.change({ kind, ...variables } as ChangeOfKind<Kind>);
    },
    onSuccess: (result) => {
      if (result.kind === "applied") {
        updateRecurringRuleLifecycle(queryClient, kind, result);
        return cohereRecurringEffects(queryClient, result.effects);
      }
    },
  });
}

const ignoreListener = () => undefined;
const emptySubscribe = () => ignoreListener;
const zeroRevision = () => 0;

function useRecurringCollectionRevision(): number {
  const ledger = useSyncedTransactionLedger();
  return useSyncExternalStore(
    ledger ? ledger.subscribe : emptySubscribe,
    ledger ? ledger.revision : zeroRevision,
    ledger ? ledger.revision : zeroRevision,
  );
}

const lifecycleByChange: Partial<Record<RecurringChange["kind"], RecurringRule["lifecycle"]>> = {
  pause: "paused",
  resume: "active",
  archive: "archived",
  restore: "active",
};

function updateRecurringRuleLifecycle(
  queryClient: QueryClient,
  kind: RecurringChange["kind"],
  result: Extract<RecurringChangeResult, { kind: "applied" }>,
) {
  const lifecycle = lifecycleByChange[kind];
  if (!lifecycle) return;

  queryClient.setQueriesData<RecurringRule | null>(
    { queryKey: recurringRuleKeys.detail(result.ruleId) },
    (rule) => (rule ? { ...rule, lifecycle, revision: result.revision } : rule),
  );
}
