import type { ledgerAccount } from "@trove/db/schema/ledger";

import type { PlanContext, PlanRejection } from "../pipeline";

export const PRIVATE_ACCOUNT_OWNER_CAPABILITY = "accounts:private.owner";

type AccountRow = typeof ledgerAccount.$inferSelect;

/** Private financial facts can only be changed by the Account's owning User. */
export function privateAccountAccessRejection(
  ctx: PlanContext,
  account: AccountRow,
): PlanRejection | null {
  // Organization-ledger Accounts are shared. The schema and Account handler
  // prevent new private Household rows; this scope check keeps legacy rows
  // shared while migration 0013 normalizes them to public.
  if (
    ctx.householdId !== null ||
    account.visibility !== "private" ||
    account.ownerUserId === ctx.actorUserId
  ) {
    return null;
  }
  return {
    kind: "forbidden",
    role: ctx.actorRole,
    requiredCapability: PRIVATE_ACCOUNT_OWNER_CAPABILITY,
  };
}
