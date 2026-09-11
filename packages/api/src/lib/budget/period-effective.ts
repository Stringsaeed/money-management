import { and, asc, eq, sql, type AnyColumn } from "drizzle-orm";

import { categoryMapping, fundingMembership, rolloverSetting } from "@trove/db/schema/budget";

import type { CommandDatabase } from "../commands/types";
import { requireLedgerAccess, type LedgerCaller } from "../require-member";

export type { LedgerCaller };

/**
 * Period-effective timelines (ADR-0006/0012/0016). `effective_to_period` is
 * never stored: it derives from `LEAD(effective_from_period) OVER (...)` over
 * each entity's row sequence. A NULL end means the row is still current;
 * tombstone rows (unmapped category / inactive membership) carry that state
 * forward until superseded.
 */

/**
 * The partition always includes `ledger_id` so the derivation stays
 * tenant-safe even if a caller forgets the ledger WHERE filter.
 */
const leadPeriod = (ledgerId: AnyColumn, entity: AnyColumn, column: AnyColumn) =>
  sql<string | null>`LEAD(${column}) OVER (PARTITION BY ${ledgerId}, ${entity} ORDER BY ${column})`;

export interface PeriodEffectiveRow {
  readonly effectiveFromPeriod: string;
  /** NULL when this row is the latest one — open-ended. */
  readonly effectiveToPeriod: string | null;
}

export interface CategoryMappingTimelineRow extends PeriodEffectiveRow {
  readonly categoryId: string;
  /** NULL = tombstone: the category is unmapped for this span. */
  readonly envelopeId: string | null;
}

export async function getCategoryMappingTimeline(
  db: CommandDatabase,
  caller: LedgerCaller,
): Promise<CategoryMappingTimelineRow[]> {
  await requireLedgerAccess(db, caller.userId, caller.ledgerId);
  return db
    .select({
      categoryId: categoryMapping.categoryId,
      envelopeId: categoryMapping.envelopeId,
      effectiveFromPeriod: categoryMapping.effectiveFromPeriod,
      effectiveToPeriod: leadPeriod(
        categoryMapping.ledgerId,
        categoryMapping.categoryId,
        categoryMapping.effectiveFromPeriod,
      ),
    })
    .from(categoryMapping)
    .where(eq(categoryMapping.ledgerId, caller.ledgerId))
    .orderBy(asc(categoryMapping.categoryId), asc(categoryMapping.effectiveFromPeriod));
}

export interface FundingMembershipTimelineRow extends PeriodEffectiveRow {
  readonly accountId: string;
  readonly currency: string;
  /** FALSE = tombstone: the account has left the pool for this span. */
  readonly active: boolean;
}

export async function getFundingMembershipTimeline(
  db: CommandDatabase,
  caller: LedgerCaller,
  currency?: string,
): Promise<FundingMembershipTimelineRow[]> {
  await requireLedgerAccess(db, caller.userId, caller.ledgerId);
  return db
    .select({
      accountId: fundingMembership.accountId,
      currency: fundingMembership.currency,
      active: fundingMembership.active,
      effectiveFromPeriod: fundingMembership.effectiveFromPeriod,
      effectiveToPeriod: leadPeriod(
        fundingMembership.ledgerId,
        fundingMembership.accountId,
        fundingMembership.effectiveFromPeriod,
      ),
    })
    .from(fundingMembership)
    .where(
      currency
        ? and(
            eq(fundingMembership.ledgerId, caller.ledgerId),
            eq(fundingMembership.currency, currency),
          )
        : eq(fundingMembership.ledgerId, caller.ledgerId),
    )
    .orderBy(asc(fundingMembership.accountId), asc(fundingMembership.effectiveFromPeriod));
}

export interface RolloverSettingTimelineRow extends PeriodEffectiveRow {
  readonly envelopeId: string;
  readonly positiveRollover: boolean;
}

export async function getRolloverSettingTimeline(
  db: CommandDatabase,
  caller: LedgerCaller,
): Promise<RolloverSettingTimelineRow[]> {
  await requireLedgerAccess(db, caller.userId, caller.ledgerId);
  return db
    .select({
      envelopeId: rolloverSetting.envelopeId,
      positiveRollover: rolloverSetting.positiveRollover,
      effectiveFromPeriod: rolloverSetting.effectiveFromPeriod,
      effectiveToPeriod: leadPeriod(
        rolloverSetting.ledgerId,
        rolloverSetting.envelopeId,
        rolloverSetting.effectiveFromPeriod,
      ),
    })
    .from(rolloverSetting)
    .where(eq(rolloverSetting.ledgerId, caller.ledgerId))
    .orderBy(asc(rolloverSetting.envelopeId), asc(rolloverSetting.effectiveFromPeriod));
}
