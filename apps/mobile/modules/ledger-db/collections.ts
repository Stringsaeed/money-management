import type { PowerSyncDatabase } from "@powersync/react-native";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { createCollection, type CollectionStatus, type OperationConfig } from "@tanstack/react-db";

import {
  powerSyncAssignments,
  powerSyncAccounts,
  powerSyncBudgetWorkspaces,
  powerSyncCategories,
  powerSyncCategoryMappings,
  powerSyncEnvelopes,
  powerSyncFundingMemberships,
  powerSyncRecurringOccurrences,
  powerSyncRecurringRules,
  powerSyncRefundLinks,
  powerSyncRolloverSettings,
  powerSyncTransactions,
  rejectedChanges,
} from "@/modules/powersync/schema";
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
  type PowerSyncAssignmentRow,
  type PowerSyncBudgetWorkspaceRow,
  type PowerSyncCategoryMappingRow,
  type PowerSyncEnvelopeRow,
  type PowerSyncFundingMembershipRow,
  type PowerSyncRecurringOccurrenceRow,
  type PowerSyncRecurringRuleRow,
  type PowerSyncRefundLinkRow,
  type PowerSyncRolloverSettingRow,
} from "@/modules/powersync/domain-types";

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

export interface LedgerCollectionMutation {
  readonly isPersisted: { readonly promise: Promise<unknown> };
}

export interface LedgerCollection<Row extends { id: string }> {
  readonly status: CollectionStatus;
  readonly toArray: readonly (Row & { readonly $synced: boolean })[];
  readonly get: (id: string) => (Row & { readonly $synced: boolean }) | undefined;
  readonly insert: (row: Row, config?: OperationConfig) => LedgerCollectionMutation;
  readonly update: (
    id: string,
    config: OperationConfig,
    update: (row: Row) => void,
  ) => LedgerCollectionMutation;
  readonly delete: (id: string, config?: OperationConfig) => LedgerCollectionMutation;
  readonly subscribeChanges: (listener: () => void) => { unsubscribe: () => void };
  readonly on: (event: "status:change", listener: () => void) => () => void;
  readonly preload: () => Promise<void>;
  readonly cleanup: () => Promise<void>;
}

export interface PowerSyncLedgerCollections {
  readonly accounts: LedgerCollection<PowerSyncAccountRow>;
  readonly assignments: LedgerCollection<PowerSyncAssignmentRow>;
  readonly budgetWorkspaces: LedgerCollection<PowerSyncBudgetWorkspaceRow>;
  readonly categories: LedgerCollection<PowerSyncCategoryRow>;
  readonly categoryMappings: LedgerCollection<PowerSyncCategoryMappingRow>;
  readonly envelopes: LedgerCollection<PowerSyncEnvelopeRow>;
  readonly fundingMemberships: LedgerCollection<PowerSyncFundingMembershipRow>;
  readonly recurringOccurrences: LedgerCollection<PowerSyncRecurringOccurrenceRow>;
  readonly recurringRules: LedgerCollection<PowerSyncRecurringRuleRow>;
  readonly transactions: LedgerCollection<PowerSyncTransactionRow>;
  readonly refundLinks: LedgerCollection<PowerSyncRefundLinkRow>;
  readonly rejectedChanges: LedgerCollection<PowerSyncRejectedChangeRow>;
  readonly rolloverSettings: LedgerCollection<PowerSyncRolloverSettingRow>;
}

const householdStreamLoader =
  (database: PowerSyncDatabase, stream: string, householdId: string) => async () => {
    const subscription = await database
      .syncStream(stream, { household_id: householdId })
      .subscribe();
    await subscription.waitForFirstSync();
    return () => subscription.unsubscribe();
  };

export const createPowerSyncLedgerCollections = (
  database: PowerSyncDatabase,
  householdId: string,
): PowerSyncLedgerCollections => {
  const onLedgerLoad = householdStreamLoader(database, "household_ledger", householdId);
  const onBudgetLoad = householdStreamLoader(database, "household_budget", householdId);
  const onRecurringLoad = householdStreamLoader(database, "household_recurring", householdId);
  return {
    accounts: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-accounts:${householdId}`,
        database,
        table: powerSyncAccounts,
        schema: powerSyncAccountRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Account row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onLedgerLoad,
      }),
    ),
    categories: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-categories:${householdId}`,
        database,
        table: powerSyncCategories,
        schema: powerSyncCategoryRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Category row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onLedgerLoad,
      }),
    ),
    transactions: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-transactions:${householdId}`,
        database,
        table: powerSyncTransactions,
        schema: powerSyncTransactionRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Transaction row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onLedgerLoad,
      }),
    ),
    assignments: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-assignments:${householdId}`,
        database,
        table: powerSyncAssignments,
        schema: powerSyncAssignmentRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Assignment row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    budgetWorkspaces: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-budget-workspaces:${householdId}`,
        database,
        table: powerSyncBudgetWorkspaces,
        schema: powerSyncBudgetWorkspaceRowSchema,
        onDeserializationError: (error) => {
          throw new Error(
            `Invalid PowerSync Budget Workspace row: ${JSON.stringify(error.issues)}`,
          );
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    categoryMappings: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-category-mappings:${householdId}`,
        database,
        table: powerSyncCategoryMappings,
        schema: powerSyncCategoryMappingRowSchema,
        onDeserializationError: (error) => {
          throw new Error(
            `Invalid PowerSync Category Mapping row: ${JSON.stringify(error.issues)}`,
          );
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    envelopes: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-envelopes:${householdId}`,
        database,
        table: powerSyncEnvelopes,
        schema: powerSyncEnvelopeRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Envelope row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    fundingMemberships: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-funding-memberships:${householdId}`,
        database,
        table: powerSyncFundingMemberships,
        schema: powerSyncFundingMembershipRowSchema,
        onDeserializationError: (error) => {
          throw new Error(
            `Invalid PowerSync Funding Membership row: ${JSON.stringify(error.issues)}`,
          );
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    recurringOccurrences: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-recurring-occurrences:${householdId}`,
        database,
        table: powerSyncRecurringOccurrences,
        schema: powerSyncRecurringOccurrenceRowSchema,
        onDeserializationError: (error) => {
          throw new Error(
            `Invalid PowerSync Recurring Occurrence row: ${JSON.stringify(error.issues)}`,
          );
        },
        syncMode: "eager",
        onLoad: onRecurringLoad,
      }),
    ),
    recurringRules: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-recurring-rules:${householdId}`,
        database,
        table: powerSyncRecurringRules,
        schema: powerSyncRecurringRuleRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Recurring Rule row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onRecurringLoad,
      }),
    ),
    refundLinks: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-refund-links:${householdId}`,
        database,
        table: powerSyncRefundLinks,
        schema: powerSyncRefundLinkRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid PowerSync Refund Link row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    rolloverSettings: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-rollover-settings:${householdId}`,
        database,
        table: powerSyncRolloverSettings,
        schema: powerSyncRolloverSettingRowSchema,
        onDeserializationError: (error) => {
          throw new Error(
            `Invalid PowerSync Rollover Setting row: ${JSON.stringify(error.issues)}`,
          );
        },
        syncMode: "eager",
        onLoad: onBudgetLoad,
      }),
    ),
    rejectedChanges: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-rejected-changes:${householdId}`,
        database,
        table: rejectedChanges,
        schema: powerSyncRejectedChangeRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid rejected change row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
      }),
    ),
  };
};
