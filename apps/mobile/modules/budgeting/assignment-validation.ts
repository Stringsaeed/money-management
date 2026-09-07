import { format, isValid, parseISO } from "date-fns";
import type { SQLiteDatabase } from "@/db/sqlite";

import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import { loadAccountDependencyFacts } from "./account-dependency-read";
import { getProjection } from "./projection";
import type { BudgetProjection, MoveMoneyRequest } from "./types";
import { requireCurrency, requireMinorUnits, requirePeriod } from "./validation";

export function validateMoveRequest(
  request: MoveMoneyRequest,
  options: { allowPastPeriod?: boolean } = {},
): string {
  const currency = requireCurrency(request.currency);
  requirePeriod(request.period);
  requireMinorUnits(request.amountMinor, currency);
  if (request.amountMinor <= 0) throw new Error("Move Money amount must be a positive integer.");
  if (!request.id.trim()) throw new Error("Move Money requires an Assignment ID.");
  const currentPeriod = periodFromTimestamp(request.now);
  if (request.sourceEnvelopeId === null && request.destinationEnvelopeId === null) {
    throw new Error("Move Money needs a source or destination Envelope.");
  }
  if (!options.allowPastPeriod && request.period < currentPeriod) {
    throw new Error("Move Money is available for the current or a future Budget Period.");
  }
  return currentPeriod;
}

export async function validateEndpoints(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
): Promise<void> {
  const ids = [request.sourceEnvelopeId, request.destinationEnvelopeId].filter(
    (id): id is string => id !== null,
  );
  if (ids.length === 0) throw new Error("Move Money needs a source or destination Envelope.");
  if (new Set(ids).size !== ids.length) {
    throw new Error("Move Money source and destination must be different.");
  }
  const placeholders = ids.map(() => "?").join(", ");
  const envelopes = await database.getAllAsync<{ id: string; currency: string; lifecycle: string }>(
    `SELECT id, currency, lifecycle FROM envelopes WHERE id IN (${placeholders})`,
    ...ids,
  );
  if (envelopes.length !== ids.length) {
    throw new Error("Move Money references an unknown Envelope.");
  }
  for (const envelope of envelopes) {
    if (envelope.currency !== request.currency) {
      throw new Error("Move Money cannot cross currency workspaces.");
    }
    if (envelope.lifecycle !== "active") {
      throw new Error("Move Money requires active Envelopes.");
    }
  }
}

export async function requireProjection(
  database: SQLiteDatabase,
  currency: string,
  period: string,
): Promise<BudgetProjection> {
  const projection = await getProjection(database, { currency, period });
  if (!projection) throw new Error(`The ${currency} budget is unavailable for ${period}.`);
  return projection;
}

export function assertSourceHasMoney(
  request: MoveMoneyRequest,
  projection: BudgetProjection,
): void {
  const source = request.sourceEnvelopeId
    ? projection.envelopes.find(({ id }) => id === request.sourceEnvelopeId)?.availableMoney
    : projection.unassignedMoney;
  if (!source) throw new Error("Move Money source is unavailable in this Budget Period.");
  if (request.amountMinor > source.amountMinor) {
    throw new Error("Move Money cannot consume more Money than the source owns.");
  }
}

export async function assertMoveCanUseSource(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
  projection: BudgetProjection,
  currentPeriod: string,
): Promise<void> {
  if (request.sourceEnvelopeId) {
    assertSourceHasMoney(request, projection);
    return;
  }
  const currentProjection =
    request.period === currentPeriod
      ? projection
      : await requireProjection(database, request.currency, currentPeriod);
  if (request.amountMinor > currentProjection.unassignedMoney.amountMinor) {
    throw new Error("Move Money cannot consume more Money than the source owns.");
  }
}

export async function assertFutureMoveIsAllowed(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
  currentPeriod: string,
): Promise<void> {
  if (request.period <= currentPeriod) return;

  const currentProjection = await requireProjection(database, request.currency, currentPeriod);
  const hasCashOverspending = currentProjection.envelopes.some(
    (envelope) => envelope.availableMoney.amountMinor < 0,
  );
  const facts = await loadAccountDependencyFacts(database, request.currency, currentPeriod);
  const hasUnfundedCardSpending = facts
    ? evaluateCardBudgetState(facts, currentPeriod).unfunded.some(
        (entry) => entry.remainingMinor > 0,
      )
    : false;
  if (hasCashOverspending || hasUnfundedCardSpending) {
    throw new Error(
      "Resolve cash Envelope Overspending and Unfunded Card Spending before planning a future Budget Period.",
    );
  }
}

function periodFromTimestamp(now: string): string {
  const timestamp = parseISO(now);
  if (!isValid(timestamp)) {
    throw new Error("Move Money requires a valid creation timestamp.");
  }
  return format(timestamp, "yyyy-MM");
}
