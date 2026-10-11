import { Context, Effect, Layer } from "effect";

import { localDateInTimeZone } from "@trove/domain/clock";

import { BudgetRoleForbidden, VersionConflict } from "./budget-errors";
import type { V2DbExecutor, V2LedgerContext } from "./shared";

/** v1 budgets are AED, so "today" is the UAE Ledger Date. */
export const BUDGET_TIME_ZONE = "Asia/Dubai";

export function budgetToday(now: Date): string {
  return localDateInTimeZone(now, BUDGET_TIME_ZONE);
}

/** The ledger the request acts on, resolved and authorized by the Hono route. */
export class BudgetLedger extends Context.Service<BudgetLedger, V2LedgerContext>()(
  "@trove/api/v2/BudgetLedger",
) {}

/** The drizzle executor: the request database for reads, the ledger transaction inside a mutation. */
export class LedgerDb extends Context.Service<LedgerDb, V2DbExecutor>()("@trove/api/v2/LedgerDb") {}

/**
 * The instant a request runs at and its budget "today" (Asia/Dubai Ledger
 * Date), read once per request. The route supplies its clock seam so tests can
 * pin the date.
 */
export class BudgetClock extends Context.Service<
  BudgetClock,
  { readonly now: Date; readonly today: string }
>()("@trove/api/v2/BudgetClock") {
  static layer(now: Date) {
    return Layer.succeed(BudgetClock, BudgetClock.of({ now, today: budgetToday(now) }));
  }
}

/**
 * Budget plan changes (activate, payday, funding, envelope create/edit, plan
 * and repeat assignments) belong to household admins (#365 decision 8).
 * Members still move, cover, and pay; viewers are refused every write when the
 * household is authorized. Personal ledgers have no roles.
 */
export const requirePlanAccess = Effect.gen(function* () {
  const ledger = yield* BudgetLedger;
  if (ledger.scope.kind === "household" && ledger.householdRole !== "admin") {
    return yield* new BudgetRoleForbidden();
  }
});

/** The acting person, for "who" lines; a household ledger's owner id would not say who. */
export const budgetActor = Effect.map(BudgetLedger, (ledger) =>
  ledger.principal.kind === "user" ? ledger.principal.userId : ledger.principal.guestSessionId,
);

/** If-Match: no header means no check; a stale version refuses the write. */
export function checkVersion(
  expectedVersion: number | undefined,
  actualVersion: number,
  entityId: string,
): Effect.Effect<void, VersionConflict> {
  return expectedVersion === undefined || expectedVersion === actualVersion
    ? Effect.void
    : Effect.fail(new VersionConflict({ entityId, expectedVersion, actualVersion }));
}
