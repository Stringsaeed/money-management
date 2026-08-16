import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ── Accounts ──────────────────────────────────────────────────────────────────

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // AccountType
  currency: text("currency").notNull().default("USD"),
  color: text("color").notNull().default("#4A90D9"),
  icon: text("icon").notNull().default("banknote.fill"),
  initialBalance: integer("initial_balance").notNull().default(0), // cents
  excludeFromTotal: integer("exclude_from_total", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Categories ─────────────────────────────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "income" | "expense"
  color: text("color").notNull().default("#FF6B6B"),
  icon: text("icon").notNull().default("🏷️"),
  parentId: text("parent_id"), // self-reference, no FK to avoid circular
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Recurring Payments ────────────────────────────────────────────────────────

export const recurringPayments = sqliteTable("recurring_payments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // TransactionType
  amount: integer("amount").notNull(), // cents
  currency: text("currency").notNull().default("USD"),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  toAccountId: text("to_account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull().default(""),
  frequency: text("frequency").notNull(), // RecurrenceFrequency: day | week | month | year
  intervalCount: integer("interval_count").notNull().default(1), // every N units
  dayOfMonth: integer("day_of_month"),
  dayOfWeek: integer("day_of_week"),
  monthOfYear: integer("month_of_year"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  endCount: integer("end_count"), // stop after N occurrences (after_count end type)
  lastGeneratedDate: text("last_generated_date"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Recurring Rules ──────────────────────────────────────────────────────────

export const recurringRules = sqliteTable("recurring_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amountMinor: integer("amount_minor"),
  currency: text("currency").notNull(),
  accountId: text("account_id").references(() => accounts.id, { onDelete: "restrict" }),
  toAccountId: text("to_account_id").references(() => accounts.id, {
    onDelete: "restrict",
  }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull().default(""),
  frequency: text("frequency").notNull(),
  intervalCount: integer("interval_count").notNull().default(1),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  endCount: integer("end_count"),
  timeZone: text("time_zone").notNull(),
  lifecycle: text("lifecycle").notNull().default("active"),
  health: text("health").notNull().default("ready"),
  attentionReasons: text("attention_reasons").notNull().default("[]"),
  attentionDetails: text("attention_details"),
  eligibilityFloor: text("eligibility_floor").notNull(),
  revision: integer("revision").notNull().default(1),
  lifecycleChangedAt: text("lifecycle_changed_at"),
  healthChangedAt: text("health_changed_at"),
  lastSettlementAttemptAt: text("last_settlement_attempt_at"),
  lastSettlementError: text("last_settlement_error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Transactions ───────────────────────────────────────────────────────────────

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // TransactionType
  amount: integer("amount").notNull(), // cents in account's currency, always positive
  currency: text("currency").notNull(), // account's currency at time of entry
  originalAmount: integer("original_amount"), // cents in foreign currency
  originalCurrency: text("original_currency"),
  exchangeRate: integer("exchange_rate"), // rate * 1_000_000
  date: text("date").notNull(), // "YYYY-MM-DD"
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  toAccountId: text("to_account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  recurringPaymentId: text("recurring_payment_id").references(() => recurringPayments.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const recurringOccurrences = sqliteTable(
  "recurring_occurrences",
  {
    ruleId: text("rule_id")
      .notNull()
      .references(() => recurringRules.id, { onDelete: "restrict" }),
    scheduledDate: text("scheduled_date").notNull(),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    settledAt: text("settled_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ruleId, table.scheduledDate] }),
    uniqueIndex("uq_recurring_occurrence_transaction").on(table.transactionId),
  ],
);

// ── Exchange Rates ─────────────────────────────────────────────────────────────

export const exchangeRates = sqliteTable(
  "exchange_rates",
  {
    id: text("id").primaryKey(), // "{fromCurrency}_{toCurrency}"
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    rate: integer("rate").notNull(), // rate * 1_000_000
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("uq_exchange_rate").on(table.fromCurrency, table.toCurrency)],
);

// ── App Settings ───────────────────────────────────────────────────────────────
// Simple key-value store for app preferences

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
