import { isMatch, isValid, parseISO } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

export interface CategoryLifecycleRequest {
  categoryId: string;
  localDate: string;
  now: string;
}

export interface CategoryDeletionPreview {
  categoryId: string;
  transactionCount: number;
  recurringRuleCount: number;
  mappingCount: number;
  childCount: number;
  canDelete: boolean;
}

export class CategoryHasHistoryError extends Error {
  constructor(readonly preview: CategoryDeletionPreview) {
    super(
      `Category ${preview.categoryId} carries dependent history. Archive it to preserve its financial history.`,
    );
    this.name = "CategoryHasHistoryError";
  }
}

export async function archiveCategory(
  database: SQLiteDatabase,
  request: CategoryLifecycleRequest,
): Promise<void> {
  const period = periodForLedgerDate(request.localDate);

  await runInTransaction(database, async (transaction) => {
    await requireCategoryLifecycle(transaction, request.categoryId, "active");
    await transaction.runAsync(
      `UPDATE categories
       SET lifecycle = 'archived', lifecycle_changed_at = ?, updated_at = ?
       WHERE id = ?`,
      request.now,
      request.now,
      request.categoryId,
    );
    await transaction.runAsync(
      `UPDATE category_mappings
       SET effective_to_period = ?
       WHERE category_id = ?
         AND effective_from_period <= ?
         AND (effective_to_period IS NULL OR effective_to_period > ?)`,
      period,
      request.categoryId,
      period,
      period,
    );
    await transaction.runAsync(
      `DELETE FROM category_mappings
       WHERE category_id = ? AND effective_from_period > ?`,
      request.categoryId,
      period,
    );
    await markActiveRulesForArchivedCategory(transaction, request.categoryId, request.now);
  });
}

async function markActiveRulesForArchivedCategory(
  database: SQLiteDatabase,
  categoryId: string,
  now: string,
): Promise<void> {
  const reason = JSON.stringify([{ kind: "archived-category", categoryId }]);
  await database.runAsync(
    `UPDATE recurring_rules
     SET health = 'needs_attention', attention_reasons = ?, revision = revision + 1,
         health_changed_at = CASE WHEN health = 'needs_attention' THEN health_changed_at ELSE ? END,
         updated_at = ?
     WHERE category_id = ? AND lifecycle = 'active' AND health = 'ready'`,
    reason,
    now,
    now,
    categoryId,
  );
}

export async function restoreCategory(
  database: SQLiteDatabase,
  request: Pick<CategoryLifecycleRequest, "categoryId" | "now">,
): Promise<void> {
  await runInTransaction(database, async (transaction) => {
    await requireCategoryLifecycle(transaction, request.categoryId, "archived");
    await transaction.runAsync(
      `UPDATE categories
       SET lifecycle = 'active', lifecycle_changed_at = ?, updated_at = ?
       WHERE id = ?`,
      request.now,
      request.now,
      request.categoryId,
    );
  });
}

export async function previewCategoryDeletion(
  database: SQLiteDatabase,
  categoryId: string,
): Promise<CategoryDeletionPreview> {
  await requireCategory(database, categoryId);
  const counts = await database.getFirstAsync<{
    transactionCount: number;
    recurringRuleCount: number;
    mappingCount: number;
    childCount: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM transactions WHERE category_id = ?) AS transactionCount,
      (SELECT COUNT(*) FROM recurring_rules WHERE category_id = ?) AS recurringRuleCount,
      (SELECT COUNT(*) FROM category_mappings WHERE category_id = ?) AS mappingCount,
      (SELECT COUNT(*) FROM categories WHERE parent_id = ?) AS childCount`,
    categoryId,
    categoryId,
    categoryId,
    categoryId,
  );
  if (!counts) throw new Error(`Could not inspect Category ${categoryId} dependencies.`);
  return {
    categoryId,
    ...counts,
    canDelete: Object.values(counts).every((count) => count === 0),
  };
}

export async function deleteCategory(database: SQLiteDatabase, categoryId: string): Promise<void> {
  await runInTransaction(database, async (transaction) => {
    const preview = await previewCategoryDeletion(transaction, categoryId);
    if (!preview.canDelete) throw new CategoryHasHistoryError(preview);
    await transaction.runAsync("DELETE FROM categories WHERE id = ?", categoryId);
  });
}

async function requireCategory(database: SQLiteDatabase, categoryId: string): Promise<void> {
  const category = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM categories WHERE id = ?",
    categoryId,
  );
  if (!category) throw new Error(`Category ${categoryId} does not exist.`);
}

async function requireCategoryLifecycle(
  database: SQLiteDatabase,
  categoryId: string,
  expectedLifecycle: "active" | "archived",
): Promise<void> {
  const category = await database.getFirstAsync<{ lifecycle: string }>(
    "SELECT lifecycle FROM categories WHERE id = ?",
    categoryId,
  );
  if (!category) throw new Error(`Category ${categoryId} does not exist.`);
  if (category.lifecycle !== expectedLifecycle) {
    throw new Error(
      `Category ${categoryId} must be ${expectedLifecycle} for this lifecycle change.`,
    );
  }
}

function periodForLedgerDate(localDate: string): string {
  if (!isMatch(localDate, "yyyy-MM-dd") || !isValid(parseISO(localDate))) {
    throw new Error(
      `Category lifecycle requires a valid local Ledger Date, received ${localDate}.`,
    );
  }
  return localDate.slice(0, 7);
}
