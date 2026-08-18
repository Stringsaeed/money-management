import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { applyMoveToProjection, buildMoveMoneyPreview } from "./assignment-preview";
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
  validateMoveRequest(request, { allowPastPeriod: true });
  const original = await requireCorrectableAssignment(database, request);
  const projection = await requireProjection(database, request.currency, request.period);
  const reversal = createReversalRequest(original, request);
  await validateEndpoints(database, reversal);
  assertSourceHasMoney(reversal, projection);
  const afterReversal = applyMoveToProjection(projection, reversal);
  await validateEndpoints(database, request);
  assertSourceHasMoney(request, afterReversal);
  return buildMoveMoneyPreview(database, request, afterReversal);
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
