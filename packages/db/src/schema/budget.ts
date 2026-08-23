import { relations, sql } from "drizzle-orm";
import {
  check,
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
 * Envelope budgeting domain, ported from the client's local budgeting schema
 * (apps/mobile/db/budgeting-schema.ts) with household scoping per the
 * multi-user extension:
 *
 * - every table carries `household_id`; entity PKs are composite
 *   `(household_id, id)`
 * - period-effective tables (`category_mappings`, `funding_memberships`,
 *   `rollover_settings`) are INSERT-only — `effective_to_period` is never
 *   stored, it derives from `LEAD(effective_from_period) OVER (...)`;
 *   SQLite triggers reject UPDATE/DELETE
 * - a tombstone row ends an earlier row: an unmapped Category Mapping has a
 *   NULL envelope target; a Funding Membership exit has `active = 0`
 */

/** Per-currency budget workspace: the tenancy root for one currency's budgeting. */
export const budgetWorkspace = sqliteTable(
  "budget_workspaces",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    /** ISO 4217 code; envelopes and pools are single-currency (ADR-0002). */
    currency: text("currency").notNull(),
    /** First Budget Period the workspace covers ("YYYY-MM"). */
    activationPeriod: text("activation_period").notNull(),
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
  (table) => [primaryKey({ columns: [table.householdId, table.currency] })],
);

export const envelope = sqliteTable(
  "envelopes",
  {
    id: text("id").notNull(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    color: text("color").notNull(),
    lifecycle: text("lifecycle", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Optimistic-concurrency version for mutable-envelope commands. */
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
    check("envelopes_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    // Workspace-scoped single-currency discipline (ADR-0002).
    index("envelopes_household_currency_idx").on(table.householdId, table.currency),
  ],
);

/**
 * Period-effective Category→Envelope attribution (ADR-0003/0006). INSERT-only;
 * the mapping's end derives from the next row for the same category. A row
 * with a NULL `envelope_id` is a tombstone: the category is unmapped from
 * that period on.
 *
 * The `categories` reference arrives with #86; until then linkage is
 * repository-layer enforced.
 */
export const categoryMapping = sqliteTable(
  "category_mappings",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    /** NULL = tombstone: the category is unmapped from this period onward. */
    envelopeId: text("envelope_id"),
    effectiveFromPeriod: text("effective_from_period").notNull(),
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
    primaryKey({
      columns: [table.householdId, table.categoryId, table.effectiveFromPeriod],
    }),
    index("category_mappings_household_category_idx").on(table.householdId, table.categoryId),
  ],
);

/**
 * Period-effective Funding Membership (ADR-0012). INSERT-only; a row with
 * `active = 0` is the tombstone ending the account's earlier membership.
 *
 * The `accounts` reference arrives with #86; until then linkage is
 * repository-layer enforced.
 */
export const fundingMembership = sqliteTable(
  "funding_memberships",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    currency: text("currency").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    effectiveFromPeriod: text("effective_from_period").notNull(),
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
    primaryKey({
      columns: [table.householdId, table.accountId, table.effectiveFromPeriod],
    }),
    index("funding_memberships_household_currency_idx").on(table.householdId, table.currency),
  ],
);

/** Period-effective Rollover setting per envelope (ADR-0016). INSERT-only. */
export const rolloverSetting = sqliteTable(
  "rollover_settings",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    envelopeId: text("envelope_id").notNull(),
    positiveRollover: integer("positive_rollover", { mode: "boolean" }).notNull().default(true),
    effectiveFromPeriod: text("effective_from_period").notNull(),
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
    primaryKey({
      columns: [table.householdId, table.envelopeId, table.effectiveFromPeriod],
    }),
    index("rollover_settings_household_envelope_idx").on(table.householdId, table.envelopeId),
  ],
);

/**
 * Append-only Assignment ledger (ADR-0007/0015): a correction records a
 * reversing row plus its replacement via `reverses_assignment_id` — never an
 * edit. Amounts are minor units within one currency's workspace.
 */
export const assignment = sqliteTable(
  "assignments",
  {
    id: text("id").notNull(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    budgetPeriod: text("budget_period").notNull(),
    sourceEnvelopeId: text("source_envelope_id"),
    destinationEnvelopeId: text("destination_envelope_id"),
    amountMinor: integer("amount_minor").notNull(),
    /** Set when this row reverses an earlier assignment (a correction). */
    reversesAssignmentId: text("reverses_assignment_id"),
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
    check("assignments_amount_positive", sql`${table.amountMinor} > 0`),
    check(
      "assignments_has_endpoint",
      sql`${table.sourceEnvelopeId} IS NOT NULL OR ${table.destinationEnvelopeId} IS NOT NULL`,
    ),
    check(
      "assignments_distinct_endpoints",
      sql`${table.sourceEnvelopeId} IS NULL OR ${table.destinationEnvelopeId} IS NULL OR ${table.sourceEnvelopeId} <> ${table.destinationEnvelopeId}`,
    ),
    index("assignments_household_period_idx").on(table.householdId, table.budgetPeriod),
  ],
);

/**
 * Refund linkage (ADR-0008): one expense may have multiple same-currency
 * partial refunds whose cumulative amount cannot exceed the original expense.
 * The cumulative cap itself is validated at write time by summing this table
 * (#91); each link stores its own amount.
 *
 * Transaction references arrive with #86 — until then they are plain ids
 * validated at the repository layer, so cross-household linkage is guarded by
 * command handlers scoping reads to the caller's household.
 */
export const refundLink = sqliteTable(
  "refund_links",
  {
    id: text("id").notNull(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    originalTransactionId: text("original_transaction_id").notNull(),
    /** Each refund links back exactly once. */
    refundTransactionId: text("refund_transaction_id").notNull(),
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor").notNull(),
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
    uniqueIndex("refund_links_refund_once").on(table.refundTransactionId),
    check("refund_links_amount_positive", sql`${table.amountMinor} > 0`),
    index("refund_links_original_idx").on(table.originalTransactionId),
  ],
);

/**
 * Derived-values cache (Invariant 1 / ADR-0017): exclusively computed from
 * facts, truncable with zero data loss, never written directly by a command.
 * `seqStamped` carries #84's household change watermark the payload was
 * computed from, so staleness is one comparison against sync.getDelta's head.
 *
 * Cache rows are system-computed derived state, not facts — user attribution
 * columns deliberately omitted.
 */
export const periodProjectionCache = sqliteTable(
  "period_projection_cache",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    budgetPeriod: text("budget_period").notNull(),
    projectionJson: text("projection_json", { mode: "json" }).$type<unknown>().notNull(),
    seqStamped: integer("seq_stamped").notNull(),
    computedAt: integer("computed_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.householdId, table.currency, table.budgetPeriod],
    }),
  ],
);

export const budgetWorkspaceRelations = relations(budgetWorkspace, ({ many }) => ({
  envelopes: many(envelope),
}));

export const envelopeRelations = relations(envelope, ({ one, many }) => ({
  workspace: one(budgetWorkspace, {
    fields: [envelope.householdId, envelope.currency],
    references: [budgetWorkspace.householdId, budgetWorkspace.currency],
  }),
  rolloverSettings: many(rolloverSetting),
}));

export const categoryMappingRelations = relations(categoryMapping, ({ one }) => ({
  envelope: one(envelope, {
    fields: [categoryMapping.householdId, categoryMapping.envelopeId],
    references: [envelope.householdId, envelope.id],
  }),
}));
