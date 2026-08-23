import { relations, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import * as auth from "./auth";
import { household } from "./household";

/**
 * Household ledger domain (ADR-0023 local-first → server-authoritative),
 * ported from the client's `apps/mobile/db/schema.ts` with multi-user
 * scoping: every table carries the composite `(household_id, id)` primary
 * key plus `version` and `created_by`/`updated_by` attribution.
 *
 * Tenancy note (D1): there is no row-level security and no DB-level
 * backstop — every read must filter by the session's household id and run
 * behind a membership check (`requireHouseholdMember`); commands are scoped
 * by construction because all writes carry `household_id` from the envelope.
 */

const ACCOUNT_TYPES = ["cash", "bank", "card"] as const;
const CATEGORY_TYPES = ["income", "expense"] as const;
const TRANSACTION_TYPES = ["expense", "income", "transfer"] as const;

export const ledgerAccount = sqliteTable(
  "accounts",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    /** Cash Account, bank, or card (see CONTEXT.md vocabulary). */
    type: text("type", { enum: ACCOUNT_TYPES }).notNull(),
    currency: text("currency").notNull().default("USD"),
    color: text("color").notNull().default("#4A90D9"),
    icon: text("icon").notNull().default("banknote.fill"),
    /** Opening balance in minor units; sign carries direction. */
    initialBalanceMinor: integer("initial_balance_minor").notNull().default(0),
    excludeFromTotal: integer("exclude_from_total", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    /** ADR-0009: accounts carrying financial history archive, never delete. */
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    lifecycleChangedAt: integer("lifecycle_changed_at", { mode: "timestamp_ms" }),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => auth.user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => auth.user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.id] }),
    check("accounts_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    check("accounts_type_valid", sql`${table.type} IN ('cash', 'bank', 'card')`),
    index("accounts_household_lifecycle_idx").on(table.householdId, table.lifecycle),
  ],
);

export const category = sqliteTable(
  "categories",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: CATEGORY_TYPES }).notNull(),
    color: text("color").notNull().default("#FF6B6B"),
    icon: text("icon").notNull().default("🏷️"),
    /**
     * Parent category within the same household; NULL for top-level
     * categories. A composite self-FK trips drizzle's circular inference, so
     * the same-household rule is enforced at the repository layer.
     */
    parentId: text("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    /** ADR-0009: categories referenced by history archive, never delete. */
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    lifecycleChangedAt: integer("lifecycle_changed_at", { mode: "timestamp_ms" }),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => auth.user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => auth.user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.id] }),
    check("categories_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    check("categories_type_valid", sql`${table.type} IN ('income', 'expense')`),
    index("categories_household_lifecycle_idx").on(table.householdId, table.lifecycle),
  ],
);

export const transaction = sqliteTable(
  "transactions",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    /** Minor units in the account's currency; always positive. */
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    /** Foreign-currency snapshot when the entry was made abroad. */
    originalAmountMinor: integer("original_amount_minor"),
    originalCurrency: text("original_currency"),
    /** Rate scaled by 1_000_000, mirroring the client. */
    exchangeRate: integer("exchange_rate"),
    /** ADR-0021: ledger date ("YYYY-MM-DD") anchors Budget Period attribution. */
    date: text("date").notNull(),
    accountId: text("account_id").notNull(),
    toAccountId: text("to_account_id"),
    categoryId: text("category_id"),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    /** Recurring rules land with #88/#92; plain id until their server table exists. */
    recurringRuleId: text("recurring_rule_id"),
    description: text("description").notNull().default(""),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => auth.user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => auth.user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.householdId, table.id] }),
    check("transactions_type_valid", sql`${table.type} IN ('expense', 'income', 'transfer')`),
    check("transactions_amount_positive", sql`${table.amountMinor} > 0`),
    check(
      "transactions_date_shape",
      sql`${table.date} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    // Transfers move between two accounts and carry no category; directed
    // entries have exactly one account side.
    check(
      "transactions_transfer_shape",
      sql`(${table.type} = 'transfer' AND ${table.toAccountId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.accountId} <> ${table.toAccountId})
        OR (${table.type} <> 'transfer' AND ${table.toAccountId} IS NULL)`,
    ),
    // Tenant-safe references: accounts/categories must live in the same household.
    foreignKey({
      columns: [table.householdId, table.accountId],
      foreignColumns: [ledgerAccount.householdId, ledgerAccount.id],
    }),
    foreignKey({
      columns: [table.householdId, table.toAccountId],
      foreignColumns: [ledgerAccount.householdId, ledgerAccount.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.householdId, table.categoryId],
      foreignColumns: [category.householdId, category.id],
    }).onDelete("set null"),
    index("transactions_household_date_idx").on(table.householdId, table.date),
    index("transactions_household_account_idx").on(table.householdId, table.accountId),
  ],
);

export const ledgerAccountRelations = relations(ledgerAccount, ({ many }) => ({
  transactions: many(transaction),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  transactions: many(transaction),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  household: one(household, {
    fields: [transaction.householdId],
    references: [household.id],
  }),
  account: one(ledgerAccount, {
    fields: [transaction.householdId, transaction.accountId],
    references: [ledgerAccount.householdId, ledgerAccount.id],
  }),
  toAccount: one(ledgerAccount, {
    fields: [transaction.householdId, transaction.toAccountId],
    references: [ledgerAccount.householdId, ledgerAccount.id],
  }),
  category: one(category, {
    fields: [transaction.householdId, transaction.categoryId],
    references: [category.householdId, category.id],
  }),
}));
