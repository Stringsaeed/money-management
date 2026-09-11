import type { PowerSyncDatabase } from "@powersync/react-native";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { createCollection, type CollectionStatus, type OperationConfig } from "@tanstack/react-db";

import { powerSyncSchema } from "@/modules/powersync/schema";
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
import { withLegacyPowerSyncLogger } from "@/modules/powersync/collection-compat";
import type { SyncedLedgerBinding } from "@/modules/ledger-data-source/provider";

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

type StreamLoader = (() => Promise<() => void>) | undefined;

const householdStreamLoader = (
  database: PowerSyncDatabase,
  stream: string,
  householdId: string | null,
): StreamLoader => {
  // A Personal Ledger arrives on the auto-subscribed personal_ledger stream.
  if (householdId === null) return undefined;
  return async () => {
    const subscription = await database
      .syncStream(stream, { household_id: householdId })
      .subscribe();
    await subscription.waitForFirstSync();
    return () => subscription.unsubscribe();
  };
};

const personalStreamLoader =
  (database: PowerSyncDatabase): StreamLoader =>
  async () => {
    await database.waitForFirstSync();
    return () => undefined;
  };

export const createPowerSyncLedgerCollections = (
  database: PowerSyncDatabase,
  ledger: SyncedLedgerBinding,
): PowerSyncLedgerCollections => {
  const collectionDatabase = withLegacyPowerSyncLogger(database);
  const tables = powerSyncSchema.props;
  const { ledgerId, householdId } = ledger;
  const onLedgerLoad =
    householdId === null
      ? personalStreamLoader(database)
      : householdStreamLoader(database, "household_ledger", householdId);
  const onBudgetLoad =
    householdId === null
      ? personalStreamLoader(database)
      : householdStreamLoader(database, "household_budget", householdId);
  const onRecurringLoad =
    householdId === null
      ? personalStreamLoader(database)
      : householdStreamLoader(database, "household_recurring", householdId);
  return {
    accounts: createCollection(
      powerSyncCollectionOptions({
        id: `powersync-accounts:${ledgerId}`,
        database: collectionDatabase,
        table: tables.accounts,
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
        id: `powersync-categories:${ledgerId}`,
        database: collectionDatabase,
        table: tables.categories,
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
        id: `powersync-transactions:${ledgerId}`,
        database: collectionDatabase,
        table: tables.transactions,
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
        id: `powersync-assignments:${ledgerId}`,
        database: collectionDatabase,
        table: tables.assignments,
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
        id: `powersync-budget-workspaces:${ledgerId}`,
        database: collectionDatabase,
        table: tables.budget_workspaces,
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
        id: `powersync-category-mappings:${ledgerId}`,
        database: collectionDatabase,
        table: tables.category_mappings,
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
        id: `powersync-envelopes:${ledgerId}`,
        database: collectionDatabase,
        table: tables.envelopes,
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
        id: `powersync-funding-memberships:${ledgerId}`,
        database: collectionDatabase,
        table: tables.funding_memberships,
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
        id: `powersync-recurring-occurrences:${ledgerId}`,
        database: collectionDatabase,
        table: tables.recurring_occurrences,
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
        id: `powersync-recurring-rules:${ledgerId}`,
        database: collectionDatabase,
        table: tables.recurring_rules,
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
        id: `powersync-refund-links:${ledgerId}`,
        database: collectionDatabase,
        table: tables.refund_links,
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
        id: `powersync-rollover-settings:${ledgerId}`,
        database: collectionDatabase,
        table: tables.rollover_settings,
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
        id: `powersync-rejected-changes:${ledgerId}`,
        database: collectionDatabase,
        table: tables.rejected_changes,
        schema: powerSyncRejectedChangeRowSchema,
        onDeserializationError: (error) => {
          throw new Error(`Invalid rejected change row: ${JSON.stringify(error.issues)}`);
        },
        syncMode: "eager",
      }),
    ),
  };
};
