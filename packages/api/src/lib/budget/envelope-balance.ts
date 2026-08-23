import { sql, type SQL } from "drizzle-orm";

/** Net assigned balance of one envelope: in − out through `period` (minor units). */
export function envelopeAssignedBalanceSql(
  householdId: string,
  envelopeId: string,
  period: string,
): SQL<number> {
  return sql<number>`COALESCE((
    SELECT SUM(
      CASE WHEN g.destination_envelope_id = ${envelopeId} THEN g.amount_minor ELSE 0 END
      - CASE WHEN g.source_envelope_id = ${envelopeId} THEN g.amount_minor ELSE 0 END
    )
    FROM assignments g
    WHERE g.household_id = ${householdId}
      AND g.budget_period <= ${period}
      AND (g.destination_envelope_id = ${envelopeId} OR g.source_envelope_id = ${envelopeId})
  ), 0)`;
}

/**
 * Executes the net assigned balance for one envelope. Spending-derived
 * availability (mapped transactions, ADR-0003) joins the projection phase;
 * the waterfall itself only needs the assignment-sourced component.
 */
export async function getEnvelopeAssignedBalance(
  db: { all: (query: SQL) => Promise<Record<string, unknown>[]> },
  householdId: string,
  envelopeId: string,
  period: string,
): Promise<number> {
  const query = sql`SELECT ${envelopeAssignedBalanceSql(householdId, envelopeId, period)} AS balance`;
  const rows = await db.all(query);
  return Number((rows[0] as Record<string, number> | undefined)?.balance ?? 0);
}
