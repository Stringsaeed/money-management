import { sql, type SQLWrapper } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { v2Ledger } from "./v2-identity";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const moneyMinor = (name: string) => bigint(name, { mode: "number" });

const MONEY_MIN = -9007199254740991;
const MONEY_MAX = 9007199254740991;

const moneyRange = (column: SQLWrapper) => sql`${column} BETWEEN ${MONEY_MIN} AND ${MONEY_MAX}`;

export { v2Ledger } from "./v2-identity";

export const v2Account = pgTable(
  "v2_accounts",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["checking", "savings", "cash", "credit_card", "investment", "other"],
    }).notNull(),
    currency: text("currency").notNull(),
    openingBalanceMinor: moneyMinor("opening_balance_minor").notNull().default(0),
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_accounts_ledger_id_id_unique").on(table.ledgerId, table.id),
    index("v2_accounts_ledger_lifecycle_idx").on(table.ledgerId, table.lifecycle),
    check(
      "v2_accounts_type_valid",
      sql`${table.type} IN ('checking', 'savings', 'cash', 'credit_card', 'investment', 'other')`,
    ),
    check("v2_accounts_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    check("v2_accounts_currency_valid", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("v2_accounts_opening_balance_safe", moneyRange(table.openingBalanceMinor)),
  ],
);

export const v2Category = pgTable(
  "v2_categories",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["income", "expense"] }).notNull(),
    color: text("color").notNull().default("#4A8F69"),
    icon: text("icon").notNull().default("tag"),
    parentId: text("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_categories_ledger_id_id_unique").on(table.ledgerId, table.id),
    index("v2_categories_ledger_lifecycle_idx").on(table.ledgerId, table.lifecycle),
    check("v2_categories_kind_valid", sql`${table.kind} IN ('income', 'expense')`),
    check("v2_categories_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
  ],
);

export const v2Transaction = pgTable(
  "v2_transactions",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["income", "expense", "transfer"] }).notNull(),
    amountMinor: moneyMinor("amount_minor").notNull(),
    currency: text("currency").notNull(),
    date: text("date").notNull(),
    accountId: text("account_id").notNull(),
    toAccountId: text("to_account_id"),
    categoryId: text("category_id"),
    recurringRuleId: text("recurring_rule_id"),
    note: text("note").notNull().default(""),
    version: integer("version").notNull().default(0),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_transactions_ledger_id_id_unique").on(table.ledgerId, table.id),
    index("v2_transactions_ledger_date_id_idx").on(table.ledgerId, table.date, table.id),
    index("v2_transactions_ledger_account_date_idx").on(
      table.ledgerId,
      table.accountId,
      table.date,
    ),
    index("v2_transactions_ledger_category_date_idx").on(
      table.ledgerId,
      table.categoryId,
      table.date,
    ),
    check("v2_transactions_kind_valid", sql`${table.kind} IN ('income', 'expense', 'transfer')`),
    check("v2_transactions_amount_positive", sql`${table.amountMinor} > 0`),
    check("v2_transactions_amount_safe", moneyRange(table.amountMinor)),
    check("v2_transactions_currency_valid", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("v2_transactions_date_valid", sql`${table.date} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`),
    check(
      "v2_transactions_transfer_shape",
      sql`(${table.kind} = 'transfer' AND ${table.toAccountId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.accountId} <> ${table.toAccountId})
        OR (${table.kind} <> 'transfer' AND ${table.toAccountId} IS NULL)`,
    ),
    foreignKey({
      columns: [table.ledgerId, table.accountId],
      foreignColumns: [v2Account.ledgerId, v2Account.id],
    }),
    foreignKey({
      columns: [table.ledgerId, table.toAccountId],
      foreignColumns: [v2Account.ledgerId, v2Account.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.ledgerId, table.categoryId],
      foreignColumns: [v2Category.ledgerId, v2Category.id],
    }).onDelete("set null"),
  ],
);

export const v2RecurringRule = pgTable(
  "v2_recurring_rules",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["income", "expense", "transfer"] }).notNull(),
    amountMinor: moneyMinor("amount_minor").notNull(),
    currency: text("currency").notNull(),
    accountId: text("account_id").notNull(),
    toAccountId: text("to_account_id"),
    categoryId: text("category_id"),
    note: text("note").notNull().default(""),
    frequency: text("frequency", { enum: ["day", "week", "month", "year"] }).notNull(),
    intervalCount: integer("interval_count").notNull().default(1),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    endCount: integer("end_count"),
    timeZone: text("time_zone").notNull(),
    lifecycle: text("lifecycle", { enum: ["active", "paused", "completed", "archived"] })
      .notNull()
      .default("active"),
    health: text("health", { enum: ["ready", "needs_attention"] })
      .notNull()
      .default("ready"),
    attentionReasons: jsonb("attention_reasons")
      .$type<readonly Record<string, string | number | null>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    eligibilityFloor: text("eligibility_floor").notNull(),
    revision: integer("revision").notNull().default(1),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_recurring_rules_ledger_id_id_unique").on(table.ledgerId, table.id),
    index("v2_recurring_rules_ledger_lifecycle_idx").on(table.ledgerId, table.lifecycle),
    check("v2_recurring_rules_kind_valid", sql`${table.kind} IN ('income', 'expense', 'transfer')`),
    check("v2_recurring_rules_amount_positive", sql`${table.amountMinor} > 0`),
    check("v2_recurring_rules_amount_safe", moneyRange(table.amountMinor)),
    check("v2_recurring_rules_currency_valid", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check(
      "v2_recurring_rules_frequency_valid",
      sql`${table.frequency} IN ('day', 'week', 'month', 'year')`,
    ),
    check("v2_recurring_rules_interval_positive", sql`${table.intervalCount} > 0`),
    check(
      "v2_recurring_rules_start_date_valid",
      sql`${table.startDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
    ),
    check(
      "v2_recurring_rules_eligibility_date_valid",
      sql`${table.eligibilityFloor} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
    ),
    check(
      "v2_recurring_rules_lifecycle_valid",
      sql`${table.lifecycle} IN ('active', 'paused', 'completed', 'archived')`,
    ),
    check("v2_recurring_rules_health_valid", sql`${table.health} IN ('ready', 'needs_attention')`),
    check(
      "v2_recurring_rules_transfer_shape",
      sql`(${table.kind} = 'transfer' AND ${table.toAccountId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.accountId} <> ${table.toAccountId})
        OR (${table.kind} <> 'transfer' AND ${table.toAccountId} IS NULL)`,
    ),
    foreignKey({
      columns: [table.ledgerId, table.accountId],
      foreignColumns: [v2Account.ledgerId, v2Account.id],
    }),
    foreignKey({
      columns: [table.ledgerId, table.toAccountId],
      foreignColumns: [v2Account.ledgerId, v2Account.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.ledgerId, table.categoryId],
      foreignColumns: [v2Category.ledgerId, v2Category.id],
    }).onDelete("set null"),
  ],
);

export const v2RecurringOccurrence = pgTable(
  "v2_recurring_occurrences",
  {
    id: text("id").primaryKey(),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    scheduledDate: text("scheduled_date").notNull(),
    transactionId: text("transaction_id"),
    settledAt: timestamptz("settled_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("v2_recurring_occurrences_ledger_rule_date_unique").on(
      table.ledgerId,
      table.ruleId,
      table.scheduledDate,
    ),
    uniqueIndex("v2_recurring_occurrences_transaction_unique").on(table.transactionId),
    index("v2_recurring_occurrences_ledger_rule_idx").on(table.ledgerId, table.ruleId),
    check(
      "v2_recurring_occurrences_date_valid",
      sql`${table.scheduledDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
    ),
    foreignKey({
      columns: [table.ledgerId, table.ruleId],
      foreignColumns: [v2RecurringRule.ledgerId, v2RecurringRule.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.ledgerId, table.transactionId],
      foreignColumns: [v2Transaction.ledgerId, v2Transaction.id],
    }).onDelete("cascade"),
  ],
);

/** Per-ledger replay store for direct REST mutations. It replaces old command_results. */
export const v2IdempotencyKey = pgTable(
  "v2_idempotency_keys",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    operation: text("operation").notNull(),
    statusCode: integer("status_code").notNull(),
    responseJson: jsonb("response_json").$type<unknown>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ledgerId, table.key] }),
    index("v2_idempotency_keys_created_idx").on(table.createdAt),
  ],
);
