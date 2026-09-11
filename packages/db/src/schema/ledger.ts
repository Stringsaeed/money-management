import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import * as auth from "./auth";
import { household } from "./household";
import { ledger } from "./ledger-scope";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

const ACCOUNT_TYPES = ["cash", "bank", "card"] as const;
const ACCOUNT_VISIBILITIES = ["public", "private"] as const;
const CATEGORY_TYPES = ["income", "expense"] as const;
const TRANSACTION_TYPES = ["expense", "income", "transfer"] as const;

export const ledgerAccount = pgTable(
  "accounts",
  {
    /** Owning Ledger — personal or organization. The scope of record. */
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    /** Household backing an organization Ledger; null on personal rows. */
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ACCOUNT_TYPES }).notNull(),
    currency: text("currency").notNull().default("USD"),
    color: text("color").notNull().default("#4A90D9"),
    icon: text("icon").notNull().default("banknote.fill"),
    initialBalanceMinor: integer("initial_balance_minor").notNull().default(0),
    excludeFromTotal: boolean("exclude_from_total").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    lifecycleChangedAt: timestamptz("lifecycle_changed_at"),
    visibility: text("visibility", { enum: ACCOUNT_VISIBILITIES }).notNull().default("public"),
    ownerUserId: text("owner_user_id").references(() => auth.user.id),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => auth.user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => auth.user.id),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("accounts_household_id_id_unique").on(table.householdId, table.id),
    unique("accounts_ledger_id_id_unique").on(table.ledgerId, table.id),
    check("accounts_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    check("accounts_type_valid", sql`${table.type} IN ('cash', 'bank', 'card')`),
    check(
      "accounts_private_owner_required",
      sql`${table.visibility} = 'public' OR ${table.ownerUserId} IS NOT NULL`,
    ),
    check(
      "accounts_household_required_for_organization",
      sql`${table.householdId} IS NOT NULL OR ${table.ledgerId} LIKE 'personal:%'`,
    ),
    index("accounts_household_lifecycle_idx").on(table.householdId, table.lifecycle),
    index("accounts_ledger_lifecycle_idx").on(table.ledgerId, table.lifecycle),
    index("accounts_household_visibility_owner_idx").on(
      table.householdId,
      table.visibility,
      table.ownerUserId,
    ),
  ],
);

export const category = pgTable(
  "categories",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: CATEGORY_TYPES }).notNull(),
    color: text("color").notNull().default("#FF6B6B"),
    icon: text("icon").notNull().default("🏷️"),
    parentId: text("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    lifecycleChangedAt: timestamptz("lifecycle_changed_at"),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => auth.user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => auth.user.id),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("categories_household_id_id_unique").on(table.householdId, table.id),
    unique("categories_ledger_id_id_unique").on(table.ledgerId, table.id),
    check("categories_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    check("categories_type_valid", sql`${table.type} IN ('income', 'expense')`),
    check(
      "categories_household_required_for_organization",
      sql`${table.householdId} IS NOT NULL OR ${table.ledgerId} LIKE 'personal:%'`,
    ),
    index("categories_household_lifecycle_idx").on(table.householdId, table.lifecycle),
    index("categories_ledger_lifecycle_idx").on(table.ledgerId, table.lifecycle),
  ],
);

export const transaction = pgTable(
  "transactions",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    originalAmountMinor: integer("original_amount_minor"),
    originalCurrency: text("original_currency"),
    exchangeRate: integer("exchange_rate"),
    date: text("date").notNull(),
    accountId: text("account_id").notNull(),
    toAccountId: text("to_account_id"),
    categoryId: text("category_id"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurringRuleId: text("recurring_rule_id"),
    description: text("description").notNull().default(""),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => auth.user.id),
    updatedBy: text("updated_by")
      .notNull()
      .references(() => auth.user.id),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check("transactions_type_valid", sql`${table.type} IN ('expense', 'income', 'transfer')`),
    check("transactions_amount_positive", sql`${table.amountMinor} > 0`),
    check("transactions_date_shape", sql`${table.date} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`),
    check(
      "transactions_transfer_shape",
      sql`(${table.type} = 'transfer' AND ${table.toAccountId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.accountId} <> ${table.toAccountId})
        OR (${table.type} <> 'transfer' AND ${table.toAccountId} IS NULL)`,
    ),
    check(
      "transactions_household_required_for_organization",
      sql`${table.householdId} IS NOT NULL OR ${table.ledgerId} LIKE 'personal:%'`,
    ),
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
    // Ledger-keyed twins of the Household foreign keys above. They are the
    // ones that hold on personal rows (a null household_id satisfies any
    // composite key), so no Transaction can point across Ledger Scopes.
    foreignKey({
      columns: [table.ledgerId, table.accountId],
      foreignColumns: [ledgerAccount.ledgerId, ledgerAccount.id],
    }),
    foreignKey({
      columns: [table.ledgerId, table.toAccountId],
      foreignColumns: [ledgerAccount.ledgerId, ledgerAccount.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.ledgerId, table.categoryId],
      foreignColumns: [category.ledgerId, category.id],
    }).onDelete("set null"),
    index("transactions_household_date_idx").on(table.householdId, table.date),
    index("transactions_household_account_idx").on(table.householdId, table.accountId),
    index("transactions_ledger_date_idx").on(table.ledgerId, table.date),
    index("transactions_ledger_account_idx").on(table.ledgerId, table.accountId),
  ],
);

export const ledgerAccountRelations = relations(ledgerAccount, ({ many, one }) => ({
  ledger: one(ledger, { fields: [ledgerAccount.ledgerId], references: [ledger.id] }),
  transactions: many(transaction),
}));

export const categoryRelations = relations(category, ({ many, one }) => ({
  ledger: one(ledger, { fields: [category.ledgerId], references: [ledger.id] }),
  transactions: many(transaction),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  ledger: one(ledger, {
    fields: [transaction.ledgerId],
    references: [ledger.id],
  }),
  household: one(household, {
    fields: [transaction.householdId],
    references: [household.id],
  }),
  account: one(ledgerAccount, {
    fields: [transaction.ledgerId, transaction.accountId],
    references: [ledgerAccount.ledgerId, ledgerAccount.id],
  }),
  toAccount: one(ledgerAccount, {
    fields: [transaction.ledgerId, transaction.toAccountId],
    references: [ledgerAccount.ledgerId, ledgerAccount.id],
  }),
  category: one(category, {
    fields: [transaction.ledgerId, transaction.categoryId],
    references: [category.ledgerId, category.id],
  }),
}));
