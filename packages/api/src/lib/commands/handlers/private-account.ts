import type { ledgerAccount } from "@trove/db/schema/ledger";

import type { PlanContext, PlanRejection } from "../pipeline";

export const PRIVATE_ACCOUNT_OWNER_CAPABILITY = "accounts:private.owner";

type AccountRow = typeof ledgerAccount.$inferSelect;

/** Private financial facts can only be changed by the Account's owning User. */
export function privateAccountAccessRejection(
  ctx: PlanContext,
  account: AccountRow,
): PlanRejection | null {
  if (account.visibility !== "private" || account.ownerUserId === ctx.actorUserId) {
    return null;
  }
  return {
    kind: "forbidden",
    role: ctx.actorRole,
    requiredCapability: PRIVATE_ACCOUNT_OWNER_CAPABILITY,
  };
}
