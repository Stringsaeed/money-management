import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { ApiError } from "@/data/http";

/**
 * What the caller may do in the selected Budget.
 * - owner-like: the household admin, or anyone on their own Personal ledger. Edits the plan.
 * - member: adds spending, marks paid, covers and moves money. Cannot change the plan.
 * - viewer: reads only.
 */
export type BudgetRole = "owner-like" | "member" | "viewer";

export type HouseholdRole = "admin" | "member" | "viewer";

export const PLAN_ADMIN_ONLY = "Only the household admin can change the plan.";
export const VIEW_ONLY = "You can view this household budget, but not change it.";

/** `householdRole` is undefined until the household has loaded; that reads as the safest role. */
export function budgetRole(
  scope: V2LedgerScope,
  householdRole: HouseholdRole | undefined,
): BudgetRole {
  if (scope.kind === "personal") return "owner-like";
  switch (householdRole) {
    case "admin":
      return "owner-like";
    case "member":
      return "member";
    default:
      return "viewer";
  }
}

export const canEditPlan = (role: BudgetRole): boolean => role === "owner-like";

/** Quick add, Mark paid, Cover and Move money. */
export const canAddSpending = (role: BudgetRole): boolean => role !== "viewer";

/** The role refusals a server can send, as the sentence to show; null for any other failure. */
export function roleErrorMessage(cause: unknown): string | null {
  if (!(cause instanceof ApiError)) return null;
  if (cause.code === "budget_role_forbidden") return PLAN_ADMIN_ONLY;
  if (cause.code === "household_write_required") return VIEW_ONLY;
  return null;
}
