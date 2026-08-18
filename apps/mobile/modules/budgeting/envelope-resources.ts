import { addMonths, format, parseISO, subMonths } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import { runInTransaction } from "@/modules/recurring-rules/persistence";

import { getProjection } from "./projection";
import type { BudgetProjection, CreateEnvelopeRequest, UpdateEnvelopeRequest } from "./types";
import { periodForLocalDate, requireCurrency } from "./validation";

interface CategoryRow {
  id: string;
  lifecycle: "active" | "archived";
  lifecycleChangedAt: string | null;
  type: string;
  incompatibleTransactionCount: number;
  mappedEnvelopeId: string | null;
}

interface MappingValidationPoint {
  envelopeId: string;
  period: string;
}

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
    await requireWorkspace(transaction, currency, period);
    const categoryRows = await requireEligibleCategories(
      transaction,
      categoryIds,
      currency,
      period,
      true,
    );
    requireRestoredCategoryConfirmation(
      categoryRows,
      request.confirmedRestoredCategoryIds,
      request.id,
    );
    const countRow = await transaction.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM envelopes WHERE currency = ? AND lifecycle = 'active'`,
      currency,
    );
    const envelopeCount = countRow?.count ?? 0;
    const sortOrder = request.sortOrder ?? envelopeCount;
    requireSortOrder(sortOrder, envelopeCount);
    await transaction.runAsync(
      `UPDATE envelopes
       SET sort_order = sort_order + 1
       WHERE currency = ? AND lifecycle = 'active' AND sort_order >= ?`,
      currency,
      sortOrder,
    );
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
    await replaceEnvelopeMappings(
      transaction,
      categoryRows,
      categoryIds,
      categoryIds,
      request.id,
      period,
      request.now,
    );
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
    await requireWorkspace(transaction, envelope.currency, period);
    const categoryRows = await requireEligibleCategories(
      transaction,
      categoryIds,
      envelope.currency,
      period,
      true,
    );
    requireRestoredCategoryConfirmation(
      categoryRows,
      request.confirmedRestoredCategoryIds,
      request.envelopeId,
    );

    const currentAndFutureCategoryRows = await transaction.getAllAsync<{ categoryId: string }>(
      `SELECT category_id AS categoryId
       FROM category_mappings
       WHERE envelope_id = ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
      request.envelopeId,
      period,
    );
    const affectedCategoryIds = [
      ...new Set([
        ...categoryIds,
        ...currentAndFutureCategoryRows.map(({ categoryId }) => categoryId),
      ]),
    ];
    await replaceEnvelopeMappings(
      transaction,
      categoryRows,
      affectedCategoryIds,
      categoryIds,
      request.envelopeId,
      period,
      request.now,
    );

    const countRow = await transaction.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM envelopes WHERE currency = ? AND lifecycle = 'active'`,
      envelope.currency,
    );
    const maximumSortOrder = Math.max(0, (countRow?.count ?? 1) - 1);
    const sortOrder = request.sortOrder ?? envelope.sortOrder;
    requireSortOrder(sortOrder, maximumSortOrder);
    await reorderEnvelope(
      transaction,
      request.envelopeId,
      envelope.currency,
      envelope.sortOrder,
      sortOrder,
    );

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

function requireEnvelopeFields(
  request: Pick<CreateEnvelopeRequest, "name" | "icon" | "color">,
): void {
  if (!request.name.trim()) throw new Error("Envelope name is required.");
  if (!request.icon.trim()) throw new Error("Envelope emoji is required.");
  if (!request.color.trim()) throw new Error("Envelope color is required.");
}

function requireCategoryIds(categoryIds: readonly string[]): string[] {
  const uniqueIds = [...new Set(categoryIds)];
  if (
    uniqueIds.length === 0 ||
    uniqueIds.length !== categoryIds.length ||
    uniqueIds.some((id) => !id.trim())
  ) {
    throw new Error("An active Envelope requires at least one distinct expense Category.");
  }
  return uniqueIds;
}

async function requireWorkspace(
  database: SQLiteDatabase,
  currency: string,
  period: string,
): Promise<void> {
  const workspace = await database.getFirstAsync<{ activationPeriod: string }>(
    `SELECT activation_period AS activationPeriod
     FROM budget_workspaces WHERE currency = ?`,
    currency,
  );
  if (!workspace) throw new Error(`Activate the ${currency} budget before creating Envelopes.`);
  if (period < workspace.activationPeriod) {
    throw new Error(`Envelope changes cannot predate ${currency} budget activation.`);
  }
}

async function requireEligibleCategories(
  database: SQLiteDatabase,
  categoryIds: readonly string[],
  currency: string,
  period: string,
  allowReassignment = false,
): Promise<CategoryRow[]> {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const rows = await database.getAllAsync<CategoryRow>(
    `SELECT
       categories.id,
       categories.lifecycle,
       categories.lifecycle_changed_at AS lifecycleChangedAt,
       categories.type,
       (
         SELECT COUNT(*) FROM transactions
         WHERE transactions.category_id = categories.id
           AND transactions.currency <> ?
       ) AS incompatibleTransactionCount,
       (
         SELECT envelope_id FROM category_mappings
         WHERE category_id = categories.id
           AND effective_from_period <= ?
           AND (effective_to_period IS NULL OR effective_to_period >= ?)
         ORDER BY effective_from_period DESC
         LIMIT 1
       ) AS mappedEnvelopeId
     FROM categories
     WHERE categories.id IN (${placeholders})`,
    currency,
    period,
    period,
    ...categoryIds,
  );
  if (rows.length !== categoryIds.length) {
    throw new Error("Every mapped Category must exist.");
  }
  for (const category of rows) {
    if (category.lifecycle !== "active" || category.type !== "expense") {
      throw new Error("Only active expense Categories can map to an Envelope.");
    }
    if (category.incompatibleTransactionCount > 0) {
      throw new Error(`Category ${category.id} is incompatible with ${currency}.`);
    }
    if (category.mappedEnvelopeId && !allowReassignment) {
      throw new Error(`Category ${category.id} already maps to another Envelope for ${period}.`);
    }
  }
  return rows;
}

function requireRestoredCategoryConfirmation(
  categories: readonly CategoryRow[],
  confirmedCategoryIds: readonly string[] | undefined,
  targetEnvelopeId: string,
): void {
  const confirmed = new Set(confirmedCategoryIds ?? []);
  for (const category of categories) {
    if (
      category.lifecycleChangedAt !== null &&
      category.mappedEnvelopeId !== targetEnvelopeId &&
      !confirmed.has(category.id)
    ) {
      throw new Error(
        `Confirm restored Category ${category.id} before creating its future Mapping.`,
      );
    }
  }
}

async function replaceEnvelopeMappings(
  database: SQLiteDatabase,
  selectedCategories: readonly CategoryRow[],
  affectedCategoryIds: readonly string[],
  selectedCategoryIds: readonly string[],
  envelopeId: string,
  period: string,
  now: string,
): Promise<void> {
  const selectedIds = new Set(selectedCategoryIds);
  const selectedById = new Map(selectedCategories.map((category) => [category.id, category]));
  const validationPoints: MappingValidationPoint[] = [{ envelopeId, period }];

  for (const categoryId of affectedCategoryIds) {
    const category = selectedById.get(categoryId);
    const selected = selectedIds.has(categoryId);
    const effectiveFromPeriod =
      selected && category?.lifecycleChangedAt !== null && category?.mappedEnvelopeId !== envelopeId
        ? nextPeriod(period)
        : period;
    const displaced = await database.getAllAsync<{
      envelopeId: string;
      effectiveFromPeriod: string;
    }>(
      `SELECT envelope_id AS envelopeId, effective_from_period AS effectiveFromPeriod
       FROM category_mappings
       WHERE category_id = ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
      categoryId,
      effectiveFromPeriod,
    );
    validationPoints.push(
      ...displaced.map((mapping) => ({
        envelopeId: mapping.envelopeId,
        period:
          mapping.effectiveFromPeriod > effectiveFromPeriod
            ? mapping.effectiveFromPeriod
            : effectiveFromPeriod,
      })),
    );

    await database.runAsync(
      `DELETE FROM category_mappings
       WHERE category_id = ? AND effective_from_period >= ?`,
      categoryId,
      effectiveFromPeriod,
    );
    await database.runAsync(
      `UPDATE category_mappings
       SET effective_to_period = ?
       WHERE category_id = ?
         AND effective_from_period < ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
      previousPeriod(effectiveFromPeriod),
      categoryId,
      effectiveFromPeriod,
      effectiveFromPeriod,
    );
    if (!selected) continue;
    await database.runAsync(
      `INSERT INTO category_mappings (
        category_id, envelope_id, effective_from_period, effective_to_period, created_at
      ) VALUES (?, ?, ?, NULL, ?)`,
      categoryId,
      envelopeId,
      effectiveFromPeriod,
      now,
    );
    validationPoints.push({ envelopeId, period: effectiveFromPeriod });
  }

  const uniquePoints = new Map(
    validationPoints.map((point) => [`${point.envelopeId}:${point.period}`, point]),
  );
  for (const point of uniquePoints.values()) {
    await requireActiveEnvelopeMapped(database, point.envelopeId, point.period);
  }
}

async function requireActiveEnvelopeMapped(
  database: SQLiteDatabase,
  envelopeId: string,
  period: string,
): Promise<void> {
  const unmapped = await database.getFirstAsync<{ id: string }>(
    `SELECT envelopes.id
     FROM envelopes
     WHERE envelopes.id = ?
       AND envelopes.lifecycle = 'active'
       AND NOT EXISTS (
         SELECT 1
         FROM category_mappings
         INNER JOIN categories ON categories.id = category_mappings.category_id
         WHERE category_mappings.envelope_id = envelopes.id
           AND category_mappings.effective_from_period <= ?
           AND (
             category_mappings.effective_to_period IS NULL
             OR category_mappings.effective_to_period >= ?
           )
           AND categories.lifecycle = 'active'
           AND categories.type = 'expense'
       )
     LIMIT 1`,
    envelopeId,
    period,
    period,
  );
  if (unmapped) {
    throw new Error(`Envelope ${unmapped.id} requires at least one active expense Category.`);
  }
}

function previousPeriod(period: string): string {
  return format(subMonths(parseISO(`${period}-01`), 1), "yyyy-MM");
}

function nextPeriod(period: string): string {
  return format(addMonths(parseISO(`${period}-01`), 1), "yyyy-MM");
}

function requireSortOrder(sortOrder: number, maximum: number): void {
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > maximum) {
    throw new Error(`Envelope order must be an integer from 0 through ${maximum}.`);
  }
}

async function reorderEnvelope(
  database: SQLiteDatabase,
  envelopeId: string,
  currency: string,
  current: number,
  next: number,
): Promise<void> {
  if (next === current) return;
  if (next < current) {
    await database.runAsync(
      `UPDATE envelopes
       SET sort_order = sort_order + 1
       WHERE currency = ? AND lifecycle = 'active' AND id <> ?
         AND sort_order >= ? AND sort_order < ?`,
      currency,
      envelopeId,
      next,
      current,
    );
    return;
  }
  await database.runAsync(
    `UPDATE envelopes
     SET sort_order = sort_order - 1
     WHERE currency = ? AND lifecycle = 'active' AND id <> ?
       AND sort_order > ? AND sort_order <= ?`,
    currency,
    envelopeId,
    current,
    next,
  );
}
