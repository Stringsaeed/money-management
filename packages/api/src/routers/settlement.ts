import { createDb } from "@trove/db";
import { env } from "@trove/env/server";
import { ORPCError, os } from "@orpc/server";

import type { Context } from "../context";
import { createSettlementIdentity, settleDueRules } from "../lib/recurring/scheduler";

const SETTLEMENT_ADMIN_HEADER = "x-settlement-secret";

/** Length-independent constant-time comparison to avoid timing oracles. */
function secretsMatch(provided: string, expected: string): boolean {
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Admin guard for the manual settlement trigger (#88). The platform has no
 * global admin role yet, so the interim contract is: an authenticated caller
 * presenting the deployment's `SETTLEMENT_ADMIN_SECRET`. A missing secret on
 * the Worker disables the procedure entirely rather than leaving it open.
 */
const requireSettlementAdmin = os.$context<Context>().middleware(async ({ context, next }) => {
  const userId = context.session?.user?.id;
  if (!userId) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in to continue." });
  }
  const expected = env.SETTLEMENT_ADMIN_SECRET;
  if (!expected) {
    throw new ORPCError("FORBIDDEN", {
      message:
        "Manual settlement is disabled: no SETTLEMENT_ADMIN_SECRET is configured on this deployment.",
    });
  }
  const provided = context.headers.get(SETTLEMENT_ADMIN_HEADER);
  if (!provided || !secretsMatch(provided, expected)) {
    throw new ORPCError("FORBIDDEN", {
      message: "Manual settlement requires the admin secret.",
    });
  }
  return next({
    context: {
      session: context.session,
      headers: context.headers,
    },
  });
});

const base = os.$context<Context>();

export const settlementRouter = {
  /**
   * Manual trigger for the hourly cron sweep (#88): evaluates every active
   * Recurring Rule on its own time zone's local date and settles what is
   * due. Idempotent — safe to invoke alongside the Cron Trigger.
   */
  run: base.use(requireSettlementAdmin).handler(async () => {
    const db = createDb();
    return settleDueRules(db, createSettlementIdentity(), new Date());
  }),
};
