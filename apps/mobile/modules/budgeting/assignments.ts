import type { SQLiteDatabase } from "@/db/sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { type AccountDependencyFacts, loadAccountDependencyFacts } from "./account-dependency-read";
import { applyMoveToProjection, buildMoveMoneyPreview } from "./assignment-preview";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";
import {
  createReversalRequest,
  insertAssignment,
  requireCorrectableAssignment,
} from "./assignment-persistence";
import {
  assertFutureMoveIsAllowed,
  assertMoveCanUseSource,
  assertSourceHasMoney,
  requireProjection,
  validateEndpoints,
  validateMoveRequest,
} from "./assignment-validation";
import type {
  BudgetProjection,
  CorrectMoveMoneyRequest,
  MoveMoneyPreview,
  MoveMoneyRequest,
} from "./types";

export { getAssignmentHistory } from "./assignment-persistence";

interface CorrectionPlan {
  afterReversal: BudgetProjection;
  factsAfterReversal: AccountDependencyFacts | null;
  originalId: string;
  reversal: MoveMoneyRequest;
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
  return buildMoveMoneyPreview(database, request, projection);
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
  return requireProjection(database, request.currency, request.period);
}

export async function previewCorrectMoveMoney(
  database: SQLiteDatabase,
  request: CorrectMoveMoneyRequest,
): Promise<MoveMoneyPreview> {
  const correction = await prepareCorrection(database, request);
  return buildMoveMoneyPreview(
    database,
    request,
    correction.afterReversal,
    correction.factsAfterReversal,
  );
}

export async function correctMoveMoney(
  database: SQLiteDatabase,
  request: CorrectMoveMoneyRequest,
): Promise<BudgetProjection> {
  await runInTransaction(database, async (transaction) => {
    const correction = await prepareCorrection(transaction, request);
    await insertAssignment(transaction, correction.reversal, correction.originalId);
    await insertAssignment(transaction, request, correction.reversal.id);
  });
  return requireProjection(database, request.currency, request.period);
}

async function prepareCorrection(
  database: SQLiteDatabase,
  request: CorrectMoveMoneyRequest,
): Promise<CorrectionPlan> {
  const currentPeriod = validateMoveRequest(request, { allowPastPeriod: true });
  await assertFutureMoveIsAllowed(database, request, currentPeriod);
  const original = await requireCorrectableAssignment(database, request);
  const projection = await requireProjection(database, request.currency, request.period);
  const reversal = createReversalRequest(original, request);
  const facts = await loadAccountDependencyFacts(database, request.currency, request.period);
  await validateEndpoints(database, reversal);
  // This linked fact cancels the loaded original; only the replacement is a new source claim.
  const factsAfterReversal = facts
    ? {
        ...facts,
        assignments: [
          ...facts.assignments,
          {
            id: reversal.id,
            currency: reversal.currency,
            period: reversal.period,
            sourceEnvelopeId: reversal.sourceEnvelopeId,
            destinationEnvelopeId: reversal.destinationEnvelopeId,
            amountMinor: reversal.amountMinor,
            reversesAssignmentId: original.id,
          },
        ],
      }
    : null;
  const afterReversal = applyReversalToProjection(projection, reversal, factsAfterReversal);
  await validateEndpoints(database, request);
  assertSourceHasMoney(request, afterReversal);
  return { afterReversal, factsAfterReversal, originalId: original.id, reversal };
}

function applyReversalToProjection(
  projection: BudgetProjection,
  reversal: MoveMoneyRequest,
  facts: AccountDependencyFacts | null,
): BudgetProjection {
  const afterReversal = applyMoveToProjection(projection, reversal);
  if (!facts) return afterReversal;
  const availability = evaluateCardBudgetState(facts, reversal.period).availability;
  return {
    ...afterReversal,
    envelopes: afterReversal.envelopes.map((envelope) => ({
      ...envelope,
      availableMoney: {
        ...envelope.availableMoney,
        amountMinor: availability.get(envelope.id) ?? 0,
      },
    })),
  };
}
