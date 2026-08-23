import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";

import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import { budgetKeys } from "@/modules/ledger-cache";

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
