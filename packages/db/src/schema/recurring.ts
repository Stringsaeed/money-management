import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import * as auth from "./auth";
import { household } from "./household";
import { ledger } from "./ledger-scope";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const recurringRule = pgTable(
  "recurring_rules",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["expense", "income", "transfer"] }).notNull(),
    amountMinor: integer("amount_minor"),
    currency: text("currency").notNull(),
    accountId: text("account_id"),
    toAccountId: text("to_account_id"),
    categoryId: text("category_id"),
    description: text("description").notNull().default(""),
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
    attentionReasons: text("attention_reasons").notNull().default("[]"),
    attentionDetails: text("attention_details"),
    eligibilityFloor: text("eligibility_floor").notNull(),
    revision: integer("revision").notNull().default(1),
    lifecycleChangedAt: timestamptz("lifecycle_changed_at"),
    healthChangedAt: timestamptz("health_changed_at"),
    lastSettlementAttemptAt: timestamptz("last_settlement_attempt_at"),
    lastSettlementError: text("last_settlement_error"),
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
    uniqueIndex("recurring_rules_household_id_unique").on(table.householdId, table.id),
    unique("recurring_rules_ledger_id_id_unique").on(table.ledgerId, table.id),
    check(
      "recurring_rules_lifecycle_valid",
      sql`${table.lifecycle} IN ('active', 'paused', 'completed', 'archived')`,
    ),
    check("recurring_rules_health_valid", sql`${table.health} IN ('ready', 'needs_attention')`),
    check(
      "recurring_rules_household_required_for_organization",
      sql`${table.householdId} IS NOT NULL OR ${table.ledgerId} LIKE 'personal:%'`,
    ),
    index("recurring_rules_household_lifecycle_idx").on(table.householdId, table.lifecycle),
    index("recurring_rules_ledger_lifecycle_idx").on(table.ledgerId, table.lifecycle),
  ],
);

export const recurringOccurrence = pgTable(
  "recurring_occurrences",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    scheduledDate: text("scheduled_date").notNull(),
    transactionId: text("transaction_id"),
    settledAt: timestamptz("settled_at").notNull(),
  },
  (table) => [
    uniqueIndex("recurring_occurrences_household_rule_date_unique").on(
      table.householdId,
      table.ruleId,
      table.scheduledDate,
    ),
    uniqueIndex("recurring_occurrences_ledger_rule_date_unique").on(
      table.ledgerId,
      table.ruleId,
      table.scheduledDate,
    ),
    uniqueIndex("uq_recurring_occurrence_transaction").on(table.transactionId),
    check(
      "recurring_occurrences_household_required_for_organization",
      sql`${table.householdId} IS NOT NULL OR ${table.ledgerId} LIKE 'personal:%'`,
    ),
    index("recurring_occurrences_rule_idx").on(table.householdId, table.ruleId),
    index("recurring_occurrences_ledger_rule_idx").on(table.ledgerId, table.ruleId),
    foreignKey({
      columns: [table.householdId, table.ruleId],
      foreignColumns: [recurringRule.householdId, recurringRule.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.ledgerId, table.ruleId],
      foreignColumns: [recurringRule.ledgerId, recurringRule.id],
    }).onDelete("cascade"),
  ],
);
