import { useMutation, useQuery } from "@tanstack/react-query";

import { useBudgetingCoordinator } from "@/hooks/use-budgeting-coordinator";
import { budgetKeys } from "@/modules/ledger-cache";
import type { CreateEnvelopeRequest, UpdateEnvelopeRequest } from "@/modules/budgeting/budgeting";

export function useBudgetWorkspaceSelection() {
  const budgeting = useBudgetingCoordinator();
  return useQuery({
    queryKey: budgetKeys.workspaces,
    queryFn: budgeting.getWorkspaceSelection,
  });
}

export function useSelectBudgetWorkspace() {
  const budgeting = useBudgetingCoordinator();
  return useMutation({
    mutationFn: ({ currency }: { currency: string }) => budgeting.selectWorkspace({ currency }),
  });
}

export function useBudgetProjection(currency: string, period: string) {
  const budgeting = useBudgetingCoordinator();
  return useQuery({
    queryKey: budgetKeys.projection(currency, period),
    queryFn: () => budgeting.getProjection({ currency, period }),
  });
}

export function useEnvelopeFormOptions(currency: string, period: string) {
  const budgeting = useBudgetingCoordinator();
  return useQuery({
    queryKey: budgetKeys.envelopeFormOptionsFor(currency, period),
    queryFn: () => budgeting.getEnvelopeFormOptions({ currency, period }),
  });
}

export function useCreateBudgetEnvelope() {
  const budgeting = useBudgetingCoordinator();
  return useMutation({
    mutationFn: (request: CreateEnvelopeRequest) => budgeting.createEnvelope(request),
  });
}

export function useUpdateBudgetEnvelope() {
  const budgeting = useBudgetingCoordinator();
  return useMutation({
    mutationFn: (request: UpdateEnvelopeRequest) => budgeting.updateEnvelope(request),
  });
}
