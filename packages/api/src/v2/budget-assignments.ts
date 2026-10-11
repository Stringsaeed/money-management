import { Effect } from "effect";
import type { z } from "zod";

import { nextPeriodStart, ruleInEffect } from "@trove/domain/budget";

import { budgetView, envelopeTotals, loadBudget, requireBudget, type LoadedBudget } from "./budget";
import {
  EnvelopeNotFound,
  InsufficientFunds,
  InvalidFutureSource,
  InvalidPeriodStart,
  PeriodNotFound,
} from "./budget-errors";
import { inLedgerMutation } from "./budget-mutation";
import { BudgetLedger, budgetActor, requirePlanAccess } from "./budget-services";
import { BudgetStore } from "./budget-store";
import type { assignmentsCreateSchema, V2BudgetPeriodView } from "./contracts";

/** How many periods ahead a plan may be written. */
const MAX_FUTURE_PERIODS = 24;

export type AssignmentsCreate = z.output<typeof assignmentsCreateSchema>;
type AssignmentItem = AssignmentsCreate["items"][number];

/**
 * Writes money moves (#371) atomically, one append-only row per item. Items
 * are checked in order against a running copy of the current projection, so an
 * earlier item can fund a later one. Nothing is written when any item fails.
 * Returns the refreshed budget so the client updates in one round trip.
 */
export const createAssignments = Effect.fn("createAssignments")(function* (
  input: AssignmentsCreate,
  idempotencyKey: string | undefined,
) {
  // Setting the plan is the admin's job; members still cover, move and hand back leftovers.
  if (input.items.some((item) => item.reason === "plan" || item.reason === "repeat")) {
    yield* requirePlanAccess;
  }
  return yield* inLedgerMutation("budget.assignments.create", idempotencyKey, writeMoves(input));
});

const writeMoves = Effect.fn("writeMoves")(function* (input: AssignmentsCreate) {
  const { ledgerId } = yield* BudgetLedger;
  const budget = yield* requireBudget;
  const loaded = yield* loadBudget(budget);
  const currentStart = loaded.projection.current.period.start;
  const periodStart = input.periodStart ?? currentStart;
  yield* requirePlannablePeriod(loaded, periodStart);
  yield* checkItems(loaded, input.items, periodStart === currentStart);

  const actor = yield* budgetActor;
  yield* (yield* BudgetStore).insertAssignments(
    input.items.map((item) => ({
      ledgerId,
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
  return budgetView(yield* loadBudget(budget));
});

/**
 * Walks the items against a running copy of the current balances. `null` is
 * Not planned yet; envelopes are keyed by id. A future period's plan changes
 * only Not planned yet today (futureAssigned); the current period also moves
 * the envelope balances.
 *
 * A future period may only be funded FROM Not planned yet: an envelope's
 * future-period balance is not today's Left, so taking from it would be checked
 * against the wrong number and would hand Not planned yet money it never had.
 */
const checkItems = Effect.fn("checkItems")(function* (
  loaded: LoadedBudget,
  items: readonly AssignmentItem[],
  isCurrent: boolean,
) {
  const current = loaded.projection.current;
  const available = new Map<string | null, number>([[null, current.unassignedMinor]]);
  for (const totals of current.envelopes) available.set(totals.envelopeId, totals.leftMinor);

  for (const [index, item] of items.entries()) {
    if (!isCurrent && item.fromEnvelopeId !== null) {
      return yield* new InvalidFutureSource({ index });
    }
    yield* requireAffordable(available, item, index);
    if (isCurrent || item.fromEnvelopeId === null) {
      adjust(available, item.fromEnvelopeId, -item.amountMinor);
    }
    if (isCurrent || item.toEnvelopeId === null) {
      adjust(available, item.toEnvelopeId, item.amountMinor);
    }
  }
});

function requireAffordable(
  available: ReadonlyMap<string | null, number>,
  item: AssignmentItem,
  index: number,
): Effect.Effect<void, EnvelopeNotFound | InsufficientFunds> {
  const unknown = [item.fromEnvelopeId, item.toEnvelopeId].find(
    (id) => id !== null && !available.has(id),
  );
  if (unknown) return Effect.fail(new EnvelopeNotFound({ envelopeId: unknown, source: "item" }));
  const availableMinor = Math.max(available.get(item.fromEnvelopeId) ?? 0, 0);
  return item.amountMinor > availableMinor
    ? Effect.fail(new InsufficientFunds({ index, availableMinor }))
    : Effect.void;
}

function adjust(available: Map<string | null, number>, id: string | null, deltaMinor: number) {
  available.set(id, (available.get(id) ?? 0) + deltaMinor);
}

/** Plans may target the current period or one of the next few starts, never the past. */
function requirePlannablePeriod(
  loaded: LoadedBudget,
  periodStart: string,
): Effect.Effect<void, InvalidPeriodStart> {
  let start = loaded.projection.current.period.start;
  for (let ahead = 0; ahead <= MAX_FUTURE_PERIODS; ahead += 1) {
    if (start === periodStart) return Effect.void;
    start = nextPeriodStart(ruleInEffect(loaded.paydays, start), start);
  }
  return Effect.fail(new InvalidPeriodStart({ periodStart }));
}

/** `GET /budget/periods/:start`: per-envelope totals for one period since activation. */
export const getBudgetPeriod = Effect.fn("getBudgetPeriod")(function* (start: string) {
  const { projection } = yield* loadBudget(yield* requireBudget);
  const found = projection.periods.find((totals) => totals.period.start === start);
  if (!found) return yield* new PeriodNotFound();
  return {
    period: found.period,
    envelopes: found.envelopes.map(envelopeTotals),
  } satisfies V2BudgetPeriodView;
});
