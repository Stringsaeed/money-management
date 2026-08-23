import { HOUSEHOLD_ROLES, type CommandKind, type ValidationIssue } from "@trove/protocol";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "./pipeline";

import { accountHandlers } from "./handlers/account";
import { categoryHandlers } from "./handlers/category";
import { memberRoleChangeHandler } from "./handlers/member-role";
import { transactionHandlers } from "./handlers/transaction";

export interface CommandHandler<TPayload = unknown> {
  parsePayload(
    payload: unknown,
  ): { ok: true; value: TPayload } | { ok: false; issues: readonly ValidationIssue[] };
  plan(ctx: PlanContext, request: PlanRequest): Promise<CommandPlan | PlanRejection>;
}

/**
 * Handler registry, grown phase by phase as command kinds ship (#86 ledger,
 * #89 workspace/envelopes, #90 waterfalls, #91 card payments).
 */
export const COMMAND_HANDLERS: Partial<Record<CommandKind, CommandHandler>> = {
  "member.role.change": memberRoleChangeHandler,

  // ── Ledger structure (#86): owner/admin territory ─────────────────────────
  ...accountHandlers,
  ...categoryHandlers,

  // ── Ledger facts (#86): every contributing role may write ────────────────
  ...transactionHandlers,
};

// HOUSEHOLD_ROLES is re-exported for consumers building payload schemas.
export { HOUSEHOLD_ROLES };

export type { CommandPlan, PlanRejection };
