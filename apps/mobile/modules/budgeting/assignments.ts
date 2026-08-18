import { format, isValid, parseISO } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import { loadAccountDependencyFacts } from "./account-dependency-read";
import { getProjection } from "./projection";
import type {
  AssignmentHistoryEntry,
  AssignmentHistoryRequest,
  CorrectMoveMoneyRequest,
  BudgetProjection,
  MoveMoneyPreview,
  MoveMoneyRequest,
  MoveMoneyBalance,
  MoveMoneyEndpoint,
} from "./types";
import { addMoney, requireCurrency, requireMinorUnits, requirePeriod } from "./validation";

interface AssignmentRow extends AssignmentHistoryEntry {
  reversesAssignmentId: string | null;
}

export async function previewMoveMoney(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
): Promise<MoveMoneyPreview> {
  const currentPeriod = validateMoveRequest(request);
  const projection = await requireProjection(database, request.currency, request.period);
  await validateEndpoints(database, request);
  await assertMoveCanUseSource(database, request, projection, currentPeriod);
  await assertFutureMoveIsAllowed(database, request, currentPeriod);
  return buildPreview(database, request, projection);
}

export async function moveMoney(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
): Promise<BudgetProjection> {
  const currentPeriod = validateMoveRequest(request);
  await runInTransaction(database, async (transaction) => {
    const projection = await requireProjection(transaction, request.currency, request.period);
    await validateEndpoints(transaction, request);
    await assertMoveCanUseSource(transaction, request, projection, currentPeriod);
    await assertFutureMoveIsAllowed(transaction, request, currentPeriod);
    await insertAssignment(transaction, request);
  });
  const projection = await requireProjection(database, request.currency, request.period);
  return projection;
}

export async function previewCorrectMoveMoney(
  database: SQLiteDatabase,
  request: CorrectMoveMoneyRequest,
): Promise<MoveMoneyPreview> {
  validateMoveRequest(request, { allowPastPeriod: true });
  const original = await requireCorrectableAssignment(database, request);
  const projection = await requireProjection(database, request.currency, request.period);
  const reversal = createReversalRequest(original, request);
  await validateEndpoints(database, reversal);
  assertSourceHasMoney(reversal, projection);
  const afterReversal = applyMoveToProjection(projection, reversal);
  await validateEndpoints(database, request);
  assertSourceHasMoney(request, afterReversal);
  return buildPreview(database, request, afterReversal);
}

export async function correctMoveMoney(
  database: SQLiteDatabase,
  request: CorrectMoveMoneyRequest,
): Promise<BudgetProjection> {
  validateMoveRequest(request, { allowPastPeriod: true });
  await runInTransaction(database, async (transaction) => {
    const original = await requireCorrectableAssignment(transaction, request);

    const projection = await requireProjection(transaction, request.currency, request.period);
    const reversal = createReversalRequest(original, request);
    await validateEndpoints(transaction, reversal);
    assertSourceHasMoney(reversal, projection);
    await insertAssignment(transaction, reversal, original.id);

    const afterReversal = applyMoveToProjection(projection, reversal);
    assertSourceHasMoney(request, afterReversal);
    await validateEndpoints(transaction, request);
    await insertAssignment(transaction, request, reversal.id);
  });
  return requireProjection(database, request.currency, request.period);
}

async function requireCorrectableAssignment(
  database: SQLiteDatabase,
  request: CorrectMoveMoneyRequest,
): Promise<AssignmentRow> {
  if (!request.originalAssignmentId.trim() || !request.reversalId.trim()) {
    throw new Error("Assignment correction requires original and reversal IDs.");
  }
  const original = await database.getFirstAsync<AssignmentRow>(
    `SELECT id, currency, budget_period AS budgetPeriod,
            source_envelope_id AS sourceEnvelopeId,
            destination_envelope_id AS destinationEnvelopeId,
            amount_minor AS amountMinor,
            reverses_assignment_id AS reversesAssignmentId,
            created_at AS createdAt
     FROM assignments WHERE id = ?`,
    request.originalAssignmentId,
  );
  if (!original) throw new Error(`Assignment ${request.originalAssignmentId} does not exist.`);
  if (original.reversesAssignmentId) {
    throw new Error("Only an original Assignment can be corrected.");
  }
  if (original.currency !== request.currency || original.budgetPeriod !== request.period) {
    throw new Error("Assignment correction must stay in the original currency and period.");
  }
  const existingCorrection = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM assignments WHERE reverses_assignment_id = ?",
    request.originalAssignmentId,
  );
  if (existingCorrection) throw new Error("Assignment has already been corrected.");
  return original;
}

function createReversalRequest(
  original: AssignmentRow,
  request: CorrectMoveMoneyRequest,
): MoveMoneyRequest {
  return {
    id: request.reversalId,
    currency: request.currency,
    period: request.period,
    sourceEnvelopeId: original.destinationEnvelopeId,
    destinationEnvelopeId: original.sourceEnvelopeId,
    amountMinor: original.amountMinor,
    now: request.now,
  };
}

export async function getAssignmentHistory(
  database: SQLiteDatabase,
  request: AssignmentHistoryRequest,
): Promise<AssignmentHistoryEntry[]> {
  const currency = requireCurrency(request.currency);
  const period = requirePeriod(request.period);
  const rows = await database.getAllAsync<AssignmentRow>(
    `SELECT id, currency, budget_period AS budgetPeriod,
            source_envelope_id AS sourceEnvelopeId,
            destination_envelope_id AS destinationEnvelopeId,
            amount_minor AS amountMinor,
            reverses_assignment_id AS reversesAssignmentId,
            created_at AS createdAt
     FROM assignments
     WHERE currency = ? AND budget_period = ?
     ORDER BY created_at, rowid`,
    currency,
    period,
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows.map((row) => ({
    ...row,
    kind: row.reversesAssignmentId
      ? byId.get(row.reversesAssignmentId)?.reversesAssignmentId
        ? "replacement"
        : "reversal"
      : "original",
  }));
}

async function insertAssignment(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
  reversesAssignmentId: string | null = null,
): Promise<void> {
  await database.runAsync(
    `INSERT INTO assignments (
      id, currency, budget_period, source_envelope_id, destination_envelope_id,
      amount_minor, reverses_assignment_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    request.id,
    request.currency,
    request.period,
    request.sourceEnvelopeId,
    request.destinationEnvelopeId,
    request.amountMinor,
    reversesAssignmentId,
    request.now,
  );
}

async function validateEndpoints(
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
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  const envelopes = await database.getAllAsync<{ id: string; currency: string; lifecycle: string }>(
    `SELECT id, currency, lifecycle FROM envelopes WHERE id IN (${placeholders})`,
    ...ids,
  );
  if (envelopes.length !== ids.length)
    throw new Error("Move Money references an unknown Envelope.");
  for (const envelope of envelopes) {
    if (envelope.currency !== request.currency) {
      throw new Error("Move Money cannot cross currency workspaces.");
    }
    if (envelope.lifecycle !== "active") {
      throw new Error("Move Money requires active Envelopes.");
    }
  }
}

function validateMoveRequest(
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

async function requireProjection(
  database: SQLiteDatabase,
  currency: string,
  period: string,
): Promise<BudgetProjection> {
  const projection = await getProjection(database, { currency, period });
  if (!projection) throw new Error(`The ${currency} budget is unavailable for ${period}.`);
  return projection;
}

function assertSourceHasMoney(request: MoveMoneyRequest, projection: BudgetProjection): void {
  const source = request.sourceEnvelopeId
    ? projection.envelopes.find(({ id }) => id === request.sourceEnvelopeId)?.availableMoney
    : projection.unassignedMoney;
  if (!source) throw new Error("Move Money source is unavailable in this Budget Period.");
  if (request.amountMinor > source.amountMinor) {
    throw new Error("Move Money cannot consume more Money than the source owns.");
  }
}

async function assertMoveCanUseSource(
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
  const reservationMinor = await getFutureUnassignedReservationMinor(
    database,
    request.currency,
    currentPeriod,
  );
  const availableMinor = addMoney(
    currentProjection.unassignedMoney.amountMinor,
    -reservationMinor,
    request.currency,
  );
  if (request.amountMinor > availableMinor) {
    throw new Error("Move Money cannot consume more Money than the source owns.");
  }
}

async function assertFutureMoveIsAllowed(
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

async function getFutureUnassignedReservationMinor(
  database: SQLiteDatabase,
  currency: string,
  currentPeriod: string,
): Promise<number> {
  const assignments = await database.getAllAsync<{
    amountMinor: number;
    destinationEnvelopeId: string | null;
    sourceEnvelopeId: string | null;
  }>(
    `SELECT amount_minor AS amountMinor,
            source_envelope_id AS sourceEnvelopeId,
            destination_envelope_id AS destinationEnvelopeId
     FROM assignments
     WHERE currency = ? AND budget_period > ?`,
    currency,
    currentPeriod,
  );
  return assignments.reduce((reservationMinor, assignment) => {
    const unassignedDeltaMinor =
      assignment.sourceEnvelopeId === null
        ? assignment.amountMinor
        : assignment.destinationEnvelopeId === null
          ? -assignment.amountMinor
          : 0;
    return addMoney(reservationMinor, unassignedDeltaMinor, currency);
  }, 0);
}

function periodFromTimestamp(now: string): string {
  const timestamp = parseISO(now);
  if (!isValid(timestamp)) {
    throw new Error("Move Money requires a valid creation timestamp.");
  }
  return format(timestamp, "yyyy-MM");
}

function applyMoveToProjection(
  projection: BudgetProjection,
  request: MoveMoneyRequest,
): BudgetProjection {
  const result = structuredClone(projection);
  if (request.sourceEnvelopeId) {
    const source = result.envelopes.find(({ id }) => id === request.sourceEnvelopeId);
    if (source) source.availableMoney.amountMinor -= request.amountMinor;
  } else {
    result.unassignedMoney.amountMinor -= request.amountMinor;
  }
  if (request.destinationEnvelopeId) {
    const destination = result.envelopes.find(({ id }) => id === request.destinationEnvelopeId);
    if (destination) destination.availableMoney.amountMinor += request.amountMinor;
  } else {
    result.unassignedMoney.amountMinor += request.amountMinor;
  }
  return result;
}

async function buildPreview(
  database: SQLiteDatabase,
  request: MoveMoneyRequest,
  projection: BudgetProjection,
): Promise<MoveMoneyPreview> {
  const after = applyMoveToProjection(projection, request);
  const beforeSource = endpointBalance(projection, request.sourceEnvelopeId);
  const afterSource = endpointBalance(after, request.sourceEnvelopeId);
  const beforeDestination = endpointBalance(projection, request.destinationEnvelopeId);
  const afterDestination = endpointBalance(after, request.destinationEnvelopeId);
  let cashOverspendingMinor = 0;
  let unfundedCardSpendingMinor = 0;
  if (request.destinationEnvelopeId) {
    cashOverspendingMinor = Math.min(
      Math.max(-beforeDestination.amountMinor, 0),
      request.amountMinor,
    );
    const facts = await loadAccountDependencyFacts(database, request.currency, request.period);
    if (facts) {
      const state = evaluateCardBudgetState(facts, request.period);
      const existingUnfunded = state.unfunded
        .filter(({ envelopeId }) => envelopeId === request.destinationEnvelopeId)
        .reduce((total, entry) => addMoney(total, entry.remainingMinor, request.currency), 0);
      unfundedCardSpendingMinor = Math.min(
        request.amountMinor - cashOverspendingMinor,
        existingUnfunded,
      );
    }
  }
  return {
    currency: request.currency,
    period: request.period,
    amountMinor: request.amountMinor,
    source: { envelopeId: request.sourceEnvelopeId, before: beforeSource, after: afterSource },
    destination: {
      envelopeId: request.destinationEnvelopeId,
      before: beforeDestination,
      after: afterDestination,
    },
    deficitRouting: {
      cashOverspendingMinor,
      unfundedCardSpendingMinor,
      newAvailabilityMinor: request.amountMinor - cashOverspendingMinor - unfundedCardSpendingMinor,
    },
  };
}

function endpointBalance(
  projection: BudgetProjection,
  endpoint: MoveMoneyEndpoint,
): MoveMoneyBalance {
  if (!endpoint) return projection.unassignedMoney;
  return (
    projection.envelopes.find(({ id }) => id === endpoint)?.availableMoney ?? {
      currency: projection.currency,
      amountMinor: 0,
    }
  );
}
