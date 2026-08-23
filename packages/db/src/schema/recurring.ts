import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import * as auth from "./auth";
import { household } from "./household";

/**
 * Recurring Rules & Occurrences (#87), ported from the client's local tables
 * (`apps/mobile/db/schema.ts`) with household scoping per the multi-user
 * extension.
 *
 * - Occurrence identity `(rule_id, scheduled_date)` is a unique constraint —
 *   the multi-writer double-settlement guard (architecture doc invariant 13).
 * - Rule Revision is the optimistic-concurrency version column.
 * - Eligibility Floor is the only progress cursor: settlement applies a
 *   rule's pre-change state before a same-day pause/edit takes effect.
 */

export const recurringRule = sqliteTable(
  "recurring_rules",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: ["expense", "income", "transfer"] }).notNull(),
    /** Minor units; NULL while the rule awaits its first valid amount. */
    amountMinor: integer("amount_minor"),
    currency: text("currency").notNull(),
    /**
     * Plain ids: the referenced ledger tables use composite (household_id, id)
     * PKs, so single-column references would be FK mismatches. Same-household
     * validity is enforced at the repository layer (see #89 pattern).
     */
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
    /** The only progress cursor: occurrences settle on/after this date. */
    eligibilityFloor: text("eligibility_floor").notNull(),
    /** Optimistic-concurrency version column (Rule Revision pattern). */
    revision: integer("revision").notNull().default(1),
    lifecycleChangedAt: integer("lifecycle_changed_at", { mode: "timestamp_ms" }),
    healthChangedAt: integer("health_changed_at", { mode: "timestamp_ms" }),
    lastSettlementAttemptAt: integer("last_settlement_attempt_at", { mode: "timestamp_ms" }),
    lastSettlementError: text("last_settlement_error"),
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
    check(
      "recurring_rules_lifecycle_valid",
      sql`${table.lifecycle} IN ('active', 'paused', 'completed', 'archived')`,
    ),
    check("recurring_rules_health_valid", sql`${table.health} IN ('ready', 'needs_attention')`),
    index("recurring_rules_household_lifecycle_idx").on(table.householdId, table.lifecycle),
  ],
);

export const recurringOccurrence = sqliteTable(
  "recurring_occurrences",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(),
    scheduledDate: text("scheduled_date").notNull(),
    /**
     * Nullable plain id, deliberately WITHOUT a foreign key: the golden
     * behaviour deletes a generated Transaction while the Occurrence must
     * survive with a dangling reference (settlement counts occurrences, so
     * each still settles exactly once). A composite FK could not express
     * that without nulling household_id.
     */
    transactionId: text("transaction_id"),
    settledAt: integer("settled_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    // Occurrence identity — the double-settlement guard across writers.
    primaryKey({ columns: [table.householdId, table.ruleId, table.scheduledDate] }),
    uniqueIndex("uq_recurring_occurrence_transaction").on(table.transactionId),
    index("recurring_occurrences_rule_idx").on(table.householdId, table.ruleId),
    // Tenant-safe composite FKs: both parents use composite (household_id, id)
    // primary keys, so single-column references would be FK mismatches.
    foreignKey({
      columns: [table.householdId, table.ruleId],
      foreignColumns: [recurringRule.householdId, recurringRule.id],
    }).onDelete("cascade"),
    // NOTE: transaction_id intentionally carries NO FK. A composite parent
    // key would force ON DELETE SET NULL to null household_id too (NOT NULL),
    // and the golden behaviour requires an Occurrence to survive its
    // generated Transaction being deleted with a dangling reference.
  ],
);
