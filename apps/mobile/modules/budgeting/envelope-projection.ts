import type { SQLiteDatabase } from "expo-sqlite";

import type { EnvelopeSummary } from "./types";

interface EnvelopeRow {
  id: string;
  currency: string;
  name: string;
  icon: string;
  color: string;
  lifecycle: "active" | "archived";
  sortOrder: number;
  positiveRollover: number | null;
}

interface CategoryMappingRow {
  id: string;
  lifecycle: "active" | "archived";
  type: "expense" | "income";
}

export async function getEnvelopeSummaries(
  database: SQLiteDatabase,
  currency: string,
  period: string,
  lifecycle: "active" | "archived",
): Promise<EnvelopeSummary[]> {
  const rows = await database.getAllAsync<EnvelopeRow>(
    `SELECT
       envelopes.id,
       envelopes.currency,
       envelopes.name,
       envelopes.icon,
       envelopes.color,
       envelopes.lifecycle,
       envelopes.sort_order AS sortOrder,
       (
         SELECT positive_rollover
         FROM rollover_settings
         WHERE envelope_id = envelopes.id
           AND effective_from_period <= ?
         ORDER BY effective_from_period DESC
         LIMIT 1
       ) AS positiveRollover
     FROM envelopes
     WHERE envelopes.currency = ? AND envelopes.lifecycle = ?`,
    period,
    currency,
    lifecycle,
  );

  const summaries = await Promise.all(
    rows.map(async (row) => {
      const categories = await database.getAllAsync<CategoryMappingRow>(
        `SELECT categories.id, categories.lifecycle, categories.type
         FROM category_mappings
         INNER JOIN categories ON categories.id = category_mappings.category_id
         WHERE category_mappings.envelope_id = ?
           AND category_mappings.effective_from_period <= ?
           AND (
             category_mappings.effective_to_period IS NULL
             OR category_mappings.effective_to_period >= ?
           )
         ORDER BY categories.id`,
        row.id,
        period,
        period,
      );
      const money = { currency, amountMinor: 0 };
      const hasActiveExpenseCategory = categories.some(
        (category) => category.lifecycle === "active" && category.type === "expense",
      );
      const health =
        row.lifecycle === "archived" || hasActiveExpenseCategory
          ? ({ status: "ready", reasons: [] } as const)
          : ({
              status: "needs_attention",
              reasons: [
                {
                  kind: "missing-active-expense-category",
                  recoveryAction: "Map at least one active expense Category to this Envelope.",
                },
              ],
            } as const);
      return {
        ...row,
        categoryIds: categories.map(({ id }) => id),
        positiveRollover: row.positiveRollover !== 0,
        health,
        availableMoney: { ...money },
        assignedMoney: { ...money },
        netSpent: { ...money },
      } satisfies EnvelopeSummary;
    }),
  );

  const normalizedSummaries =
    lifecycle === "active" ? normalizeEnvelopeSortOrders(summaries) : summaries;

  return normalizedSummaries.sort((left, right) => {
    if (left.health.status !== right.health.status) {
      return left.health.status === "needs_attention" ? -1 : 1;
    }
    return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
  });
}

function normalizeEnvelopeSortOrders(summaries: readonly EnvelopeSummary[]): EnvelopeSummary[] {
  const orderByEnvelopeId = new Map(
    [...summaries]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
      .map((envelope, sortOrder) => [envelope.id, sortOrder]),
  );
  return summaries.map((summary) => ({
    ...summary,
    sortOrder: orderByEnvelopeId.get(summary.id) ?? summary.sortOrder,
  }));
}
