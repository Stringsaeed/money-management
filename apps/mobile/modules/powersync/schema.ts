import { column, Schema, Table } from "@powersync/react-native";

export const powerSyncAccounts = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    name: column.text,
    type: column.text,
    currency: column.text,
    color: column.text,
    icon: column.text,
    initial_balance_minor: column.integer,
    exclude_from_total: column.integer,
    sort_order: column.integer,
    lifecycle: column.text,
    lifecycle_changed_at: column.text,
    owner_user_id: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: { ledger: ["ledger_id"], ledger_lifecycle: ["ledger_id", "lifecycle"] },
    trackMetadata: true,
  },
);

export const powerSyncCategories = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    name: column.text,
    type: column.text,
    color: column.text,
    icon: column.text,
    parent_id: column.text,
    sort_order: column.integer,
    lifecycle: column.text,
    lifecycle_changed_at: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: { ledger: ["ledger_id"], ledger_lifecycle: ["ledger_id", "lifecycle"] },
    trackMetadata: true,
  },
);

export const powerSyncTransactions = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    type: column.text,
    amount_minor: column.integer,
    currency: column.text,
    original_amount_minor: column.integer,
    original_currency: column.text,
    exchange_rate: column.integer,
    date: column.text,
    account_id: column.text,
    to_account_id: column.text,
    category_id: column.text,
    is_recurring: column.integer,
    recurring_rule_id: column.text,
    description: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger: ["ledger_id"],
      ledger_account: ["ledger_id", "account_id"],
      ledger_date: ["ledger_id", "date"],
    },
    trackMetadata: true,
  },
);

export const powerSyncBudgetWorkspaces = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    currency: column.text,
    activation_period: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { ledger: ["ledger_id"], household: ["household_id"] }, trackMetadata: true },
);

export const powerSyncEnvelopes = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    currency: column.text,
    name: column.text,
    icon: column.text,
    color: column.text,
    lifecycle: column.text,
    sort_order: column.integer,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger: ["ledger_id"],
      ledger_currency: ["ledger_id", "currency"],
      household: ["household_id"],
      household_currency: ["household_id", "currency"],
    },
    trackMetadata: true,
  },
);

export const powerSyncCategoryMappings = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    category_id: column.text,
    envelope_id: column.text,
    effective_from_period: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger_category: ["ledger_id", "category_id"],
      household_category: ["household_id", "category_id"],
    },
    trackMetadata: true,
  },
);

export const powerSyncFundingMemberships = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    account_id: column.text,
    currency: column.text,
    active: column.integer,
    effective_from_period: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger_currency: ["ledger_id", "currency"],
      household_currency: ["household_id", "currency"],
    },
    trackMetadata: true,
  },
);

export const powerSyncRolloverSettings = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    envelope_id: column.text,
    positive_rollover: column.integer,
    effective_from_period: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger_envelope: ["ledger_id", "envelope_id"],
      household_envelope: ["household_id", "envelope_id"],
    },
    trackMetadata: true,
  },
);

export const powerSyncAssignments = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    currency: column.text,
    budget_period: column.text,
    source_envelope_id: column.text,
    destination_envelope_id: column.text,
    amount_minor: column.integer,
    reverses_assignment_id: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger_period: ["ledger_id", "budget_period"],
      household_period: ["household_id", "budget_period"],
    },
    trackMetadata: true,
  },
);

export const powerSyncRefundLinks = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    original_transaction_id: column.text,
    refund_transaction_id: column.text,
    currency: column.text,
    amount_minor: column.integer,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger_original: ["ledger_id", "original_transaction_id"],
      household_original: ["household_id", "original_transaction_id"],
    },
    trackMetadata: true,
  },
);

export const powerSyncRecurringRules = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    name: column.text,
    type: column.text,
    amount_minor: column.integer,
    currency: column.text,
    account_id: column.text,
    to_account_id: column.text,
    category_id: column.text,
    description: column.text,
    frequency: column.text,
    interval_count: column.integer,
    start_date: column.text,
    end_date: column.text,
    end_count: column.integer,
    time_zone: column.text,
    lifecycle: column.text,
    health: column.text,
    attention_reasons: column.text,
    attention_details: column.text,
    eligibility_floor: column.text,
    revision: column.integer,
    lifecycle_changed_at: column.text,
    health_changed_at: column.text,
    last_settlement_attempt_at: column.text,
    last_settlement_error: column.text,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      ledger: ["ledger_id"],
      ledger_lifecycle: ["ledger_id", "lifecycle"],
      household: ["household_id"],
      household_lifecycle: ["household_id", "lifecycle"],
    },
    trackMetadata: true,
  },
);

export const powerSyncRecurringOccurrences = new Table(
  {
    ledger_id: column.text,
    household_id: column.text,
    rule_id: column.text,
    scheduled_date: column.text,
    transaction_id: column.text,
    settled_at: column.text,
  },
  {
    indexes: {
      ledger_rule: ["ledger_id", "rule_id"],
      household_rule: ["household_id", "rule_id"],
    },
    trackMetadata: true,
  },
);

export const rejectedChanges = new Table(
  {
    command_id: column.text,
    ledger_id: column.text,
    kind: column.text,
    rejection_kind: column.text,
    rejection_payload: column.text,
    envelope: column.text,
    attempts: column.integer,
    created_at: column.text,
  },
  { localOnly: true },
);

export const powerSyncSchema = new Schema({
  accounts: powerSyncAccounts,
  assignments: powerSyncAssignments,
  budget_workspaces: powerSyncBudgetWorkspaces,
  categories: powerSyncCategories,
  category_mappings: powerSyncCategoryMappings,
  envelopes: powerSyncEnvelopes,
  funding_memberships: powerSyncFundingMemberships,
  recurring_occurrences: powerSyncRecurringOccurrences,
  recurring_rules: powerSyncRecurringRules,
  transactions: powerSyncTransactions,
  refund_links: powerSyncRefundLinks,
  rejected_changes: rejectedChanges,
  rollover_settings: powerSyncRolloverSettings,
});
