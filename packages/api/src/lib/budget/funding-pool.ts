import { sql, type SQL } from "drizzle-orm";

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
 *
 * All amounts are minor units. Every fragment takes householdId as a bound
 * parameter — D1 has no RLS and callers gate access upstream.
 */

/** "YYYY-MM" Budget Period → exclusive upper bound for ledger dates. */
export function periodEndExclusive(period: string): string {
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
function activeMemberIdsSql(householdId: string, currency: string, period: string): SQL {
  return sql`(
    SELECT COALESCE(json_group_array(m.account_id), '[]')
    FROM funding_memberships m
    WHERE m.household_id = ${householdId}
      AND m.currency = ${currency}
      AND m.active = 1
      AND m.effective_from_period = (
        SELECT MAX(x.effective_from_period)
        FROM funding_memberships x
        WHERE x.household_id = m.household_id
          AND x.account_id = m.account_id
          AND x.effective_from_period <= ${period}
      )
  )`;
}

/** Funding Pool: initial balances plus signed activity of member accounts through `period`. */
export function fundingPoolSql(householdId: string, currency: string, period: string): SQL<number> {
  const ceiling = periodEndExclusive(period);
  const members = activeMemberIdsSql(householdId, currency, period);
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
          WHERE t.household_id = ${householdId}
            AND t.currency = ${currency}
            AND t.date < ${ceiling}
            AND (t.account_id = a.id OR t.to_account_id = a.id)
        ), 0) AS account_balance
      FROM accounts a
      WHERE a.household_id = ${householdId}
        AND a.currency = ${currency}
        AND a.id IN (SELECT value FROM json_each(${members}))
    )
  )`;
}

/** Net assignments OUT of Unassigned Money through `period` (destinations − sources). */
export function assignedThroughPeriodSql(
  householdId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`COALESCE((
    SELECT SUM(
      CASE WHEN g.destination_envelope_id IS NOT NULL THEN g.amount_minor ELSE 0 END
      - CASE WHEN g.source_envelope_id IS NOT NULL THEN g.amount_minor ELSE 0 END
    )
    FROM assignments g
    WHERE g.household_id = ${householdId}
      AND g.currency = ${currency}
      AND g.budget_period <= ${period}
  ), 0)`;
}

/**
 * Unassigned Money for one workspace/period (negative = Budget Shortfall).
 * Card Payment Reserves subtract once #91 lands; today they are zero.
 */
export function unassignedMoneySql(
  householdId: string,
  currency: string,
  period: string,
): SQL<number> {
  return sql<number>`(${fundingPoolSql(householdId, currency, period)} - ${assignedThroughPeriodSql(householdId, currency, period)})`;
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
  db: { all: (query: SQL) => Promise<Record<string, unknown>[]> },
  householdId: string,
  currency: string,
  period: string,
): Promise<BudgetPoolFacts> {
  const query = sql`SELECT
    ${fundingPoolSql(householdId, currency, period)} AS funding_pool,
    ${assignedThroughPeriodSql(householdId, currency, period)} AS assigned,
    ${unassignedMoneySql(householdId, currency, period)} AS unassigned`;
  const rows = await db.all(query);
  const row = (rows[0] ?? {}) as Record<string, number>;
  const fundingPoolMinor = Number(row.funding_pool ?? 0);
  const assignedMinor = Number(row.assigned ?? 0);
  const reservesMinor = 0; // Card Payment Reserves arrive with #91.
  return {
    fundingPoolMinor,
    assignedMinor,
    reservesMinor,
    unassignedMinor: Number(row.unassigned ?? fundingPoolMinor - assignedMinor),
  };
}
