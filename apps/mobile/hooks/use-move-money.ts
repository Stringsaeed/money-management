import { useMutation, useQuery } from "@tanstack/react-query";

import { useBudgetingCoordinator } from "@/hooks/use-budgeting-coordinator";
import type { CorrectMoveMoneyRequest, MoveMoneyRequest } from "@/modules/budgeting/budgeting";
import { budgetKeys } from "@/modules/ledger-cache";

export function useMoveMoney() {
  const budgeting = useBudgetingCoordinator();
  return useMutation({
    mutationFn: (request: MoveMoneyRequest) => budgeting.moveMoney(request),
  });
}

export function useCorrectMoveMoney() {
  const budgeting = useBudgetingCoordinator();
  return useMutation({
    mutationFn: (request: CorrectMoveMoneyRequest) => budgeting.correctMoveMoney(request),
  });
}

export function useAssignmentHistory(currency: string, period: string) {
  const budgeting = useBudgetingCoordinator();
  return useQuery({
    queryKey: budgetKeys.assignmentHistoryFor(currency, period),
    queryFn: () => budgeting.getAssignmentHistory({ currency, period }),
  });
}
