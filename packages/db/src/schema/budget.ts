import { relations, sql, type AnyColumn } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import * as auth from "./auth";
import { household } from "./household";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

const validPeriod = (name: string, column: AnyColumn) =>
  check(`${name}_period_format`, sql`${column} ~ '^[0-9]{4}-[0-9]{2}$'`);

export const budgetWorkspace = pgTable(
  "budget_workspaces",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    activationPeriod: text("activation_period").notNull(),
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
    uniqueIndex("budget_workspaces_household_currency_unique").on(
      table.householdId,
      table.currency,
    ),
    validPeriod("budget_workspaces_activation", table.activationPeriod),
  ],
);

export const envelope = pgTable(
  "envelopes",
  {
    id: text("id").primaryKey(),
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
    uniqueIndex("envelopes_household_id_unique").on(table.householdId, table.id),
    check("envelopes_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    index("envelopes_household_currency_idx").on(table.householdId, table.currency),
  ],
);

export const categoryMapping = pgTable(
  "category_mappings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    envelopeId: text("envelope_id"),
    effectiveFromPeriod: text("effective_from_period").notNull(),
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
    uniqueIndex("category_mappings_household_category_period_unique").on(
      table.householdId,
      table.categoryId,
      table.effectiveFromPeriod,
    ),
    index("category_mappings_household_category_idx").on(table.householdId, table.categoryId),
    validPeriod("period_effective_from", table.effectiveFromPeriod),
  ],
);

export const fundingMembership = pgTable(
  "funding_memberships",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    currency: text("currency").notNull(),
    active: boolean("active").notNull().default(true),
    effectiveFromPeriod: text("effective_from_period").notNull(),
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
    uniqueIndex("funding_memberships_household_account_period_unique").on(
      table.householdId,
      table.accountId,
      table.effectiveFromPeriod,
    ),
    index("funding_memberships_household_currency_idx").on(table.householdId, table.currency),
    validPeriod("period_effective_from", table.effectiveFromPeriod),
  ],
);

export const rolloverSetting = pgTable(
  "rollover_settings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    envelopeId: text("envelope_id").notNull(),
    positiveRollover: boolean("positive_rollover").notNull().default(true),
    effectiveFromPeriod: text("effective_from_period").notNull(),
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
    uniqueIndex("rollover_settings_household_envelope_period_unique").on(
      table.householdId,
      table.envelopeId,
      table.effectiveFromPeriod,
    ),
    index("rollover_settings_household_envelope_idx").on(table.householdId, table.envelopeId),
    validPeriod("period_effective_from", table.effectiveFromPeriod),
  ],
);

export const assignment = pgTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    budgetPeriod: text("budget_period").notNull(),
    sourceEnvelopeId: text("source_envelope_id"),
    destinationEnvelopeId: text("destination_envelope_id"),
    amountMinor: integer("amount_minor").notNull(),
    reversesAssignmentId: text("reverses_assignment_id"),
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
    uniqueIndex("assignments_household_id_unique").on(table.householdId, table.id),
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
    validPeriod("assignments_budget_period", table.budgetPeriod),
  ],
);

export const refundLink = pgTable(
  "refund_links",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    originalTransactionId: text("original_transaction_id").notNull(),
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
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("refund_links_household_id_unique").on(table.householdId, table.id),
    uniqueIndex("refund_links_refund_once").on(table.refundTransactionId),
    check("refund_links_amount_positive", sql`${table.amountMinor} > 0`),
    index("refund_links_original_idx").on(table.originalTransactionId),
  ],
);

export const periodProjectionCache = pgTable(
  "period_projection_cache",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    budgetPeriod: text("budget_period").notNull(),
    projectionJson: jsonb("projection_json").$type<unknown>().notNull(),
    seqStamped: integer("seq_stamped").notNull(),
    computedAt: timestamptz("computed_at").defaultNow().notNull(),
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
