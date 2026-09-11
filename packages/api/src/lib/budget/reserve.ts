import { sql, type SQL } from "drizzle-orm";

/**
 * Card Payment Reserve arithmetic (#91), per ADR-0004/0010/0011.
 *
 * Per envelope: categorized card spending (mapped via the #89 category
 * timeline at each transaction's own date) net of linked Refunds, capped by
 * the envelope's assigned balance — only assigned Money can be reserved;
 * the unsupported remainder stays visible as Unfunded Card Spending.
 *
 * Payments (transfers INTO card accounts) release reserved Money
 * dollar-for-dollar — they settle liability regardless of which envelope
 * reserved it (ADR-0011) — so they are subtracted from the TOTAL reserve,
 * floored at zero. Refunds adjust the reserve automatically by netting out
 * here (ADR-0008) with no separate write path.
 *
 * Pure, embeddable SQL (no CTEs) because the payment/refund commands
 * re-validate preconditions inside the atomic batch: the plan-time read and
 * the in-batch guard are the same expression evaluated twice (#90 pattern).
 */

import { queryRows } from "../sql-rows";
import { periodCeiling } from "./funding-pool";

/** Last calendar day of the Budget Period ("YYYY-MM-DD"), for payment dates. */
export function periodLastDate(period: string): string {
  const ceiling = periodCeiling(period);
  const [y, m, d] = ceiling.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/**
 * Per-envelope card spending net of linked Refunds, alongside that
 * envelope's assigned balance through `period`.
 */
function spendingPerEnvelopeSql(
  ledgerId: string,
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
          WHERE r.ledger_id = t.ledger_id
            AND r.original_transaction_id = t.id
        ), 0)
      ) AS spent_minor,
      COALESCE((
        SELECT SUM(
          CASE WHEN g.destination_envelope_id = cm.envelope_id THEN g.amount_minor ELSE 0 END
          - CASE WHEN g.source_envelope_id = cm.envelope_id THEN g.amount_minor ELSE 0 END
        )
        FROM assignments g
        WHERE g.ledger_id = ${ledgerId}
          AND g.currency = ${currency}
          AND g.budget_period <= ${period}
          AND (g.destination_envelope_id = cm.envelope_id OR g.source_envelope_id = cm.envelope_id)
      ), 0) AS available_minor
    FROM transactions t
    JOIN accounts ca
      ON ca.ledger_id = t.ledger_id AND ca.id = t.account_id AND ca.type = 'card'
    JOIN category_mappings cm
      ON cm.ledger_id = t.ledger_id
      AND cm.category_id = t.category_id
      AND cm.envelope_id IS NOT NULL
      AND cm.effective_from_period = (
        SELECT MAX(x.effective_from_period)
        FROM category_mappings x
        WHERE x.ledger_id = cm.ledger_id
          AND x.category_id = t.category_id
          AND x.envelope_id IS NOT NULL
          AND x.effective_from_period <= substr(t.date, 1, 7)
      )
    WHERE t.ledger_id = ${ledgerId}
      AND t.type = 'expense'
      AND t.currency = ${currency}
      AND ca.visibility = 'public'
      AND t.date < ${ceiling}
    GROUP BY cm.envelope_id`;
}

/** All payments (transfers INTO card accounts) made through the period. */
function paymentsIntoCardsSql(ledgerId: string, currency: string, ceiling: string): SQL {
  return sql`COALESCE((
    SELECT SUM(p.amount_minor)
    FROM transactions p
    JOIN accounts source
      ON source.ledger_id = p.ledger_id AND source.id = p.account_id AND source.visibility = 'public'
    JOIN accounts dest
      ON dest.ledger_id = p.ledger_id AND dest.id = p.to_account_id AND dest.type = 'card'
    WHERE p.ledger_id = ${ledgerId}
      AND p.type = 'transfer'
      AND p.currency = ${currency}
      AND dest.visibility = 'public'
      AND p.date < ${ceiling}
  ), 0)`;
}

/**
 * Card Payment Reserve for one currency workspace/period: total per-envelope
 * reserved shares minus payments already settled, floored at zero.
 */
export function cardPaymentReserveSql(
  ledgerId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`(
    SELECT GREATEST(
      (SELECT COALESCE(SUM(LEAST(s.spent_minor, s.available_minor)), 0)
       FROM (${spendingPerEnvelopeSql(ledgerId, currency, periodCeiling(period), period)}) s)
      - ${paymentsIntoCardsSql(ledgerId, currency, periodCeiling(period))}
    , 0)
  )`;
}

/**
 * Unfunded Card Spending: per-envelope card spending beyond what the
 * envelope could support — the part ADR-0004 refuses to pretend is reserved.
 * Settled payments reduce the debt but do not fund the shortfall, so they
 * do not subtract here.
 */
export function unfundedCardSpendingSql(
  ledgerId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`(
    SELECT COALESCE(SUM(GREATEST(s.spent_minor - s.available_minor, 0)), 0)
    FROM (${spendingPerEnvelopeSql(ledgerId, currency, periodCeiling(period), period)}) s
  )`;
}

export interface ReserveFacts {
  readonly reserveMinor: number;
}

/** Executes the reserve computation for real (plan-time read). */
export async function getReserveFacts(
  db: { execute: (query: SQL) => Promise<unknown> },
  ledgerId: string,
  currency: string,
  period: string,
): Promise<ReserveFacts> {
  const query = sql`SELECT ${cardPaymentReserveSql(ledgerId, currency, period)} AS reserve`;
  const rows = await queryRows<Record<string, number>>(db, query);
  return { reserveMinor: Number((rows[0] as Record<string, number> | undefined)?.reserve ?? 0) };
}
