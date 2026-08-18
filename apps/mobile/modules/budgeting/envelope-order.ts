import type { SQLiteDatabase } from "expo-sqlite";

export async function prepareEnvelopeOrder(
  database: SQLiteDatabase,
  currency: string,
  requestedSortOrder: number | undefined,
): Promise<number> {
  const envelopeCount = (await normalizeActiveEnvelopeOrders(database, currency)).length;
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
  const activeEnvelopeIds = await normalizeActiveEnvelopeOrders(database, request.currency);
  const currentSortOrder = activeEnvelopeIds.indexOf(request.envelopeId);
  if (currentSortOrder === -1) throw new Error(`Envelope ${request.envelopeId} is not active.`);
  const maximumSortOrder = Math.max(0, activeEnvelopeIds.length - 1);
  const requestedSortOrder = request.requestedSortOrder;
  const sortOrder =
    requestedSortOrder === undefined || requestedSortOrder === request.currentSortOrder
      ? currentSortOrder
      : requestedSortOrder;
  requireSortOrder(sortOrder, maximumSortOrder);
  await reorderEnvelope(database, { ...request, currentSortOrder, nextSortOrder: sortOrder });
  return sortOrder;
}

async function normalizeActiveEnvelopeOrders(
  database: SQLiteDatabase,
  currency: string,
): Promise<string[]> {
  const rows = await database.getAllAsync<{ id: string; sortOrder: number }>(
    `SELECT id, sort_order AS sortOrder
     FROM envelopes
     WHERE currency = ? AND lifecycle = 'active'
     ORDER BY sort_order, id`,
    currency,
  );
  for (const [sortOrder, row] of rows.entries()) {
    if (row.sortOrder === sortOrder) continue;
    await database.runAsync("UPDATE envelopes SET sort_order = ? WHERE id = ?", sortOrder, row.id);
  }
  return rows.map(({ id }) => id);
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
