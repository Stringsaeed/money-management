import {
  IMPORT_ENTITY_TYPES,
  MAX_IMPORT_CHUNK_ROWS,
  type ImportBundlePayload,
  type ImportEntityType,
} from "@trove/protocol";

import { accounts, categories, transactions } from "@/db/schema";

import type { LocalDb } from "./manifest";

/**
 * Builds every `import_bundle` chunk for the local-to-cloud migration (#98),
 * in `IMPORT_ENTITY_TYPES` order so a later chunk's references (account
 * before transaction) already exist server-side by the time it lands.
 * Entity types with no local rows are skipped entirely.
 */
export async function buildImportChunks(db: LocalDb): Promise<readonly ImportBundlePayload[]> {
  const chunks: ImportBundlePayload[] = [];
  for (const entityType of IMPORT_ENTITY_TYPES) {
    const rows = await loadWireRows(db, entityType);
    if (rows.length === 0) {
      continue;
    }
    const chunkCount = Math.ceil(rows.length / MAX_IMPORT_CHUNK_ROWS);
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const start = chunkIndex * MAX_IMPORT_CHUNK_ROWS;
      chunks.push({
        entityType,
        chunkIndex,
        chunkCount,
        rows: rows.slice(start, start + MAX_IMPORT_CHUNK_ROWS),
      });
    }
  }
  return chunks;
}

async function loadWireRows(
  db: LocalDb,
  entityType: ImportEntityType,
): Promise<readonly Record<string, unknown>[]> {
  switch (entityType) {
    case "account": {
      const rows = await db.select().from(accounts);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        initialBalanceMinor: row.initialBalance,
        excludeFromTotal: row.excludeFromTotal,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "category": {
      const rows = await db.select().from(categories);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon,
        parentId: row.parentId,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "transaction": {
      const rows = await db.select().from(transactions);
      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        amountMinor: row.amount,
        currency: row.currency,
        originalAmountMinor: row.originalAmount,
        originalCurrency: row.originalCurrency,
        exchangeRate: row.exchangeRate,
        date: row.date,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId: row.categoryId,
        isRecurring: row.isRecurring,
        recurringRuleId: row.recurringRuleId,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
  }
}
