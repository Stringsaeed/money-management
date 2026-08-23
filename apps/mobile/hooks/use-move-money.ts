import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";

import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import type { CorrectMoveMoneyRequest, MoveMoneyRequest } from "@/modules/budgeting/budgeting";
import { budgetKeys } from "@/modules/ledger-cache";

export function useMoveMoney() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: MoveMoneyRequest) =>
      createBudgetingCoordinator(database, { queryClient }).moveMoney(request),
  });
}

export function useCorrectMoveMoney() {
  const database = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CorrectMoveMoneyRequest) =>
      createBudgetingCoordinator(database, { queryClient }).correctMoveMoney(request),
  });
}

export function useAssignmentHistory(currency: string, period: string) {
  const database = useSQLiteContext();
  return useQuery({
    queryKey: budgetKeys.assignmentHistoryFor(currency, period),
    queryFn: () => createBudgetingCoordinator(database).getAssignmentHistory({ currency, period }),
  });
}
