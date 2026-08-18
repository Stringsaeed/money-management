import type { SQLiteDatabase } from "expo-sqlite";

import type { CreateEnvelopeRequest } from "./types";

export interface EnvelopeCategoryRow {
  id: string;
  lifecycle: "active" | "archived";
  lifecycleChangedAt: string | null;
  type: string;
  incompatibleTransactionCount: number;
  mappedEnvelopeId: string | null;
}

export function requireEnvelopeFields(
  request: Pick<CreateEnvelopeRequest, "name" | "icon" | "color">,
): void {
  if (!request.name.trim()) throw new Error("Envelope name is required.");
  if (!request.icon.trim()) throw new Error("Envelope emoji is required.");
  if (!request.color.trim()) throw new Error("Envelope color is required.");
}

export function requireCategoryIds(categoryIds: readonly string[]): string[] {
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

export async function requireEnvelopeWorkspace(
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

export async function requireEligibleEnvelopeCategories(
  database: SQLiteDatabase,
  categoryIds: readonly string[],
  currency: string,
  period: string,
): Promise<EnvelopeCategoryRow[]> {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const rows = await database.getAllAsync<EnvelopeCategoryRow>(
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
  }
  return rows;
}

export function requireRestoredCategoryConfirmation(
  categories: readonly EnvelopeCategoryRow[],
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
