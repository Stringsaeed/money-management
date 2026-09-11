import { and, eq, inArray, sql } from "drizzle-orm";
import { isPersonalLedgerId } from "@trove/protocol";

import { budgetWorkspace, envelope, periodProjectionCache } from "@trove/db/schema/budget";
import { householdChange } from "@trove/db/schema/commands";

import type { CommandDatabase } from "../commands/types";
import type { LedgerCaller } from "../require-member";
import { requireLedgerAccess } from "../require-member";
import { queryRows } from "../sql-rows";
import { getBudgetPoolFacts, periodCeiling, type BudgetPoolFacts } from "./funding-pool";
import { getReserveFacts } from "./reserve";

/**
 * Period projections (#92): Available Money, Envelope Health, and Rollover
 * per Budget Period, cached in `period_projection_cache` stamped with the
 * ledger's change sequence (#84).
 *
 * Two layers, deliberately:
 * - Workspace-level facts reuse the SHIPPED #90/#91 guard fragments verbatim —
 *   the same expressions the command pipeline asserts atomically are what
 *   projections report, so a read can never disagree with a rejected write.
 * - Per-envelope availability walks months sequentially because Rollover is
 *   genuinely sequential: an Envelope configured to start fresh truncates its
 *   positive carry at that boundary (CONTEXT.md: Rollover), which no single
 *   cumulative expression can express.
 *
 * Card spending consumes availability but stops it at zero (CONTEXT.md:
 * Available Money); the excess is reported per envelope as Unfunded Card
 * Spending. Cash Envelope Overspending stays negative and carries forward.
 *
 * Cache strategy: there is no invalidation job to miss. Every read stamps
 * rebuilt periods with the household's CURRENT sync seq; any committed
 * command advances that seq, so stale rows are detected by comparison and
 * transparently rebuilt ("invalidate when seq advances" = "rebuild when the
 * stamp lags"). Rows are keyed (ledger_id, currency, budget_period).
 */

export interface ProjectionAttentionReason {
  readonly kind:
    | "budget-shortfall"
    | "envelope-overspending"
    | "unfunded-card-spending"
    | "missing-active-expense-category";
  readonly recoveryAction?: string;
}

export interface ProjectionHealth {
  readonly status: "ready" | "needs_attention";
  readonly reasons: readonly ProjectionAttentionReason[];
}

export interface EnvelopeProjection {
  readonly envelopeId: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly lifecycle: "active" | "archived";
  readonly sortOrder: number;
  /** Net Assignments landing IN this Budget Period. */
  readonly assignedMinor: number;
  /** Posted expenses attributed to the Envelope IN this Period, net of Refunds. */
  readonly netSpentMinor: number;
  /** CONTEXT.md Available Money after Rollover, Assignments, Net Spent, card routing. */
  readonly availableMinor: number;
  /** Card spending beyond what the Envelope could support this Period. */
  readonly unfundedCardSpendingMinor: number;
  readonly health: ProjectionHealth;
}

export interface PeriodProjection {
  readonly currency: string;
  readonly budgetPeriod: string;
  readonly fundingPoolMinor: number;
  readonly assignedMinor: number;
  /**
   * Carved FROM assigned Money (ADR-0004), so the reconciliation invariant
   * holds exactly: `fundingPoolMinor === assignedMinor + unassignedMinor`
   * and `reservesMinor <= assignedMinor`. Subtracting reserves again would
   * double-count; direct-to-reserve assignments (ADR-0010) would add to it.
   */
  readonly reservesMinor: number;
  /** Negative = Budget Shortfall. */
  readonly unassignedMinor: number;
  readonly budgetHealth: ProjectionHealth;
  readonly envelopes: readonly EnvelopeProjection[];
}

/** "YYYY-MM" → inclusive list of months. */
export function enumeratePeriods(startPeriod: string, endPeriod: string): string[] {
  const periods: string[] = [];
  let [year, month] = startPeriod.split("-").map(Number);
  const [endYear, endMonth] = endPeriod.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    periods.push(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return periods;
}

/** The ledger's current sync sequence (#84): the projection cache stamp. */
async function currentLedgerSeq(db: CommandDatabase, ledgerId: string): Promise<number> {
  const rows = await db
    .select({ seq: sql<number>`COALESCE(MAX(${householdChange.seq}), 0)` })
    .from(householdChange)
    .where(eq(householdChange.ledgerId, ledgerId));
  return Number(rows[0]?.seq ?? 0);
}

type WorkspaceFacts = BudgetPoolFacts;

/**
 * One period's workspace facts via the SHIPPED #90/#91 fact readers — no
 * projection-specific reimplementation of pool arithmetic, so a read can
 * never disagree with what the command guards assert. #90 hardcodes
 * reserves to zero (the carve-out is inside assigned); #91 computes the
 * real reserve, so it wins here.
 */
async function getWorkspaceFacts(
  db: CommandDatabase,
  ledgerId: string,
  currency: string,
  period: string,
): Promise<WorkspaceFacts> {
  const [pool, reserve] = await Promise.all([
    getBudgetPoolFacts(db, ledgerId, currency, period),
    getReserveFacts(db, ledgerId, currency, period),
  ]);
  return { ...pool, reservesMinor: Math.max(reserve.reserveMinor, pool.reservesMinor) };
}

/** Per-envelope, per-month deltas driving the sequential waterfall walk. */
interface EnvelopeMonthDelta {
  assignedMinor: number;
  cashSpentMinor: number;
  cardSpentMinor: number;
}

async function getEnvelopeMonthDeltas(
  db: CommandDatabase,
  ledgerId: string,
  currency: string,
  startPeriod: string,
  endPeriod: string,
): Promise<Map<string, Map<string, EnvelopeMonthDelta>>> {
  const floor = `${startPeriod}-01`;
  const ceiling = periodCeiling(endPeriod);

  // Expenses attributed through the #89 category timeline AT each
  // transaction's own date, net of linked Refunds (#91 parity), split by
  // account class because card spending routes through the reserve instead
  // of driving availability negative.
  const spendRows = await queryRows<{
    envelope_id: string;
    month: string;
    is_card: number | boolean;
    spent_minor: number;
  }>(
    db,
    sql`SELECT cm.envelope_id AS envelope_id,
        substr(t.date, 1, 7) AS month,
        ca.type = 'card' AS is_card,
        SUM(
          t.amount_minor
          - COALESCE((
            SELECT SUM(r.amount_minor)
            FROM refund_links r
            WHERE r.ledger_id = t.ledger_id
              AND r.original_transaction_id = t.id
          ), 0)
        ) AS spent_minor
      FROM transactions t
      JOIN accounts ca
        ON ca.ledger_id = t.ledger_id AND ca.id = t.account_id
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
        AND t.date >= ${floor}
        AND t.date < ${ceiling}
      GROUP BY cm.envelope_id, substr(t.date, 1, 7), (ca.type = 'card')`,
  );

  const assignmentRows = await queryRows<{
    envelope_id: string;
    month: string;
    delta_minor: number;
  }>(
    db,
    sql`SELECT envelope_id, budget_period AS month, SUM(delta_minor) AS delta_minor
      FROM (
        SELECT g.budget_period, g.destination_envelope_id AS envelope_id, g.amount_minor AS delta_minor
        FROM assignments g
        WHERE g.ledger_id = ${ledgerId}
          AND g.currency = ${currency}
          AND g.budget_period BETWEEN ${startPeriod} AND ${endPeriod}
        UNION ALL
        SELECT g.budget_period, g.source_envelope_id AS envelope_id, -g.amount_minor AS delta_minor
        FROM assignments g
        WHERE g.ledger_id = ${ledgerId}
          AND g.currency = ${currency}
          AND g.budget_period BETWEEN ${startPeriod} AND ${endPeriod}
      )
      GROUP BY envelope_id, budget_period`,
  );

  const byEnvelope = new Map<string, Map<string, EnvelopeMonthDelta>>();
  const ensure = (envelopeId: string, month: string): EnvelopeMonthDelta => {
    let months = byEnvelope.get(envelopeId);
    if (!months) {
      months = new Map<string, EnvelopeMonthDelta>();
      byEnvelope.set(envelopeId, months);
    }
    const existing = months.get(month);
    if (existing) return existing;
    const created: EnvelopeMonthDelta = { assignedMinor: 0, cashSpentMinor: 0, cardSpentMinor: 0 };
    months.set(month, created);
    return created;
  };

  for (const row of spendRows) {
    const delta = ensure(row.envelope_id, row.month);
    if (Number(row.is_card)) delta.cardSpentMinor += Number(row.spent_minor);
    else delta.cashSpentMinor += Number(row.spent_minor);
  }
  for (const row of assignmentRows) {
    ensure(row.envelope_id, row.month).assignedMinor += Number(row.delta_minor);
  }

  return byEnvelope;
}

/** Latest period-effective rollover setting per envelope at or before `period`. */
async function getPositiveRolloverMap(
  db: CommandDatabase,
  ledgerId: string,
  currency: string,
  period: string,
): Promise<Map<string, boolean>> {
  const rows = await queryRows<{ envelope_id: string; positive_rollover: number | boolean }>(
    db,
    sql`
    SELECT r.envelope_id, r.positive_rollover
    FROM rollover_settings r
    JOIN envelopes e ON e.ledger_id = r.ledger_id AND e.id = r.envelope_id
    WHERE r.ledger_id = ${ledgerId}
      AND e.currency = ${currency}
      AND r.effective_from_period = (
        SELECT MAX(x.effective_from_period)
        FROM rollover_settings x
        WHERE x.ledger_id = r.ledger_id
          AND x.envelope_id = r.envelope_id
          AND x.effective_from_period <= ${period}
      )`,
  );
  return new Map(rows.map((r) => [r.envelope_id, Number(r.positive_rollover) !== 0]));
}

/** Active expense Category ids per Envelope effective at `period`. */
async function getActiveExpenseCategoriesMap(
  db: CommandDatabase,
  ledgerId: string,
  period: string,
): Promise<Map<string, Set<string>>> {
  // #89 timeline semantics: effective_to_period is DERIVED (LEAD), never
  // stored — "effective at period" means the latest row at or before it.
  const rows = await queryRows<{ envelope_id: string; category_id: string }>(
    db,
    sql`
    SELECT c.envelope_id, c.category_id
    FROM category_mappings c
    INNER JOIN categories cat ON cat.ledger_id = c.ledger_id AND cat.id = c.category_id
    WHERE c.ledger_id = ${ledgerId}
      AND c.effective_from_period = (
        SELECT MAX(x.effective_from_period)
        FROM category_mappings x
        WHERE x.ledger_id = c.ledger_id
          AND x.category_id = c.category_id
          AND x.effective_from_period <= ${period}
      )
      AND cat.lifecycle = 'active'
      AND cat.type = 'expense'`,
  );
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = map.get(row.envelope_id) ?? new Set<string>();
    set.add(row.category_id);
    map.set(row.envelope_id, set);
  }
  return map;
}

/**
 * Builds projections for every period in `[startPeriod..endPeriod]`, walking
 * from the workspace's activation month so Rollover carry into the window is
 * correct regardless of where the window starts.
 */
export async function buildProjections(options: {
  db: CommandDatabase;
  ledgerId: string;
  currency: string;
  activationPeriod: string;
  startPeriod: string;
  endPeriod: string;
}): Promise<PeriodProjection[]> {
  const { db, ledgerId, currency, activationPeriod, startPeriod, endPeriod } = options;

  const envelopeRows = await db
    .select({
      id: envelope.id,
      name: envelope.name,
      icon: envelope.icon,
      color: envelope.color,
      lifecycle: envelope.lifecycle,
      sortOrder: envelope.sortOrder,
    })
    .from(envelope)
    .where(and(eq(envelope.ledgerId, ledgerId), eq(envelope.currency, currency)))
    .orderBy(envelope.sortOrder, envelope.name);

  const walkStart = startPeriod < activationPeriod ? activationPeriod : startPeriod;
  const walkedPeriods = enumeratePeriods(walkStart, endPeriod);
  const monthDeltas = await getEnvelopeMonthDeltas(db, ledgerId, currency, walkStart, endPeriod);

  const carryByEnvelope = new Map<string, number>();
  const activeExpenseCategories = await getActiveExpenseCategoriesMap(db, ledgerId, endPeriod);

  const projections: PeriodProjection[] = [];
  for (const period of walkedPeriods) {
    // Rollover settings are period-effective and can flip AT any month, so
    // they are resolved per walked month (cheap timeline lookup).
    const positiveRollover = await getPositiveRolloverMap(db, ledgerId, currency, period);

    const facts =
      period >= startPeriod ? await getWorkspaceFacts(db, ledgerId, currency, period) : null;

    const envelopes: EnvelopeProjection[] = [];
    for (const row of envelopeRows) {
      const delta =
        monthDeltas.get(row.id)?.get(period) ??
        ({ assignedMinor: 0, cashSpentMinor: 0, cardSpentMinor: 0 } as EnvelopeMonthDelta);

      // Sequential waterfall. First truncate the INCOMING carry per this
      // month's Rollover setting: an Envelope configured to start fresh
      // returns its POSITIVE carry to Unassigned Money at the boundary while
      // overspending still carries forward (CONTEXT.md: Rollover). Then apply
      // this month's Assignments and cash spending, and let card spending
      // consume room without driving availability below zero (CONTEXT.md:
      // Available Money). Cash overspending goes negative and carries on.
      const rawCarry = carryByEnvelope.get(row.id) ?? 0;
      const positive = positiveRollover.get(row.id) ?? true;
      const carriedIn = positive ? rawCarry : Math.min(rawCarry, 0);

      const open = carriedIn + delta.assignedMinor - delta.cashSpentMinor;
      const cardUse = Math.min(delta.cardSpentMinor, Math.max(open, 0));
      const unfunded = delta.cardSpentMinor - cardUse;
      const available = open - cardUse;

      carryByEnvelope.set(row.id, available);

      if (facts === null) continue;

      const reasons: ProjectionAttentionReason[] = [];
      if (available < 0) reasons.push({ kind: "envelope-overspending" });
      if (unfunded > 0) reasons.push({ kind: "unfunded-card-spending" });
      const mappedExpense = activeExpenseCategories.get(row.id);
      if (row.lifecycle === "active" && (!mappedExpense || mappedExpense.size === 0)) {
        reasons.push({
          kind: "missing-active-expense-category",
          recoveryAction: "Map at least one active expense Category to this Envelope.",
        });
      }

      envelopes.push({
        envelopeId: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        lifecycle: row.lifecycle,
        sortOrder: row.sortOrder,
        assignedMinor: delta.assignedMinor,
        netSpentMinor: delta.cashSpentMinor + delta.cardSpentMinor,
        availableMinor: available,
        unfundedCardSpendingMinor: unfunded,
        health: {
          status: reasons.length === 0 ? "ready" : "needs_attention",
          reasons,
        },
      });
    }

    if (facts === null) continue;

    const budgetHealth: ProjectionHealth = {
      status: facts.unassignedMinor < 0 ? "needs_attention" : "ready",
      reasons: facts.unassignedMinor < 0 ? [{ kind: "budget-shortfall" }] : [],
    };

    projections.push({
      currency,
      budgetPeriod: period,
      ...facts,
      budgetHealth,
      envelopes,
    });
  }

  return projections;
}

/**
 * Read path: serve seq-stamped cache rows, rebuild only the stale ones.
 * Returns projections ordered by Budget Period ascending.
 */
export async function getProjections(
  db: CommandDatabase,
  caller: LedgerCaller,
  input: { currency: string; startPeriod: string; endPeriod: string },
): Promise<{ seqStamped: number; projections: PeriodProjection[] }> {
  await requireLedgerAccess(db, caller.userId, caller.ledgerId);
  const ledgerId = caller.ledgerId;
  const householdId = isPersonalLedgerId(ledgerId) ? null : ledgerId;

  const requestedPeriods = enumeratePeriods(input.startPeriod, input.endPeriod);
  if (requestedPeriods.length === 0) {
    return { seqStamped: 0, projections: [] };
  }

  const workspaces = await db
    .select({ activationPeriod: budgetWorkspace.activationPeriod })
    .from(budgetWorkspace)
    .where(
      and(eq(budgetWorkspace.ledgerId, ledgerId), eq(budgetWorkspace.currency, input.currency)),
    )
    .limit(1);
  const activationPeriod = workspaces[0]?.activationPeriod;
  if (!activationPeriod) {
    throw new Error(
      `No Budget Workspace exists for currency ${input.currency}. Activate one before reading projections.`,
    );
  }

  const seq = await currentLedgerSeq(db, ledgerId);

  const cachedRows = requestedPeriods.length
    ? await db
        .select({
          budgetPeriod: periodProjectionCache.budgetPeriod,
          projectionJson: periodProjectionCache.projectionJson,
          seqStamped: periodProjectionCache.seqStamped,
        })
        .from(periodProjectionCache)
        .where(
          and(
            eq(periodProjectionCache.ledgerId, ledgerId),
            eq(periodProjectionCache.currency, input.currency),
            inArray(periodProjectionCache.budgetPeriod, requestedPeriods),
          ),
        )
    : [];

  const freshByKey = new Map<string, PeriodProjection>();
  for (const row of cachedRows) {
    if (Number(row.seqStamped) === seq) {
      freshByKey.set(row.budgetPeriod, row.projectionJson as PeriodProjection);
    }
  }

  const stalePeriods = requestedPeriods.filter((period) => !freshByKey.has(period));

  /** One stamped UPSERT; concurrent writers may interleave but every row ends
   * stamped with a seq it was actually computed at, so a later read
   * self-heals anything computed against a lagging stamp. */
  const cachePut = async (projection: PeriodProjection): Promise<void> => {
    await db
      .insert(periodProjectionCache)
      .values({
        ledgerId,
        householdId,
        currency: input.currency,
        budgetPeriod: projection.budgetPeriod,
        projectionJson: projection,
        seqStamped: seq,
      })
      .onConflictDoUpdate({
        target: [
          periodProjectionCache.ledgerId,
          periodProjectionCache.currency,
          periodProjectionCache.budgetPeriod,
        ],
        set: { projectionJson: projection, seqStamped: seq },
      });
    freshByKey.set(projection.budgetPeriod, projection);
  };

  if (stalePeriods.length > 0) {
    // Periods before the workspace's activation have no facts to project;
    // record explicit empty projections so such reads stop re-walking.
    const preActivation = stalePeriods.filter((period) => period < activationPeriod);
    for (const period of preActivation) {
      await cachePut({
        currency: input.currency,
        budgetPeriod: period,
        fundingPoolMinor: 0,
        assignedMinor: 0,
        reservesMinor: 0,
        unassignedMinor: 0,
        budgetHealth: { status: "ready", reasons: [] },
        envelopes: [],
      });
    }

    const buildable = stalePeriods.filter((period) => period >= activationPeriod);
    if (buildable.length > 0) {
      const built = await buildProjections({
        db,
        ledgerId,
        currency: input.currency,
        activationPeriod,
        startPeriod: buildable[0],
        endPeriod: buildable[buildable.length - 1],
      });
      for (const projection of built) {
        await cachePut(projection);
      }
    }
  }

  const projections = requestedPeriods
    .map((period) => freshByKey.get(period))
    .filter((p): p is PeriodProjection => Boolean(p));
  return { seqStamped: seq, projections };
}
