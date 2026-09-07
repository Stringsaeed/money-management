import { column, Schema, Table } from "@powersync/react-native";

export const powerSyncAccounts = new Table(
  {
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
    visibility: column.text,
    owner_user_id: column.text,
    version: column.integer,
    created_by: column.text,
    updated_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: { household: ["household_id"], household_lifecycle: ["household_id", "lifecycle"] },
    trackMetadata: true,
  },
);

export const powerSyncCategories = new Table(
  {
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
    indexes: { household: ["household_id"], household_lifecycle: ["household_id", "lifecycle"] },
    trackMetadata: true,
  },
);

export const powerSyncTransactions = new Table(
  {
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
      household: ["household_id"],
      household_account: ["household_id", "account_id"],
      household_date: ["household_id", "date"],
    },
    trackMetadata: true,
  },
);

export const rejectedChanges = new Table(
  {
    command_id: column.text,
    household_id: column.text,
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
  categories: powerSyncCategories,
  transactions: powerSyncTransactions,
  rejected_changes: rejectedChanges,
});
