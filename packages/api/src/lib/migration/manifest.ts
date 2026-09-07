import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { canonicalizeImportContent, type ImportManifest } from "@trove/protocol";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";
import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  rolloverSetting,
} from "@trove/db/schema/budget";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";

import type { CommandDatabase } from "../commands/types";
import {
  accountContentRow,
  assignmentContentRow,
  budgetWorkspaceContentRow,
  categoryMappingContentRow,
  categoryContentRow,
  envelopeContentRow,
  fundingMembershipContentRow,
  recurringOccurrenceContentRow,
  recurringRuleContentRow,
  rolloverSettingContentRow,
  sha256Hex,
  transactionContentRow,
} from "./import-content";

type ImportAggregate = string | number | bigint;

const importAggregateSchema = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number(), z.bigint().transform(Number)])
  .pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER));

export async function computeImportManifest(
  db: CommandDatabase,
  householdId: string,
): Promise<ImportManifest> {
  return db.transaction((tx) => computeImportManifestSnapshot(tx, householdId), {
    isolationLevel: "repeatable read",
    accessMode: "read only",
  });
}

type ManifestDatabase = Pick<CommandDatabase, "select">;

async function computeImportManifestSnapshot(
  db: ManifestDatabase,
  householdId: string,
): Promise<ImportManifest> {
  const [
    accountCount,
    categoryCount,
    transactionCount,
    transactionSums,
    accountRows,
    categoryRows,
    transactionRows,
    recurringRuleRows,
    budgetWorkspaceRows,
    envelopeRows,
    categoryMappingRows,
    fundingMembershipRows,
    rolloverSettingRows,
    assignmentRows,
    recurringOccurrenceRows,
  ] = await Promise.all([
    db
      .select({ count: sql<ImportAggregate>`COUNT(*)` })
      .from(ledgerAccount)
      .where(eq(ledgerAccount.householdId, householdId)),
    db
      .select({ count: sql<ImportAggregate>`COUNT(*)` })
      .from(category)
      .where(eq(category.householdId, householdId)),
    db
      .select({ count: sql<ImportAggregate>`COUNT(*)` })
      .from(transaction)
      .where(eq(transaction.householdId, householdId)),
    db
      .select({
        key: transaction.accountId,
        total: sql<ImportAggregate>`COALESCE(SUM(${transaction.amountMinor}), 0)`,
      })
      .from(transaction)
      .where(eq(transaction.householdId, householdId))
      .groupBy(transaction.accountId),
    db.select().from(ledgerAccount).where(eq(ledgerAccount.householdId, householdId)),
    db.select().from(category).where(eq(category.householdId, householdId)),
    db.select().from(transaction).where(eq(transaction.householdId, householdId)),
    db.select().from(recurringRule).where(eq(recurringRule.householdId, householdId)),
    db.select().from(budgetWorkspace).where(eq(budgetWorkspace.householdId, householdId)),
    db.select().from(envelope).where(eq(envelope.householdId, householdId)),
    db.select().from(categoryMapping).where(eq(categoryMapping.householdId, householdId)),
    db.select().from(fundingMembership).where(eq(fundingMembership.householdId, householdId)),
    db.select().from(rolloverSetting).where(eq(rolloverSetting.householdId, householdId)),
    db.select().from(assignment).where(eq(assignment.householdId, householdId)),
    db.select().from(recurringOccurrence).where(eq(recurringOccurrence.householdId, householdId)),
  ]);
  const canonicalContent = canonicalizeImportContent([
    ...accountRows.map(accountContentRow),
    ...categoryRows.map(categoryContentRow),
    ...recurringRuleRows.map(recurringRuleContentRow),
    ...budgetWorkspaceRows.map(budgetWorkspaceContentRow),
    ...envelopeRows.map(envelopeContentRow),
    ...categoryMappingRows.map(categoryMappingContentRow),
    ...fundingMembershipRows.map(fundingMembershipContentRow),
    ...rolloverSettingRows.map(rolloverSettingContentRow),
    ...assignmentRows.map(assignmentContentRow),
    ...transactionRows.map(transactionContentRow),
    ...recurringOccurrenceRows.map(recurringOccurrenceContentRow),
  ]);

  return {
    rowCounts: {
      account: parseImportAggregate(accountCount[0]?.count ?? 0, "account count"),
      category: parseImportAggregate(categoryCount[0]?.count ?? 0, "category count"),
      recurring_rule: recurringRuleRows.length,
      budget_workspace: budgetWorkspaceRows.length,
      envelope: envelopeRows.length,
      category_mapping: categoryMappingRows.length,
      funding_membership: fundingMembershipRows.length,
      rollover_setting: rolloverSettingRows.length,
      assignment: assignmentRows.length,
      transaction: parseImportAggregate(transactionCount[0]?.count ?? 0, "transaction count"),
      recurring_occurrence: recurringOccurrenceRows.length,
    },
    transactionAmountMinorByAccount: sumsByKey(transactionSums),
    contentDigest: await sha256Hex(canonicalContent),
  };
}

export function parseImportAggregate(value: ImportAggregate, label: string): number {
  const result = importAggregateSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid ${label} returned by the database.`);
  }
  return result.data;
}

function sumsByKey(rows: readonly { key: string; total: ImportAggregate }[]) {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.key] = parseImportAggregate(row.total, `transaction amount sum for ${row.key}`);
  }
  return totals;
}
