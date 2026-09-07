import type { SQLiteDatabase } from "@/db/sqlite";

import type {
  AssignmentHistoryEntry,
  AssignmentHistoryRequest,
  CorrectMoveMoneyRequest,
  MoveMoneyRequest,
} from "./types";
import { requireCurrency, requirePeriod } from "./validation";

export interface AssignmentRow extends AssignmentHistoryEntry {
  reversesAssignmentId: string | null;
}

export async function requireCorrectableAssignment(
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

export function createReversalRequest(
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

export async function insertAssignment(
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
