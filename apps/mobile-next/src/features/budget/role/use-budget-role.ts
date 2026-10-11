import { useLedgerData } from "@/data/ledger-queries";
import { useHouseholdMembership } from "@/features/household/use-household-membership";

import {
  budgetAccess,
  canAddSpending,
  canEditPlan,
  type BudgetRole,
  type HouseholdRole,
} from "./budget-role";

export interface UseBudgetRole {
  readonly role: BudgetRole;
  /** True until a household's role is known: hide gated actions, but do not say they are refused. */
  readonly loading: boolean;
  readonly canEditPlan: boolean;
  readonly canAddSpending: boolean;
}

/** The caller's role in the selected Budget; Personal budgets are always theirs to edit. */
export function useBudgetRole(): UseBudgetRole {
  const { scope } = useLedgerData();
  const { household, loading: membershipLoading } = useHouseholdMembership(
    scope.kind === "household" ? scope.householdId : null,
  );
  const householdRole: HouseholdRole | undefined = household?.role;
  const { role, loading } = budgetAccess(scope, householdRole, membershipLoading);
  return { role, loading, canEditPlan: canEditPlan(role), canAddSpending: canAddSpending(role) };
}
