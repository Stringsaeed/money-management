import { sql, type SQL } from "drizzle-orm";

import { queryRows } from "../sql-rows";

/**
 * Funding Pool & Unassigned Money arithmetic over server facts (#90),
 * expressed as composable scalar-SQL fragments.
 *
 * Why SQL fragments: the commands pipeline re-validates preconditions INSIDE
 * the atomic batch by embedding them in a failing CHECK assertion
 * (`assertionStatement`). That requires the exact numbers being guarded —
 * Funding Pool, assigned totals, Unassigned Money — to exist as pure SQL, so
 * the plan-time read and the in-batch assertion are literally the same
 * expression evaluated twice: once before planning commits, once atomically.
 *
 * Period Opening reconstruction (ADR-0013): a Funding Account contributes its
 * balance through the END of the target period — `initial_balance_minor`
 * plus posted activity up to (excluding) the next period — because an
 * Assignment lands on the period's plan, not on today's balance.
 * Transfers between two Funding Accounts of the same workspace are
 * budget-neutral (CONTEXT.md: Funding Boundary Transfer); transfers crossing the pool
 * boundary move it.
 */

/** "YYYY-MM" Budget Period → exclusive upper bound for ledger dates. */
export function periodCeiling(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

/**
 * Account ids whose latest period-effective Funding Membership at or before
 * `period` is active (#89 timeline semantics: the greatest
 * effective_from_period wins; later rows are future changes).
 */
function activeMemberIdsSql(ledgerId: string, currency: string, period: string): SQL {
  return sql`(
    SELECT COALESCE(json_agg(m.account_id), '[]'::json)
    FROM funding_memberships m
    WHERE m.ledger_id = ${ledgerId}
      AND m.currency = ${currency}
      AND m.active IS TRUE
      AND m.effective_from_period = (
        SELECT MAX(x.effective_from_period)
        FROM funding_memberships x
        WHERE x.ledger_id = m.ledger_id
          AND x.account_id = m.account_id
          AND x.effective_from_period <= ${period}
      )
  )`;
}

/** Funding Pool: initial balances plus signed activity of member accounts through `period`. */
export function fundingPoolSql(ledgerId: string, currency: string, period: string): SQL<number> {
  const ceiling = periodCeiling(period);
  const members = activeMemberIdsSql(ledgerId, currency, period);
  return sql<number>`(
    SELECT COALESCE(SUM(account_balance), 0)
    FROM (
      SELECT a.initial_balance_minor
        + COALESCE((
          SELECT SUM(
            CASE
              WHEN t.type = 'transfer' THEN
                (CASE WHEN t.to_account_id = a.id THEN t.amount_minor ELSE 0 END)
                - (CASE WHEN t.account_id = a.id THEN t.amount_minor ELSE 0 END)
              WHEN t.type = 'income' THEN
                (CASE WHEN t.account_id = a.id THEN t.amount_minor ELSE 0 END)
              ELSE
                (CASE WHEN t.account_id = a.id THEN -t.amount_minor ELSE 0 END)
            END
          )
          FROM transactions t
          WHERE t.ledger_id = ${ledgerId}
            AND t.currency = ${currency}
            AND t.date < ${ceiling}
            AND (t.account_id = a.id OR t.to_account_id = a.id)
            AND (
              t.type <> 'transfer'
              OR (
                EXISTS (
                  SELECT 1 FROM accounts source
                  WHERE source.ledger_id = t.ledger_id
                    AND source.id = t.account_id
                    AND source.visibility = 'public'
                )
                AND EXISTS (
                  SELECT 1 FROM accounts destination
                  WHERE destination.ledger_id = t.ledger_id
                    AND destination.id = t.to_account_id
                    AND destination.visibility = 'public'
                )
              )
            )
        ), 0) AS account_balance
      FROM accounts a
      WHERE a.ledger_id = ${ledgerId}
        AND a.currency = ${currency}
        AND a.visibility = 'public'
        AND a.id IN (SELECT jsonb_array_elements_text((${members})::jsonb))
    )
  )`;
}

/** Net assignments OUT of Unassigned Money through `period` (destinations − sources). */
export function assignedThroughPeriodSql(
  ledgerId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`COALESCE((
    SELECT SUM(
      CASE WHEN g.destination_envelope_id IS NOT NULL THEN g.amount_minor ELSE 0 END
      - CASE WHEN g.source_envelope_id IS NOT NULL THEN g.amount_minor ELSE 0 END
    )
    FROM assignments g
    WHERE g.ledger_id = ${ledgerId}
      AND g.currency = ${currency}
      AND g.budget_period <= ${period}
  ), 0)`;
}

/**
 * Unassigned Money for one workspace/period (negative = Budget Shortfall).
 * Card Payment Reserves subtract once #91 lands; today they are zero.
 */
export function unassignedMoneySql(
  ledgerId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`(${fundingPoolSql(ledgerId, currency, period)} - ${assignedThroughPeriodSql(ledgerId, currency, period)})`;
}

export interface BudgetPoolFacts {
  readonly fundingPoolMinor: number;
  readonly assignedMinor: number;
  readonly reservesMinor: number;
  /** Negative = Budget Shortfall. */
  readonly unassignedMinor: number;
}

/** Executes the pool facts for real (plan-time read of the same SQL the guard asserts). */
export async function getBudgetPoolFacts(
  db: { execute: (query: SQL) => Promise<unknown> },
  ledgerId: string,
  currency: string,
  period: string,
): Promise<BudgetPoolFacts> {
  const query = sql`SELECT
    ${fundingPoolSql(ledgerId, currency, period)} AS funding_pool,
    ${assignedThroughPeriodSql(ledgerId, currency, period)} AS assigned,
    ${unassignedMoneySql(ledgerId, currency, period)} AS unassigned`;
  const rows = await queryRows<Record<string, number>>(db, query);
  const row = (rows[0] ?? {}) as Record<string, number>;
  const fundingPoolMinor = Number(row.funding_pool ?? 0);
  const assignedMinor = Number(row.assigned ?? 0);
  // The reserve is carved out of envelope-assigned Money (ADR-0004), which
  // `assignedMinor` already counts — subtracting it again would double-count.
  // Only future direct-to-reserve assignments (opening debt, ADR-0010) would
  // add to this term.
  const reservesMinor = 0;
  return {
    fundingPoolMinor,
    assignedMinor,
    reservesMinor,
    unassignedMinor: Number(row.unassigned ?? fundingPoolMinor - assignedMinor),
  };
}
