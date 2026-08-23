import { and, asc, eq, sql, type AnyColumn } from "drizzle-orm";

import { categoryMapping, fundingMembership, rolloverSetting } from "@trove/db/schema/budget";

import type { CommandDatabase } from "../commands/types";
import { requireHouseholdMember } from "../require-member";

/**
 * Period-effective timelines (ADR-0006/0012/0016). `effective_to_period` is
 * never stored: it derives from `LEAD(effective_from_period) OVER (...)` over
 * each entity's row sequence. A NULL end means the row is still current;
 * tombstone rows (unmapped category / inactive membership) carry that state
 * forward until superseded.
 */

const leadPeriod = (column: AnyColumn, partition: AnyColumn) =>
  sql<string | null>`LEAD(${column}) OVER (PARTITION BY ${partition} ORDER BY ${column})`;

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
  caller: { userId: string; householdId: string },
): Promise<CategoryMappingTimelineRow[]> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  return db
    .select({
      categoryId: categoryMapping.categoryId,
      envelopeId: categoryMapping.envelopeId,
      effectiveFromPeriod: categoryMapping.effectiveFromPeriod,
      effectiveToPeriod: leadPeriod(
        categoryMapping.effectiveFromPeriod,
        categoryMapping.categoryId,
      ),
    })
    .from(categoryMapping)
    .where(eq(categoryMapping.householdId, caller.householdId))
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
  caller: { userId: string; householdId: string },
  currency?: string,
): Promise<FundingMembershipTimelineRow[]> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  return db
    .select({
      accountId: fundingMembership.accountId,
      currency: fundingMembership.currency,
      active: fundingMembership.active,
      effectiveFromPeriod: fundingMembership.effectiveFromPeriod,
      effectiveToPeriod: leadPeriod(
        fundingMembership.effectiveFromPeriod,
        fundingMembership.accountId,
      ),
    })
    .from(fundingMembership)
    .where(
      currency
        ? and(
            eq(fundingMembership.householdId, caller.householdId),
            eq(fundingMembership.currency, currency),
          )
        : eq(fundingMembership.householdId, caller.householdId),
    )
    .orderBy(asc(fundingMembership.accountId), asc(fundingMembership.effectiveFromPeriod));
}

export interface RolloverSettingTimelineRow extends PeriodEffectiveRow {
  readonly envelopeId: string;
  readonly positiveRollover: boolean;
}

export async function getRolloverSettingTimeline(
  db: CommandDatabase,
  caller: { userId: string; householdId: string },
): Promise<RolloverSettingTimelineRow[]> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
  return db
    .select({
      envelopeId: rolloverSetting.envelopeId,
      positiveRollover: rolloverSetting.positiveRollover,
      effectiveFromPeriod: rolloverSetting.effectiveFromPeriod,
      effectiveToPeriod: leadPeriod(
        rolloverSetting.effectiveFromPeriod,
        rolloverSetting.envelopeId,
      ),
    })
    .from(rolloverSetting)
    .where(eq(rolloverSetting.householdId, caller.householdId))
    .orderBy(asc(rolloverSetting.envelopeId), asc(rolloverSetting.effectiveFromPeriod));
}
