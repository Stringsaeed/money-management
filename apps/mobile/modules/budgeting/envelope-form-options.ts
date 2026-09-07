import type { SQLiteDatabase } from "@/db/sqlite";

import type { EnvelopeCategoryOption, EnvelopeFormOptionsRequest } from "./types";
import { requireCurrency, requirePeriod } from "./validation";

interface CategoryOptionRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  lifecycleChangedAt: string | null;
  incompatibleTransactionCount: number;
  mappedEnvelopeId: string | null;
  mappedThroughPeriod: string | null;
  futureMappedEnvelopeId: string | null;
  futureMappingPeriod: string | null;
}

export async function getEnvelopeFormOptions(
  database: SQLiteDatabase,
  request: EnvelopeFormOptionsRequest,
): Promise<EnvelopeCategoryOption[]> {
  const currency = requireCurrency(request.currency);
  const period = requirePeriod(request.period);
  const workspace = await database.getFirstAsync<{ activationPeriod: string }>(
    "SELECT activation_period AS activationPeriod FROM budget_workspaces WHERE currency = ?",
    currency,
  );
  if (!workspace || period < workspace.activationPeriod) return [];

  const rows = await database.getAllAsync<CategoryOptionRow>(
    `SELECT
       categories.id,
       categories.name,
       categories.icon,
       categories.color,
       categories.lifecycle_changed_at AS lifecycleChangedAt,
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
       ) AS mappedEnvelopeId,
       (
         SELECT effective_to_period FROM category_mappings
         WHERE category_id = categories.id
           AND effective_from_period <= ?
           AND (effective_to_period IS NULL OR effective_to_period >= ?)
         ORDER BY effective_from_period DESC
         LIMIT 1
       ) AS mappedThroughPeriod,
       (
         SELECT envelope_id FROM category_mappings
         WHERE category_id = categories.id
           AND effective_from_period > ?
         ORDER BY effective_from_period
         LIMIT 1
       ) AS futureMappedEnvelopeId,
       (
         SELECT effective_from_period FROM category_mappings
         WHERE category_id = categories.id
           AND effective_from_period > ?
         ORDER BY effective_from_period
         LIMIT 1
       ) AS futureMappingPeriod
     FROM categories
     WHERE categories.lifecycle = 'active' AND categories.type = 'expense'
     ORDER BY categories.name, categories.id`,
    currency,
    period,
    period,
    period,
    period,
    period,
    period,
  );
  return rows.map((row) => {
    const eligible = row.incompatibleTransactionCount === 0;
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      mappedEnvelopeId: row.mappedEnvelopeId,
      mappedThroughPeriod: row.mappedThroughPeriod,
      futureMappedEnvelopeId: row.futureMappedEnvelopeId,
      futureMappingPeriod: row.futureMappingPeriod,
      requiresConfirmation: row.lifecycleChangedAt !== null,
      eligible,
      ineligibilityReason: eligible ? null : "incompatible-currency",
    };
  });
}
