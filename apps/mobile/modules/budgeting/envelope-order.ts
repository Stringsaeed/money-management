import type { SQLiteDatabase } from "expo-sqlite";

export async function prepareEnvelopeOrder(
  database: SQLiteDatabase,
  currency: string,
  requestedSortOrder: number | undefined,
): Promise<number> {
  const countRow = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM envelopes WHERE currency = ? AND lifecycle = 'active'`,
    currency,
  );
  const envelopeCount = countRow?.count ?? 0;
  const sortOrder = requestedSortOrder ?? envelopeCount;
  requireSortOrder(sortOrder, envelopeCount);
  await database.runAsync(
    `UPDATE envelopes
     SET sort_order = sort_order + 1
     WHERE currency = ? AND lifecycle = 'active' AND sort_order >= ?`,
    currency,
    sortOrder,
  );
  return sortOrder;
}

export async function updateEnvelopeOrder(
  database: SQLiteDatabase,
  request: {
    envelopeId: string;
    currency: string;
    currentSortOrder: number;
    requestedSortOrder: number | undefined;
  },
): Promise<number> {
  const countRow = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM envelopes WHERE currency = ? AND lifecycle = 'active'`,
    request.currency,
  );
  const maximumSortOrder = Math.max(0, (countRow?.count ?? 1) - 1);
  const sortOrder = request.requestedSortOrder ?? request.currentSortOrder;
  requireSortOrder(sortOrder, maximumSortOrder);
  await reorderEnvelope(database, { ...request, nextSortOrder: sortOrder });
  return sortOrder;
}

function requireSortOrder(sortOrder: number, maximum: number): void {
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > maximum) {
    throw new Error(`Envelope order must be an integer from 0 through ${maximum}.`);
  }
}

async function reorderEnvelope(
  database: SQLiteDatabase,
  request: {
    envelopeId: string;
    currency: string;
    currentSortOrder: number;
    nextSortOrder: number;
  },
): Promise<void> {
  if (request.nextSortOrder === request.currentSortOrder) return;
  if (request.nextSortOrder < request.currentSortOrder) {
    await database.runAsync(
      `UPDATE envelopes
       SET sort_order = sort_order + 1
       WHERE currency = ? AND lifecycle = 'active' AND id <> ?
         AND sort_order >= ? AND sort_order < ?`,
      request.currency,
      request.envelopeId,
      request.nextSortOrder,
      request.currentSortOrder,
    );
    return;
  }
  await database.runAsync(
    `UPDATE envelopes
     SET sort_order = sort_order - 1
     WHERE currency = ? AND lifecycle = 'active' AND id <> ?
       AND sort_order > ? AND sort_order <= ?`,
    request.currency,
    request.envelopeId,
    request.currentSortOrder,
    request.nextSortOrder,
  );
}
