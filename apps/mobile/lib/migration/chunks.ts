import {
  IMPORT_ENTITY_TYPES,
  MAX_IMPORT_CHUNK_ROWS,
  type ImportBundlePayload,
  type ImportEntityType,
} from "@trove/protocol";
import { addMonths, format, parse } from "date-fns";

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
import { toWireAccountType } from "@/lib/account-wire-type";

import type { LocalDb } from "./manifest";

/**
 * Builds every `import_bundle` chunk for the local-to-cloud migration (#98),
 * in `IMPORT_ENTITY_TYPES` order so a later chunk's references (account
 * before transaction) already exist server-side by the time it lands.
 * Entity types with no local rows are skipped entirely.
 */
export async function buildImportChunks(
  db: LocalDb,
  ledgerId: string,
): Promise<readonly ImportBundlePayload[]> {
  const chunks: ImportBundlePayload[] = [];
  // Categories keep a single global server id (no per-household scoping — required
  // by PowerSync's row-identity contract), but every fresh install seeds identical
  // fixed ids (see apps/mobile/db/seed.ts, e.g. "seed_cat_food"). "category" is
  // processed before anything that references it, so this map is fully populated
  // by the time later entity types need to remap their categoryId (#194).
  const categoryIdMap = new Map<string, string>();
  for (const entityType of IMPORT_ENTITY_TYPES) {
    const rows = await loadWireRows(db, entityType, ledgerId, categoryIdMap);
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

/**
 * Namespaces a locally seeded/created category id by ledger so two ledgers'
 * categories never collide on the server's single global id column.
 * Deterministic, so a retry recomputes the same id (#194 / #229).
 */
function remapCategoryId(ledgerId: string, localCategoryId: string): string {
  return `${ledgerId}::${localCategoryId}`;
}

async function loadWireRows(
  db: LocalDb,
  entityType: ImportEntityType,
  ledgerId: string,
  categoryIdMap: Map<string, string>,
): Promise<readonly Record<string, unknown>[]> {
  switch (entityType) {
    case "account": {
      const rows = await db.select().from(accounts);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: toWireAccountType(row.type),
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
      for (const row of rows) {
        categoryIdMap.set(row.id, remapCategoryId(ledgerId, row.id));
      }
      return rows.map((row) => ({
        id: categoryIdMap.get(row.id) ?? remapCategoryId(ledgerId, row.id),
        name: row.name,
        type: row.type,
        color: row.color,
        icon: row.icon,
        parentId: row.parentId
          ? (categoryIdMap.get(row.parentId) ?? remapCategoryId(ledgerId, row.parentId))
          : null,
        sortOrder: row.sortOrder,
        lifecycle: row.lifecycle,
        lifecycleChangedAt: row.lifecycleChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "recurring_rule": {
      const rows = await db.select().from(recurringRules);
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        amountMinor: row.amountMinor,
        currency: row.currency,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId: row.categoryId ? (categoryIdMap.get(row.categoryId) ?? row.categoryId) : null,
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
    case "budget_workspace": {
      const rows = await db.select().from(budgetWorkspaces);
      return rows.map((row) => ({
        id: `migration:workspace:${row.currency}`,
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
    case "category_mapping": {
      const rows = await db.select().from(categoryMappings);
      const starts = new Set(rows.map((row) => `${row.categoryId}\0${row.effectiveFromPeriod}`));
      return rows.flatMap((row) => {
        const categoryId = categoryIdMap.get(row.categoryId) ?? row.categoryId;
        return [
          {
            id: `migration:mapping:${categoryId}:${row.effectiveFromPeriod}`,
            categoryId,
            envelopeId: row.envelopeId,
            effectiveFromPeriod: row.effectiveFromPeriod,
            createdAt: row.createdAt,
          },
          ...(row.effectiveToPeriod &&
          !starts.has(`${row.categoryId}\0${nextPeriod(row.effectiveToPeriod)}`)
            ? [
                {
                  id: `migration:mapping:${categoryId}:${nextPeriod(row.effectiveToPeriod)}`,
                  categoryId,
                  envelopeId: null,
                  effectiveFromPeriod: nextPeriod(row.effectiveToPeriod),
                  createdAt: row.createdAt,
                },
              ]
            : []),
        ];
      });
    }
    case "funding_membership": {
      const rows = await db.select().from(fundingMemberships);
      const starts = new Set(rows.map((row) => `${row.accountId}\0${row.effectiveFromPeriod}`));
      return rows.flatMap((row) => [
        {
          id: `migration:funding:${row.accountId}:${row.effectiveFromPeriod}`,
          accountId: row.accountId,
          currency: row.currency,
          active: true,
          effectiveFromPeriod: row.effectiveFromPeriod,
          createdAt: row.createdAt,
        },
        ...(row.effectiveToPeriod &&
        !starts.has(`${row.accountId}\0${nextPeriod(row.effectiveToPeriod)}`)
          ? [
              {
                id: `migration:funding:${row.accountId}:${nextPeriod(row.effectiveToPeriod)}`,
                accountId: row.accountId,
                currency: row.currency,
                active: false,
                effectiveFromPeriod: nextPeriod(row.effectiveToPeriod),
                createdAt: row.createdAt,
              },
            ]
          : []),
      ]);
    }
    case "rollover_setting": {
      const rows = await db.select().from(rolloverSettings);
      return rows.map((row) => ({
        id: `migration:rollover:${row.envelopeId}:${row.effectiveFromPeriod}`,
        envelopeId: row.envelopeId,
        effectiveFromPeriod: row.effectiveFromPeriod,
        positiveRollover: row.positiveRollover,
        createdAt: row.createdAt,
      }));
    }
    case "assignment": {
      const rows = await db.select().from(assignments);
      return rows
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((row) => ({
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
        categoryId: row.categoryId ? (categoryIdMap.get(row.categoryId) ?? row.categoryId) : null,
        isRecurring: row.isRecurring,
        recurringRuleId: row.recurringRuleId,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    }
    case "recurring_occurrence": {
      const rows = await db.select().from(recurringOccurrences);
      return rows.map((row) => ({
        id: `migration:occurrence:${row.ruleId}:${row.scheduledDate}`,
        ruleId: row.ruleId,
        scheduledDate: row.scheduledDate,
        transactionId: row.transactionId,
        settledAt: row.settledAt,
      }));
    }
  }
}

function nextPeriod(period: string): string {
  return format(addMonths(parse(period, "yyyy-MM", new Date(0)), 1), "yyyy-MM");
}
