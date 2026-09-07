import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";

import {
  powerSyncAssignmentRowSchema,
  powerSyncBudgetWorkspaceRowSchema,
  powerSyncCategoryMappingRowSchema,
  powerSyncEnvelopeRowSchema,
  powerSyncFundingMembershipRowSchema,
  powerSyncRecurringOccurrenceRowSchema,
  powerSyncRecurringRuleRowSchema,
  powerSyncRefundLinkRowSchema,
  powerSyncRolloverSettingRowSchema,
  type PowerSyncRecurringOccurrenceRow,
  type PowerSyncRecurringRuleRow,
  type PowerSyncAssignmentRow,
  type PowerSyncBudgetWorkspaceRow,
  type PowerSyncCategoryMappingRow,
  type PowerSyncEnvelopeRow,
  type PowerSyncRolloverSettingRow,
} from "@/modules/powersync/domain-types";

import type { PowerSyncLedgerCollections } from "./collections";
import {
  powerSyncAccountRowSchema,
  powerSyncCategoryRowSchema,
  powerSyncRejectedChangeRowSchema,
  powerSyncTransactionRowSchema,
  type PowerSyncAccountRow,
  type PowerSyncCategoryRow,
  type PowerSyncRejectedChangeRow,
  type PowerSyncTransactionRow,
} from "./types";

export const createTestLedgerCollections = (initial?: {
  readonly accounts?: PowerSyncAccountRow[];
  readonly categories?: PowerSyncCategoryRow[];
  readonly transactions?: PowerSyncTransactionRow[];
  readonly rejectedChanges?: PowerSyncRejectedChangeRow[];
  readonly recurringOccurrences?: PowerSyncRecurringOccurrenceRow[];
  readonly recurringRules?: PowerSyncRecurringRuleRow[];
  readonly assignments?: PowerSyncAssignmentRow[];
  readonly budgetWorkspaces?: PowerSyncBudgetWorkspaceRow[];
  readonly categoryMappings?: PowerSyncCategoryMappingRow[];
  readonly envelopes?: PowerSyncEnvelopeRow[];
  readonly rolloverSettings?: PowerSyncRolloverSettingRow[];
}): PowerSyncLedgerCollections => {
  const collections = {
    accounts: createCollection(
      localOnlyCollectionOptions({
        id: `test-accounts-${Math.random()}`,
        schema: powerSyncAccountRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.accounts ?? [],
      }),
    ),
    assignments: createCollection(
      localOnlyCollectionOptions({
        id: `test-assignments-${Math.random()}`,
        schema: powerSyncAssignmentRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.assignments ?? [],
      }),
    ),
    budgetWorkspaces: createCollection(
      localOnlyCollectionOptions({
        id: `test-budget-workspaces-${Math.random()}`,
        schema: powerSyncBudgetWorkspaceRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.budgetWorkspaces ?? [],
      }),
    ),
    categories: createCollection(
      localOnlyCollectionOptions({
        id: `test-categories-${Math.random()}`,
        schema: powerSyncCategoryRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.categories ?? [],
      }),
    ),
    categoryMappings: createCollection(
      localOnlyCollectionOptions({
        id: `test-category-mappings-${Math.random()}`,
        schema: powerSyncCategoryMappingRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.categoryMappings ?? [],
      }),
    ),
    envelopes: createCollection(
      localOnlyCollectionOptions({
        id: `test-envelopes-${Math.random()}`,
        schema: powerSyncEnvelopeRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.envelopes ?? [],
      }),
    ),
    fundingMemberships: createCollection(
      localOnlyCollectionOptions({
        id: `test-funding-memberships-${Math.random()}`,
        schema: powerSyncFundingMembershipRowSchema,
        getKey: (row) => row.id,
        initialData: [],
      }),
    ),
    recurringOccurrences: createCollection(
      localOnlyCollectionOptions({
        id: `test-recurring-occurrences-${Math.random()}`,
        schema: powerSyncRecurringOccurrenceRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.recurringOccurrences ?? [],
      }),
    ),
    recurringRules: createCollection(
      localOnlyCollectionOptions({
        id: `test-recurring-rules-${Math.random()}`,
        schema: powerSyncRecurringRuleRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.recurringRules ?? [],
      }),
    ),
    refundLinks: createCollection(
      localOnlyCollectionOptions({
        id: `test-refund-links-${Math.random()}`,
        schema: powerSyncRefundLinkRowSchema,
        getKey: (row) => row.id,
        initialData: [],
      }),
    ),
    transactions: createCollection(
      localOnlyCollectionOptions({
        id: `test-transactions-${Math.random()}`,
        schema: powerSyncTransactionRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.transactions ?? [],
      }),
    ),
    rejectedChanges: createCollection(
      localOnlyCollectionOptions({
        id: `test-rejected-${Math.random()}`,
        schema: powerSyncRejectedChangeRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.rejectedChanges ?? [],
      }),
    ),
    rolloverSettings: createCollection(
      localOnlyCollectionOptions({
        id: `test-rollover-settings-${Math.random()}`,
        schema: powerSyncRolloverSettingRowSchema,
        getKey: (row) => row.id,
        initialData: initial?.rolloverSettings ?? [],
      }),
    ),
  };
  return collections;
};

export const preloadTestLedgerCollections = async (
  collections: PowerSyncLedgerCollections,
): Promise<void> => {
  await Promise.all([
    collections.accounts.preload(),
    collections.assignments.preload(),
    collections.budgetWorkspaces.preload(),
    collections.categories.preload(),
    collections.categoryMappings.preload(),
    collections.envelopes.preload(),
    collections.fundingMemberships.preload(),
    collections.recurringOccurrences.preload(),
    collections.recurringRules.preload(),
    collections.refundLinks.preload(),
    collections.transactions.preload(),
    collections.rejectedChanges.preload(),
    collections.rolloverSettings.preload(),
  ]);
};
