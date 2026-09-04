import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";

import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { budgetKeys } from "@/modules/ledger-cache";
import { assertLocalLedgerAuthority } from "@/modules/ledger-data-source/contract";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import type { CreateEnvelopeRequest, UpdateEnvelopeRequest } from "@/modules/budgeting/budgeting";

export function useBudgetWorkspaceSelection() {
  const database = useSQLiteContext();
  return useQuery({
    queryKey: budgetKeys.workspaces,
    queryFn: () => createBudgetingCoordinator(database).getWorkspaceSelection(),
  });
}

export function useSelectBudgetWorkspace() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currency }: { currency: string }) =>
      createBudgetingCoordinator(database, { queryClient }).selectWorkspace({ currency }),
  });
}

export function useBudgetProjection(currency: string, period: string) {
  const selection = useLedgerSourceSelection();
  const database = useSQLiteContext();
  return useQuery({
    queryKey: budgetKeys.projection(currency, period),
    queryFn: () => {
      assertLocalLedgerAuthority(selection, "envelopes.projection");
      return createBudgetingCoordinator(database).getProjection({ currency, period });
    },
  });
}

export function useEnvelopeFormOptions(currency: string, period: string) {
  const selection = useLedgerSourceSelection();
  const database = useSQLiteContext();
  return useQuery({
    queryKey: budgetKeys.envelopeFormOptionsFor(currency, period),
    queryFn: () => {
      assertLocalLedgerAuthority(selection, "envelopes.form-options");
      return createBudgetingCoordinator(database).getEnvelopeFormOptions({ currency, period });
    },
  });
}

export function useCreateBudgetEnvelope() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateEnvelopeRequest) =>
      createBudgetingCoordinator(database, { queryClient }).createEnvelope(request),
  });
}

export function useUpdateBudgetEnvelope() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateEnvelopeRequest) =>
      createBudgetingCoordinator(database, { queryClient }).updateEnvelope(request),
  });
}
