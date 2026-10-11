import { useLedgerData } from "@/data/ledger-queries";
import { useHouseholdMembership } from "@/features/household/use-household-membership";

import {
  budgetRole,
  canAddSpending,
  canEditPlan,
  type BudgetRole,
  type HouseholdRole,
} from "./budget-role";

export interface UseBudgetRole {
  readonly role: BudgetRole;
  readonly canEditPlan: boolean;
  readonly canAddSpending: boolean;
}

/** The caller's role in the selected Budget; Personal budgets are always theirs to edit. */
export function useBudgetRole(): UseBudgetRole {
  const { scope } = useLedgerData();
  const { household } = useHouseholdMembership(
    scope.kind === "household" ? scope.householdId : null,
  );
  const householdRole: HouseholdRole | undefined = household?.role;
  const role = budgetRole(scope, householdRole);
  return { role, canEditPlan: canEditPlan(role), canAddSpending: canAddSpending(role) };
}
