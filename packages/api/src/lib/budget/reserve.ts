import { sql, type SQL } from "drizzle-orm";

/**
 * Card Payment Reserve arithmetic (#91), per ADR-0004 and ADR-0010:
 * categorized card purchases move supported Money from their Envelope into a
 * system-managed reserve; whatever the Envelope could not support remains
 * Unfunded Card Spending.
 *
 * Per envelope, for one workspace/period:
 *   MIN(card spend net of linked Refunds, envelope assigned balance) — only
 *   assigned Money can be reserved; the unsupported remainder stays visible
 *   as unfunded debt. Refunds adjust the reserve automatically by netting
 *   out here (ADR-0008's "adjusts its Card Payment Reserve") with no
 *   separate write path.
 *
 * Pure, embeddable SQL (no CTEs) because the payment/refund commands
 * re-validate preconditions inside the atomic batch: the plan-time read and
 * the in-batch guard are the same expression evaluated twice.
 */

/** "YYYY-MM" Budget Period → exclusive upper bound for ledger dates. */
export function periodCeiling(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

/** Last calendar day of the Budget Period ("YYYY-MM-DD"), for payment dates. */
export function periodLastDate(period: string): string {
  const ceiling = periodCeiling(period);
  const [y, m, d] = ceiling.split("-").map(Number);
  const previousDay = new Date(Date.UTC(y, m - 1, d - 1));
  return previousDay.toISOString().slice(0, 10);
}

function spendingPerEnvelopeSql(
  householdId: string,
  currency: string,
  ceiling: string,
  period: string,
): SQL {
  return sql`SELECT cm.envelope_id AS envelope_id,
      SUM(
        t.amount_minor
        - COALESCE((
          SELECT SUM(r.amount_minor)
          FROM refund_links r
          WHERE r.household_id = t.household_id
            AND r.original_transaction_id = t.id
        ), 0)
      ) AS spent_minor,
      COALESCE((
        SELECT SUM(
          CASE WHEN g.destination_envelope_id = cm.envelope_id THEN g.amount_minor ELSE 0 END
          - CASE WHEN g.source_envelope_id = cm.envelope_id THEN g.amount_minor ELSE 0 END
        )
        FROM assignments g
        WHERE g.household_id = ${householdId}
          AND g.budget_period <= ${period}
          AND (g.destination_envelope_id = cm.envelope_id OR g.source_envelope_id = cm.envelope_id)
      ), 0) AS available_minor
    FROM transactions t
    JOIN accounts ca
      ON ca.household_id = t.household_id AND ca.id = t.account_id AND ca.type = 'card'
    JOIN category_mappings cm
      ON cm.household_id = t.household_id
      AND cm.category_id = t.category_id
      AND cm.envelope_id IS NOT NULL
      AND cm.effective_from_period = (
        SELECT MAX(x.effective_from_period)
        FROM category_mappings x
        WHERE x.household_id = cm.household_id
          AND x.category_id = t.category_id
          AND x.envelope_id IS NOT NULL
          AND x.effective_from_period <= substr(t.date, 1, 7)
      )
    WHERE t.household_id = ${householdId}
      AND t.type = 'expense'
      AND t.currency = ${currency}
      AND t.date < ${ceiling}
    GROUP BY cm.envelope_id`;
}

/**
 * Card Payment Reserve for one currency workspace/period: per-envelope card
 * spending net of refunds, capped by what the envelope actually had.
 */
export function cardPaymentReserveSql(
  householdId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(MIN(s.spent_minor, s.available_minor)), 0)
    FROM (${spendingPerEnvelopeSql(householdId, currency, periodCeiling(period), period)}) s
  )`;
}

export interface ReserveFacts {
  readonly reserveMinor: number;
}

/** Executes the reserve computation for real (plan-time read). */
export async function getReserveFacts(
  db: { all: (query: SQL) => Promise<Record<string, unknown>[]> },
  householdId: string,
  currency: string,
  period: string,
): Promise<ReserveFacts> {
  const query = sql`SELECT ${cardPaymentReserveSql(householdId, currency, period)} AS reserve`;
  const rows = await db.all(query);
  return { reserveMinor: Number((rows[0] as Record<string, number> | undefined)?.reserve ?? 0) };
}
