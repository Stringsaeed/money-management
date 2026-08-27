import {
  IMPORT_ENTITY_TYPES,
  MAX_IMPORT_CHUNK_ROWS,
  type ImportBundlePayload,
  type ImportEntityType,
} from "@trove/protocol";

import {
  accounts,
  assignments,
  budgetWorkspaces,
  categories,
  categoryMappings,
  envelopes,
  fundingMemberships,
  recurringOccurrences,
  recurringRules,
  rolloverSettings,
  transactions,
} from "@/db/schema";
import { nextBudgetPeriod } from "@/utils/date";

import type { LocalDb } from "./manifest";

/**
 * Builds every `import_bundle` chunk for the local-to-cloud migration (#98),
 * in `IMPORT_ENTITY_TYPES` order so a later chunk's references (account
 * before transaction, envelope before assignment, ...) already exist
 * server-side by the time it lands. Entity types with no local rows are
 * skipped entirely — the client sends only what it actually has.
 */
export async function buildImportChunks(db: LocalDb): Promise<readonly ImportBundlePayload[]> {
  const chunks: ImportBundlePayload[] = [];
  for (const entityType of IMPORT_ENTITY_TYPES) {
    const rows = await loadWireRows(db, entityType);
    if (rows.length === 0) {
      continue;
    }
    const chunkCount = Math.ceil(rows.length / MAX_IMPORT_CHUNK_ROWS);
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const start = chunkIndex * MAX_IMPORT_CHUNK_ROWS;
      chunks.push({
        entityType,
        chunkIndex,
        chunkCount,
        rows: rows.slice(start, start + MAX_IMPORT_CHUNK_ROWS),
      });
    }
  }
  return chunks;
}

/** Loads every local row for `entityType`, mapped onto the server's wire row shape. */
async function loadWireRows(
  db: LocalDb,
  entityType: ImportEntityType,
): Promise<readonly Record<string, unknown>[]> {
  switch (entityType) {
    case "account": {
      const rows = await db.select().from(accounts);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        currency: row.currency,
        color: row.color,
        icon: row.icon,
        initialBalanceMinor: row.initialBalance,
        excludeFromTotal: row.excludeFromTotal,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "category": {
      const rows = await db.select().from(categories);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon,
        parentId: row.parentId,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "recurringRule": {
      const rows = await db.select().from(recurringRules);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        amountMinor: row.amountMinor,
        currency: row.currency,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId: row.categoryId,
        description: row.description,
        frequency: row.frequency,
        intervalCount: row.intervalCount,
        startDate: row.startDate,
        endDate: row.endDate,
        endCount: row.endCount,
        timeZone: row.timeZone,
        lifecycle: row.lifecycle,
        health: row.health,
        attentionReasons: row.attentionReasons,
        attentionDetails: row.attentionDetails,
        eligibilityFloor: row.eligibilityFloor,
        revision: row.revision,
        lifecycleChangedAt: row.lifecycleChangedAt,
        healthChangedAt: row.healthChangedAt,
        lastSettlementAttemptAt: row.lastSettlementAttemptAt,
        lastSettlementError: row.lastSettlementError,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "recurringOccurrence": {
      const rows = await db.select().from(recurringOccurrences);
      return rows.map((row) => ({
        ruleId: row.ruleId,
        scheduledDate: row.scheduledDate,
        transactionId: row.transactionId,
        settledAt: row.settledAt,
      }));
    }
    case "transaction": {
      const rows = await db.select().from(transactions);
      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        amountMinor: row.amount,
        currency: row.currency,
        originalAmountMinor: row.originalAmount,
        originalCurrency: row.originalCurrency,
        exchangeRate: row.exchangeRate,
        date: row.date,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId: row.categoryId,
        isRecurring: row.isRecurring,
        recurringRuleId: row.recurringRuleId,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "budgetWorkspace": {
      const rows = await db.select().from(budgetWorkspaces);
      return rows.map((row) => ({
        currency: row.currency,
        activationPeriod: row.activationPeriod,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "envelope": {
      const rows = await db.select().from(envelopes);
      return rows.map((row) => ({
        id: row.id,
        currency: row.currency,
        name: row.name,
        icon: row.icon,
        color: row.color,
        lifecycle: row.lifecycle,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "categoryMapping": {
      const rows = await db.select().from(categoryMappings);
      // `effectiveToPeriod` is dropped: the server derives it via
      // LEAD(effective_from_period) instead of storing it (Porting strategy).
      return rows.map((row) => ({
        categoryId: row.categoryId,
        envelopeId: row.envelopeId,
        effectiveFromPeriod: row.effectiveFromPeriod,
        createdAt: row.createdAt,
      }));
    }
    case "fundingMembership": {
      const rows = await db.select().from(fundingMemberships);
      return rows.flatMap((row) => expandFundingMembershipRow(row));
    }
    case "rolloverSetting": {
      const rows = await db.select().from(rolloverSettings);
      return rows.map((row) => ({
        envelopeId: row.envelopeId,
        positiveRollover: row.positiveRollover,
        effectiveFromPeriod: row.effectiveFromPeriod,
        createdAt: row.createdAt,
      }));
    }
    case "assignment": {
      const rows = await db.select().from(assignments);
      return rows.map((row) => ({
        id: row.id,
        currency: row.currency,
        budgetPeriod: row.budgetPeriod,
        sourceEnvelopeId: row.sourceEnvelopeId,
        destinationEnvelopeId: row.destinationEnvelopeId,
        amountMinor: row.amountMinor,
        reversesAssignmentId: row.reversesAssignmentId,
        createdAt: row.createdAt,
      }));
    }
  }
}

interface LocalFundingMembershipRow {
  accountId: string;
  currency: string;
  effectiveFromPeriod: string;
  effectiveToPeriod: string | null;
  createdAt: string;
}

/**
 * The server has no `effective_to_period` column for Funding Memberships —
 * it models an exit as a tombstone row (`active = false`) starting the
 * period after the membership ended, instead of storing the local model's
 * own end-period column (Porting strategy shape conflict). One local row
 * with a non-null `effectiveToPeriod` becomes two wire rows.
 */
function expandFundingMembershipRow(
  row: LocalFundingMembershipRow,
): readonly Record<string, unknown>[] {
  const activeRow = {
    accountId: row.accountId,
    currency: row.currency,
    active: true,
    effectiveFromPeriod: row.effectiveFromPeriod,
    createdAt: row.createdAt,
  };
  if (!row.effectiveToPeriod) {
    return [activeRow];
  }
  return [
    activeRow,
    {
      accountId: row.accountId,
      currency: row.currency,
      active: false,
      effectiveFromPeriod: nextBudgetPeriod(row.effectiveToPeriod),
      createdAt: row.createdAt,
    },
  ];
}
