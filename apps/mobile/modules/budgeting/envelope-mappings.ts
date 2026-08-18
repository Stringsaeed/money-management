import { addMonths, format, parseISO, subMonths } from "date-fns";
import type { SQLiteDatabase } from "expo-sqlite";

import type { EnvelopeCategoryRow } from "./envelope-validation";

interface MappingValidationPoint {
  envelopeId: string;
  period: string;
}

interface ReplaceEnvelopeMappingsRequest {
  selectedCategories: readonly EnvelopeCategoryRow[];
  affectedCategoryIds: readonly string[];
  selectedCategoryIds: readonly string[];
  envelopeId: string;
  period: string;
  now: string;
}

export async function replaceEnvelopeMappings(
  database: SQLiteDatabase,
  request: ReplaceEnvelopeMappingsRequest,
): Promise<void> {
  const selectedIds = new Set(request.selectedCategoryIds);
  const selectedById = new Map(
    request.selectedCategories.map((category) => [category.id, category]),
  );
  const validationPoints: MappingValidationPoint[] = [
    { envelopeId: request.envelopeId, period: request.period },
  ];

  for (const categoryId of request.affectedCategoryIds) {
    const category = selectedById.get(categoryId);
    const selected = selectedIds.has(categoryId);
    const effectiveFromPeriod =
      selected &&
      category?.lifecycleChangedAt !== null &&
      category?.mappedEnvelopeId !== request.envelopeId
        ? nextPeriod(request.period)
        : request.period;
    validationPoints.push(
      ...(await replaceCategoryMapping(database, {
        categoryId,
        envelopeId: request.envelopeId,
        effectiveFromPeriod,
        now: request.now,
        selected,
      })),
    );
  }

  const uniquePoints = new Map(
    validationPoints.map((point) => [`${point.envelopeId}:${point.period}`, point]),
  );
  for (const point of uniquePoints.values()) {
    await requireActiveEnvelopeMapped(database, point.envelopeId, point.period);
  }
}

async function replaceCategoryMapping(
  database: SQLiteDatabase,
  request: {
    categoryId: string;
    envelopeId: string;
    effectiveFromPeriod: string;
    now: string;
    selected: boolean;
  },
): Promise<MappingValidationPoint[]> {
  const displaced = await database.getAllAsync<{
    envelopeId: string;
    effectiveFromPeriod: string;
  }>(
    `SELECT envelope_id AS envelopeId, effective_from_period AS effectiveFromPeriod
     FROM category_mappings
     WHERE category_id = ?
       AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
    request.categoryId,
    request.effectiveFromPeriod,
  );
  await database.runAsync(
    `DELETE FROM category_mappings
     WHERE category_id = ? AND effective_from_period >= ?`,
    request.categoryId,
    request.effectiveFromPeriod,
  );
  await database.runAsync(
    `UPDATE category_mappings
     SET effective_to_period = ?
     WHERE category_id = ?
       AND effective_from_period < ?
       AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
    previousPeriod(request.effectiveFromPeriod),
    request.categoryId,
    request.effectiveFromPeriod,
    request.effectiveFromPeriod,
  );
  if (request.selected) {
    await database.runAsync(
      `INSERT INTO category_mappings (
        category_id, envelope_id, effective_from_period, effective_to_period, created_at
      ) VALUES (?, ?, ?, NULL, ?)`,
      request.categoryId,
      request.envelopeId,
      request.effectiveFromPeriod,
      request.now,
    );
  }
  return [
    ...displaced.map((mapping) => ({
      envelopeId: mapping.envelopeId,
      period:
        mapping.effectiveFromPeriod > request.effectiveFromPeriod
          ? mapping.effectiveFromPeriod
          : request.effectiveFromPeriod,
    })),
    ...(request.selected
      ? [{ envelopeId: request.envelopeId, period: request.effectiveFromPeriod }]
      : []),
  ];
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
