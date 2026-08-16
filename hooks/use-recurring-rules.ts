import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  RecurringSettlementError,
  type RecurringChange,
  type RecurringChangeResult,
} from "@/modules/recurring-rules";
import { useRecurringRulesModule } from "@/modules/recurring-rules/provider";

import { invalidateRecurringEffects, recurringRuleKeys } from "./recurring-effects";

type ChangeOfKind<Kind extends RecurringChange["kind"]> = Extract<RecurringChange, { kind: Kind }>;
type ChangeVariables<Kind extends RecurringChange["kind"]> = Omit<ChangeOfKind<Kind>, "kind">;

export function useRecurringRulesList(
  filter: "current" | "archived" | "needs_attention" = "current",
) {
  const recurringRules = useRecurringRulesModule();
  return useQuery({
    queryKey: recurringRuleKeys.list(filter),
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
  return useQuery({
    queryKey: recurringRuleKeys.detail(ruleId ?? ""),
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
  return useQuery({
    queryKey: recurringRuleKeys.upcoming(limit),
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
export const useChangeRecurringRuleTimeZone = () => useRecurringChange("change_time_zone");

export function useSettleRecurringRules() {
  const recurringRules = useRecurringRulesModule();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recurringRules.settle(),
    onSuccess: (report) => invalidateRecurringEffects(queryClient, report.effects),
    onError: (error) => {
      if (error instanceof RecurringSettlementError) {
        return invalidateRecurringEffects(queryClient, error.report.effects);
      }
    },
  });
}

function useRecurringChange<Kind extends RecurringChange["kind"]>(kind: Kind) {
  const recurringRules = useRecurringRulesModule();
  const queryClient = useQueryClient();
  return useMutation<RecurringChangeResult, Error, ChangeVariables<Kind>>({
    mutationFn: (variables) => recurringRules.change({ kind, ...variables } as ChangeOfKind<Kind>),
    onSuccess: (result) => {
      if (result.kind === "applied") {
        return invalidateRecurringEffects(queryClient, result.effects);
      }
    },
  });
}
