import { HOUSEHOLD_ROLES, type CommandKind, type ValidationIssue } from "@trove/protocol";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "./pipeline";

import { assignmentCommitHandler } from "./handlers/assignment-commit";
import { assignmentCorrectHandler } from "./handlers/assignment-correct";
import { budgetConfigureHandler } from "./handlers/budget-configure";
import { accountHandlers } from "./handlers/account";
import { categoryHandlers } from "./handlers/category";
import { importBundleHandler } from "./handlers/import-bundle";
import { memberRoleChangeHandler } from "./handlers/member-role";
import { refundCreateHandler } from "./handlers/refund-create";
import { recurringChangeHandler } from "./handlers/recurring-change";
import { transactionHandlers } from "./handlers/transaction";

export interface CommandHandler<TPayload = unknown> {
  parsePayload(
    payload: unknown,
  ): { ok: true; value: TPayload } | { ok: false; issues: readonly ValidationIssue[] };
  plan(ctx: PlanContext, request: PlanRequest): Promise<CommandPlan | PlanRejection>;
  /**
   * Predicate precondition names this handler validates itself (e.g.
   * "unassigned_money_gte" for assignments). Predicates outside this list
   * are still rejected loudly by the pipeline instead of silently ignored.
   */
  readonly supportedPredicates?: readonly string[];
  /**
   * True when the handler reads and writes by Ledger Scope alone. Handlers
   * that touch Household-owned tables leave this unset and receive a
   * {@link HouseholdPlanContext}; the pipeline rejects them under a Personal
   * Ledger instead of dispatching them with no Household.
   */
  readonly supportsPersonalScope?: boolean;
}

export const COMMAND_HANDLERS: Partial<Record<CommandKind, CommandHandler>> = {
  "member.role.change": memberRoleChangeHandler,
  ...accountHandlers,
  ...categoryHandlers,
  ...transactionHandlers,
  "recurring.change": recurringChangeHandler,
  "budget.configure": budgetConfigureHandler,
  "assignment.commit": assignmentCommitHandler,
  "assignment.correct": assignmentCorrectHandler,
  "refund.link": refundCreateHandler,
  import_bundle: importBundleHandler,
};

export { HOUSEHOLD_ROLES };

export type { CommandPlan, PlanRejection };
