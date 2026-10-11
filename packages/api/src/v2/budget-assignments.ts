import { nextPeriodStart, ruleInEffect } from "@trove/domain/budget";
import { v2Assignment } from "@trove/db/schema/v2-budget";

import { budgetActor } from "./budget-activate";
import { budgetView, findBudget, loadBudget, type LoadedBudget } from "./budget";
import {
  assignmentsCreateSchema,
  type V2AssignmentsCreateInput,
  type V2BudgetPeriodView,
  type V2BudgetView,
} from "./contracts";
import { V2ApiError, withLedgerMutation, type V2LedgerContext } from "./shared";

/** How many periods ahead a plan may be written. */
const MAX_FUTURE_PERIODS = 24;

/**
 * Writes money moves (#371) atomically, one append-only row per item. Items
 * are checked in order against a running copy of the current projection, so an
 * earlier item can fund a later one. Nothing is written when any item fails.
 * Returns the refreshed budget so the client updates in one round trip.
 */
export async function createAssignments(
  context: V2LedgerContext,
  input: V2AssignmentsCreateInput,
  today: string,
  idempotencyKey?: string,
): Promise<V2BudgetView> {
  const parsed = assignmentsCreateSchema.parse(input);
  return withLedgerMutation(context, "budget.assignments.create", idempotencyKey, async (db) => {
    const budget = await findBudget(db, context.ledgerId);
    if (!budget) throw new V2ApiError(404, "budget_not_found", "This ledger has no budget.");
    const loaded = await loadBudget(db, budget, today);
    const currentStart = loaded.projection.current.period.start;
    const periodStart = parsed.periodStart ?? currentStart;
    assertPeriodStart(loaded, periodStart);
    const isCurrent = periodStart === currentStart;

    checkItems(loaded, parsed.items, isCurrent);

    const actor = budgetActor(context);
    await db.insert(v2Assignment).values(
      parsed.items.map((item) => ({
        ledgerId: context.ledgerId,
        id: crypto.randomUUID(),
        budgetId: budget.id,
        periodStart,
        fromEnvelopeId: item.fromEnvelopeId,
        toEnvelopeId: item.toEnvelopeId,
        amountMinor: item.amountMinor,
        reason: item.reason,
        createdBy: actor,
      })),
    );
    return budgetView(await loadBudget(db, budget, today));
  });
}

type AssignmentItem = ReturnType<typeof assignmentsCreateSchema.parse>["items"][number];

/**
 * Walks the items against a running copy of the current balances. `null` is
 * Not planned yet; envelopes are keyed by id. A future period's plan changes
 * only Not planned yet today (futureAssigned); the current period also moves
 * the envelope balances.
 */
function checkItems(
  loaded: LoadedBudget,
  items: readonly AssignmentItem[],
  isCurrent: boolean,
): void {
  const current = loaded.projection.current;
  const available = new Map<string | null, number>([[null, current.unassignedMinor]]);
  for (const totals of current.envelopes) available.set(totals.envelopeId, totals.leftMinor);

  for (const [index, item] of items.entries()) {
    assertAffordable(available, item, index);
    if (isCurrent || item.fromEnvelopeId === null) {
      adjust(available, item.fromEnvelopeId, -item.amountMinor);
    }
    if (isCurrent || item.toEnvelopeId === null) {
      adjust(available, item.toEnvelopeId, item.amountMinor);
    }
  }
}

function assertAffordable(
  available: ReadonlyMap<string | null, number>,
  item: AssignmentItem,
  index: number,
): void {
  for (const id of [item.fromEnvelopeId, item.toEnvelopeId]) {
    if (id !== null && !available.has(id)) {
      throw new V2ApiError(404, "envelope_not_found", "An envelope was not found.", {
        envelopeId: id,
      });
    }
  }
  const source = Math.max(available.get(item.fromEnvelopeId) ?? 0, 0);
  if (item.amountMinor > source) {
    throw new V2ApiError(
      409,
      "insufficient_funds",
      "There isn't enough to move. Lower the amount.",
      { index, availableMinor: source },
    );
  }
}

function adjust(available: Map<string | null, number>, id: string | null, deltaMinor: number) {
  available.set(id, (available.get(id) ?? 0) + deltaMinor);
}

/** Per-envelope totals for one period since activation. */
export async function getBudgetPeriod(
  context: V2LedgerContext,
  start: string,
  today: string,
): Promise<V2BudgetPeriodView> {
  const budget = await findBudget(context.db, context.ledgerId);
  if (!budget) throw new V2ApiError(404, "budget_not_found", "This ledger has no budget.");
  const { projection } = await loadBudget(context.db, budget, today);
  const found = projection.periods.find((totals) => totals.period.start === start);
  if (!found) throw new V2ApiError(404, "period_not_found", "This is not a period of your budget.");
  return {
    period: found.period,
    envelopes: found.envelopes.map((totals) => ({
      id: totals.envelopeId,
      plannedMinor: totals.plannedMinor,
      spentMinor: totals.spentMinor,
      rolloverMinor: totals.rolloverMinor,
      leftMinor: totals.leftMinor,
    })),
  };
}

/** Plans may target the current period or one of the next few starts, never the past. */
function assertPeriodStart(loaded: LoadedBudget, periodStart: string): void {
  let start = loaded.projection.current.period.start;
  for (let ahead = 0; ahead <= MAX_FUTURE_PERIODS; ahead += 1) {
    if (start === periodStart) return;
    start = nextPeriodStart(ruleInEffect(loaded.paydays, start), start);
  }
  throw new V2ApiError(422, "invalid_period_start", "Pick the current period or an upcoming one.", {
    periodStart,
  });
}
