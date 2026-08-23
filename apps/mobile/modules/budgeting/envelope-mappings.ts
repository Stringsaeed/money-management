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
    const effectiveFromPeriod = mappingStartPeriod(
      category,
      selected,
      request.envelopeId,
      request.period,
    );
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

  for (const point of await expandMappingValidationPoints(database, validationPoints)) {
    await requireActiveEnvelopeMapped(database, point.envelopeId, point.period);
  }
}

function mappingStartPeriod(
  category: EnvelopeCategoryRow | undefined,
  selected: boolean,
  targetEnvelopeId: string,
  currentPeriod: string,
): string {
  if (!selected || category?.lifecycleChangedAt === null) return currentPeriod;
  const hasOngoingTargetMapping =
    category?.mappedEnvelopeId === targetEnvelopeId && category.mappedThroughPeriod === null;
  if (hasOngoingTargetMapping) return currentPeriod;
  if (
    category?.futureMappedEnvelopeId === targetEnvelopeId &&
    category.futureMappingPeriod !== null
  ) {
    return category.futureMappingPeriod;
  }
  return nextPeriod(currentPeriod);
}

async function expandMappingValidationPoints(
  database: SQLiteDatabase,
  seeds: readonly MappingValidationPoint[],
): Promise<MappingValidationPoint[]> {
  const periodsByEnvelope = new Map<string, Set<string>>();
  for (const seed of seeds) {
    const periods = periodsByEnvelope.get(seed.envelopeId) ?? new Set<string>();
    periods.add(seed.period);
    periodsByEnvelope.set(seed.envelopeId, periods);
  }
  for (const [envelopeId, periods] of periodsByEnvelope) {
    const firstAffectedPeriod = [...periods].sort()[0];
    const boundaries = await database.getAllAsync<{
      effectiveFromPeriod: string;
      effectiveToPeriod: string | null;
    }>(
      `SELECT
         effective_from_period AS effectiveFromPeriod,
         effective_to_period AS effectiveToPeriod
       FROM category_mappings
       WHERE envelope_id = ?
         AND (effective_to_period IS NULL OR effective_to_period >= ?)`,
      envelopeId,
      firstAffectedPeriod,
    );
    for (const boundary of boundaries) {
      if (boundary.effectiveFromPeriod >= firstAffectedPeriod) {
        periods.add(boundary.effectiveFromPeriod);
      }
      if (boundary.effectiveToPeriod !== null) {
        const periodAfterEnd = nextPeriod(boundary.effectiveToPeriod);
        if (periodAfterEnd >= firstAffectedPeriod) periods.add(periodAfterEnd);
      }
    }
  }
  return [...periodsByEnvelope].flatMap(([envelopeId, periods]) =>
    [...periods].map((period) => ({ envelopeId, period })),
  );
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
