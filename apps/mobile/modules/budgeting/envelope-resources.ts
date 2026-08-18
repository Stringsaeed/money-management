import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { replaceEnvelopeMappings } from "./envelope-mappings";
import { prepareEnvelopeOrder, updateEnvelopeOrder } from "./envelope-order";
import {
  requireCategoryIds,
  requireChangedCategoryIds,
  requireEditableEnvelopeCategoryIds,
  requireEligibleEnvelopeCategories,
  requireEnvelopeFields,
  requireEnvelopeWorkspace,
  requireRestoredCategoryConfirmation,
} from "./envelope-validation";
import { getProjection } from "./projection";
import type { BudgetProjection, CreateEnvelopeRequest, UpdateEnvelopeRequest } from "./types";
import { periodForLocalDate, requireCurrency } from "./validation";

export async function createEnvelope(
  database: SQLiteDatabase,
  request: CreateEnvelopeRequest,
): Promise<BudgetProjection> {
  const currency = requireCurrency(request.currency);
  const period = periodForLocalDate(request.localDate);
  const categoryIds = requireCategoryIds(request.categoryIds);
  requireEnvelopeFields(request);
  if (!request.id.trim()) throw new Error("Envelope ID is required.");

  return runInTransaction(database, async (transaction) => {
    await requireEnvelopeWorkspace(transaction, currency, period);
    const categoryRows = await requireEligibleEnvelopeCategories(
      transaction,
      categoryIds,
      currency,
      period,
    );
    requireRestoredCategoryConfirmation(
      categoryRows,
      request.confirmedRestoredCategoryIds,
      request.id,
    );
    const sortOrder = await prepareEnvelopeOrder(transaction, currency, request.sortOrder);
    await transaction.runAsync(
      `INSERT INTO envelopes (
        id, currency, name, icon, color, lifecycle, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      request.id,
      currency,
      request.name.trim(),
      request.icon,
      request.color,
      sortOrder,
      request.now,
      request.now,
    );
    await replaceEnvelopeMappings(transaction, {
      selectedCategories: categoryRows,
      affectedCategoryIds: categoryIds,
      selectedCategoryIds: categoryIds,
      envelopeId: request.id,
      period,
      now: request.now,
    });
    await transaction.runAsync(
      `INSERT INTO rollover_settings (
        envelope_id, effective_from_period, positive_rollover, created_at
      ) VALUES (?, ?, ?, ?)`,
      request.id,
      period,
      request.positiveRollover ? 1 : 0,
      request.now,
    );

    const projection = await getProjection(transaction, { currency, period });
    if (!projection) throw new Error(`The ${currency} budget is unavailable for ${period}.`);
    return projection;
  });
}

export async function updateEnvelope(
  database: SQLiteDatabase,
  request: UpdateEnvelopeRequest,
): Promise<BudgetProjection> {
  const period = periodForLocalDate(request.localDate);
  const categoryIds = requireCategoryIds(request.categoryIds);
  const changedCategoryIds = requireChangedCategoryIds(request.changedCategoryIds);
  requireEnvelopeFields(request);

  return runInTransaction(database, async (transaction) => {
    const envelope = await transaction.getFirstAsync<{
      currency: string;
      lifecycle: "active" | "archived";
      sortOrder: number;
    }>(
      "SELECT currency, lifecycle, sort_order AS sortOrder FROM envelopes WHERE id = ?",
      request.envelopeId,
    );
    if (!envelope) throw new Error(`Envelope ${request.envelopeId} does not exist.`);
    if (envelope.lifecycle !== "active") {
      throw new Error("Restore this Envelope before editing it.");
    }
    await requireEnvelopeWorkspace(transaction, envelope.currency, period);
    const categoryRows = await requireEligibleEnvelopeCategories(
      transaction,
      categoryIds,
      envelope.currency,
      period,
    );
    requireRestoredCategoryConfirmation(
      categoryRows.filter((category) => changedCategoryIds.includes(category.id)),
      request.confirmedRestoredCategoryIds,
      request.envelopeId,
    );

    await requireEditableEnvelopeCategoryIds(transaction, changedCategoryIds);

    const currentAndFutureCategoryRows = await transaction.getAllAsync<{ categoryId: string }>(
      `SELECT category_id AS categoryId
       FROM category_mappings
       INNER JOIN categories ON categories.id = category_mappings.category_id
       WHERE envelope_id = ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)
         AND categories.lifecycle = 'active'
         AND categories.type = 'expense'`,
      request.envelopeId,
      period,
    );
    const selectedCategoryIds = new Set(categoryIds);
    const targetCategoryIds = new Set(
      currentAndFutureCategoryRows.map(({ categoryId }) => categoryId),
    );
    if (
      changedCategoryIds.some(
        (categoryId) =>
          !selectedCategoryIds.has(categoryId) && !targetCategoryIds.has(categoryId),
      )
    ) {
      throw new Error("A removed Category must currently map to the edited Envelope.");
    }
    await replaceEnvelopeMappings(transaction, {
      selectedCategories: categoryRows,
      affectedCategoryIds: changedCategoryIds,
      selectedCategoryIds: categoryIds,
      envelopeId: request.envelopeId,
      period,
      now: request.now,
    });

    const sortOrder = await updateEnvelopeOrder(transaction, {
      envelopeId: request.envelopeId,
      currency: envelope.currency,
      currentSortOrder: envelope.sortOrder,
      requestedSortOrder: request.sortOrder,
    });

    await transaction.runAsync(
      `UPDATE envelopes
       SET name = ?, icon = ?, color = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
      request.name.trim(),
      request.icon,
      request.color,
      sortOrder,
      request.now,
      request.envelopeId,
    );
    await transaction.runAsync(
      `DELETE FROM rollover_settings
       WHERE envelope_id = ? AND effective_from_period >= ?`,
      request.envelopeId,
      period,
    );
    await transaction.runAsync(
      `INSERT INTO rollover_settings (
        envelope_id, effective_from_period, positive_rollover, created_at
      ) VALUES (?, ?, ?, ?)`,
      request.envelopeId,
      period,
      request.positiveRollover ? 1 : 0,
      request.now,
    );

    const projection = await getProjection(transaction, { currency: envelope.currency, period });
    if (!projection) {
      throw new Error(`The ${envelope.currency} budget is unavailable for ${period}.`);
    }
    return projection;
  });
}
