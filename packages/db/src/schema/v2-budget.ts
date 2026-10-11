import { sql, type SQLWrapper } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { v2Ledger } from "./v2-identity";
import { v2Account, v2Category } from "./v2-ledger";

/**
 * Budgeting v1 storage (#365). These rows are the system of record for the
 * plan; every total (planned, spent, left, Not planned yet, Safe to spend) is
 * derived on read by `@trove/domain/budget` `projectBudget`. Assignments and
 * payday history are insert-only.
 */

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const moneyMinor = (name: string) => bigint(name, { mode: "number" });

const positiveMoney = (column: SQLWrapper) => sql`${column} BETWEEN 1 AND 9007199254740991`;
const ledgerDate = (column: SQLWrapper) => sql`${column} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`;

/** One budget per ledger. */
export const v2Budget = pgTable(
  "v2_budgets",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    currency: text("currency").notNull(),
    activationPeriodStart: text("activation_period_start").notNull(),
    usualSalaryMinor: moneyMinor("usual_salary_minor"),
    paydayReminder: boolean("payday_reminder").notNull().default(true),
    defaultAccountId: text("default_account_id"),
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
    uniqueIndex("v2_budgets_ledger_unique").on(table.ledgerId),
    uniqueIndex("v2_budgets_ledger_id_id_unique").on(table.ledgerId, table.id),
    check("v2_budgets_currency_valid", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("v2_budgets_activation_start_valid", ledgerDate(table.activationPeriodStart)),
    check(
      "v2_budgets_usual_salary_positive",
      sql`${table.usualSalaryMinor} IS NULL OR ${positiveMoney(table.usualSalaryMinor)}`,
    ),
    // The migration uses `ON DELETE SET NULL ("default_account_id")` so deleting
    // the Account clears only this column and keeps `ledger_id`.
    foreignKey({
      name: "v2_budgets_default_account_fk",
      columns: [table.ledgerId, table.defaultAccountId],
      foreignColumns: [v2Account.ledgerId, v2Account.id],
    }).onDelete("set null"),
  ],
);

/** Insert-only payday history: `rule` applies from the period starting `effective_from`. */
export const v2BudgetPayday = pgTable(
  "v2_budget_paydays",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    budgetId: text("budget_id").notNull(),
    effectiveFrom: text("effective_from").notNull(),
    kind: text("kind", { enum: ["day", "last_workday"] }).notNull(),
    day: integer("day"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.budgetId, table.effectiveFrom] }),
    check("v2_budget_paydays_effective_from_valid", ledgerDate(table.effectiveFrom)),
    check(
      "v2_budget_paydays_rule_valid",
      sql`(${table.kind} = 'day' AND ${table.day} BETWEEN 1 AND 28)
        OR (${table.kind} = 'last_workday' AND ${table.day} IS NULL)`,
    ),
    foreignKey({
      name: "v2_budget_paydays_budget_fk",
      columns: [table.ledgerId, table.budgetId],
      foreignColumns: [v2Budget.ledgerId, v2Budget.id],
    }).onDelete("cascade"),
  ],
);

/** Accounts whose balances make up the money the budget plans with. */
export const v2BudgetFundingAccount = pgTable(
  "v2_budget_funding_accounts",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    budgetId: text("budget_id").notNull(),
    accountId: text("account_id").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.budgetId, table.accountId] }),
    foreignKey({
      name: "v2_budget_funding_accounts_budget_fk",
      columns: [table.ledgerId, table.budgetId],
      foreignColumns: [v2Budget.ledgerId, v2Budget.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "v2_budget_funding_accounts_account_fk",
      columns: [table.ledgerId, table.accountId],
      foreignColumns: [v2Account.ledgerId, v2Account.id],
    }).onDelete("cascade"),
  ],
);

export const v2Envelope = pgTable(
  "v2_envelopes",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    budgetId: text("budget_id").notNull(),
    name: text("name").notNull(),
    group: text("group", { enum: ["bills", "everyday", "saving"] }).notNull(),
    startFresh: boolean("start_fresh").notNull().default(false),
    targetMinor: moneyMinor("target_minor"),
    dueDate: text("due_date"),
    repeat: text("repeat", { enum: ["once", "every_3_months", "every_6_months", "yearly"] }),
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
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
    uniqueIndex("v2_envelopes_ledger_id_id_unique").on(table.ledgerId, table.id),
    index("v2_envelopes_budget_lifecycle_idx").on(table.budgetId, table.lifecycle),
    check("v2_envelopes_group_valid", sql`${table.group} IN ('bills', 'everyday', 'saving')`),
    check("v2_envelopes_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    check(
      "v2_envelopes_target_positive",
      sql`${table.targetMinor} IS NULL OR ${positiveMoney(table.targetMinor)}`,
    ),
    check(
      "v2_envelopes_due_date_valid",
      sql`${table.dueDate} IS NULL OR ${ledgerDate(table.dueDate)}`,
    ),
    check(
      "v2_envelopes_repeat_valid",
      sql`${table.repeat} IS NULL OR ${table.repeat} IN ('once', 'every_3_months', 'every_6_months', 'yearly')`,
    ),
    foreignKey({
      name: "v2_envelopes_budget_fk",
      columns: [table.ledgerId, table.budgetId],
      foreignColumns: [v2Budget.ledgerId, v2Budget.id],
    }).onDelete("cascade"),
  ],
);

/** A Category maps to at most one Envelope per ledger. */
export const v2EnvelopeCategory = pgTable(
  "v2_envelope_categories",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    envelopeId: text("envelope_id").notNull(),
    categoryId: text("category_id").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.envelopeId, table.categoryId] }),
    uniqueIndex("v2_envelope_categories_ledger_category_unique").on(
      table.ledgerId,
      table.categoryId,
    ),
    foreignKey({
      name: "v2_envelope_categories_envelope_fk",
      columns: [table.ledgerId, table.envelopeId],
      foreignColumns: [v2Envelope.ledgerId, v2Envelope.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "v2_envelope_categories_category_fk",
      columns: [table.ledgerId, table.categoryId],
      foreignColumns: [v2Category.ledgerId, v2Category.id],
    }).onDelete("cascade"),
  ],
);

/** Append-only money moves. A null side is Not planned yet (Unassigned Money). */
export const v2Assignment = pgTable(
  "v2_assignments",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => v2Ledger.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    budgetId: text("budget_id").notNull(),
    periodStart: text("period_start").notNull(),
    fromEnvelopeId: text("from_envelope_id"),
    toEnvelopeId: text("to_envelope_id"),
    amountMinor: moneyMinor("amount_minor").notNull(),
    reason: text("reason", { enum: ["plan", "cover", "move", "leftover", "repeat"] }).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("v2_assignments_budget_period_idx").on(table.budgetId, table.periodStart),
    check("v2_assignments_period_start_valid", ledgerDate(table.periodStart)),
    check("v2_assignments_amount_positive", positiveMoney(table.amountMinor)),
    check(
      "v2_assignments_reason_valid",
      sql`${table.reason} IN ('plan', 'cover', 'move', 'leftover', 'repeat')`,
    ),
    check(
      "v2_assignments_sides_valid",
      sql`(${table.fromEnvelopeId} IS NOT NULL OR ${table.toEnvelopeId} IS NOT NULL)
        AND ${table.fromEnvelopeId} IS DISTINCT FROM ${table.toEnvelopeId}`,
    ),
    foreignKey({
      name: "v2_assignments_budget_fk",
      columns: [table.ledgerId, table.budgetId],
      foreignColumns: [v2Budget.ledgerId, v2Budget.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "v2_assignments_from_envelope_fk",
      columns: [table.ledgerId, table.fromEnvelopeId],
      foreignColumns: [v2Envelope.ledgerId, v2Envelope.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "v2_assignments_to_envelope_fk",
      columns: [table.ledgerId, table.toEnvelopeId],
      foreignColumns: [v2Envelope.ledgerId, v2Envelope.id],
    }).onDelete("cascade"),
  ],
);
