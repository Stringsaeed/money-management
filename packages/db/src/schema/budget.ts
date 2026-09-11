import { relations, sql, type AnyColumn } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import * as auth from "./auth";
import { household } from "./household";
import { category, ledgerAccount } from "./ledger";
import { ledger } from "./ledger-scope";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

const validPeriod = (name: string, column: AnyColumn) =>
  check(`${name}_period_format`, sql`${column} ~ '^[0-9]{4}-[0-9]{2}$'`);

const householdRequiredForOrganization = (
  tableName: string,
  householdId: AnyColumn,
  ledgerId: AnyColumn,
) =>
  check(
    `${tableName}_household_required_for_organization`,
    sql`${householdId} IS NOT NULL OR ${ledgerId} LIKE 'personal:%'`,
  );

export const budgetWorkspace = pgTable(
  "budget_workspaces",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    uniqueIndex("budget_workspaces_ledger_currency_unique").on(table.ledgerId, table.currency),
    householdRequiredForOrganization("budget_workspaces", table.householdId, table.ledgerId),
    validPeriod("budget_workspaces_activation", table.activationPeriod),
  ],
);

export const envelope = pgTable(
  "envelopes",
  {
    id: text("id").primaryKey(),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    unique("envelopes_ledger_id_id_unique").on(table.ledgerId, table.id),
    check("envelopes_lifecycle_valid", sql`${table.lifecycle} IN ('active', 'archived')`),
    householdRequiredForOrganization("envelopes", table.householdId, table.ledgerId),
    index("envelopes_household_currency_idx").on(table.householdId, table.currency),
    index("envelopes_ledger_currency_idx").on(table.ledgerId, table.currency),
  ],
);

export const categoryMapping = pgTable(
  "category_mappings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    uniqueIndex("category_mappings_ledger_category_period_unique").on(
      table.ledgerId,
      table.categoryId,
      table.effectiveFromPeriod,
    ),
    householdRequiredForOrganization("category_mappings", table.householdId, table.ledgerId),
    foreignKey({
      columns: [table.ledgerId, table.envelopeId],
      foreignColumns: [envelope.ledgerId, envelope.id],
    }),
    foreignKey({
      columns: [table.ledgerId, table.categoryId],
      foreignColumns: [category.ledgerId, category.id],
    }),
    index("category_mappings_household_category_idx").on(table.householdId, table.categoryId),
    index("category_mappings_ledger_category_idx").on(table.ledgerId, table.categoryId),
    validPeriod("period_effective_from", table.effectiveFromPeriod),
  ],
);

export const fundingMembership = pgTable(
  "funding_memberships",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    uniqueIndex("funding_memberships_ledger_account_period_unique").on(
      table.ledgerId,
      table.accountId,
      table.effectiveFromPeriod,
    ),
    householdRequiredForOrganization("funding_memberships", table.householdId, table.ledgerId),
    foreignKey({
      columns: [table.ledgerId, table.accountId],
      foreignColumns: [ledgerAccount.ledgerId, ledgerAccount.id],
    }),
    index("funding_memberships_household_currency_idx").on(table.householdId, table.currency),
    index("funding_memberships_ledger_currency_idx").on(table.ledgerId, table.currency),
    validPeriod("period_effective_from", table.effectiveFromPeriod),
  ],
);

export const rolloverSetting = pgTable(
  "rollover_settings",
  {
    id: text("id")
      .primaryKey()
      .default(sql`md5(random()::text || clock_timestamp()::text)`),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    uniqueIndex("rollover_settings_ledger_envelope_period_unique").on(
      table.ledgerId,
      table.envelopeId,
      table.effectiveFromPeriod,
    ),
    householdRequiredForOrganization("rollover_settings", table.householdId, table.ledgerId),
    foreignKey({
      columns: [table.ledgerId, table.envelopeId],
      foreignColumns: [envelope.ledgerId, envelope.id],
    }),
    index("rollover_settings_household_envelope_idx").on(table.householdId, table.envelopeId),
    index("rollover_settings_ledger_envelope_idx").on(table.ledgerId, table.envelopeId),
    validPeriod("period_effective_from", table.effectiveFromPeriod),
  ],
);

export const assignment = pgTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    unique("assignments_ledger_id_id_unique").on(table.ledgerId, table.id),
    check("assignments_amount_positive", sql`${table.amountMinor} > 0`),
    check(
      "assignments_has_endpoint",
      sql`${table.sourceEnvelopeId} IS NOT NULL OR ${table.destinationEnvelopeId} IS NOT NULL`,
    ),
    check(
      "assignments_distinct_endpoints",
      sql`${table.sourceEnvelopeId} IS NULL OR ${table.destinationEnvelopeId} IS NULL OR ${table.sourceEnvelopeId} <> ${table.destinationEnvelopeId}`,
    ),
    householdRequiredForOrganization("assignments", table.householdId, table.ledgerId),
    foreignKey({
      columns: [table.ledgerId, table.sourceEnvelopeId],
      foreignColumns: [envelope.ledgerId, envelope.id],
    }),
    foreignKey({
      columns: [table.ledgerId, table.destinationEnvelopeId],
      foreignColumns: [envelope.ledgerId, envelope.id],
    }),
    index("assignments_household_period_idx").on(table.householdId, table.budgetPeriod),
    index("assignments_ledger_period_idx").on(table.ledgerId, table.budgetPeriod),
    validPeriod("assignments_budget_period", table.budgetPeriod),
  ],
);

export const refundLink = pgTable(
  "refund_links",
  {
    id: text("id").primaryKey(),
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    unique("refund_links_ledger_id_id_unique").on(table.ledgerId, table.id),
    uniqueIndex("refund_links_refund_once").on(table.refundTransactionId),
    check("refund_links_amount_positive", sql`${table.amountMinor} > 0`),
    householdRequiredForOrganization("refund_links", table.householdId, table.ledgerId),
    index("refund_links_original_idx").on(table.originalTransactionId),
  ],
);

export const periodProjectionCache = pgTable(
  "period_projection_cache",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    budgetPeriod: text("budget_period").notNull(),
    projectionJson: jsonb("projection_json").$type<unknown>().notNull(),
    seqStamped: integer("seq_stamped").notNull(),
    computedAt: timestamptz("computed_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.ledgerId, table.currency, table.budgetPeriod],
    }),
    householdRequiredForOrganization("period_projection_cache", table.householdId, table.ledgerId),
  ],
);

export const budgetWorkspaceRelations = relations(budgetWorkspace, ({ many, one }) => ({
  ledger: one(ledger, { fields: [budgetWorkspace.ledgerId], references: [ledger.id] }),
  envelopes: many(envelope),
}));

export const envelopeRelations = relations(envelope, ({ one, many }) => ({
  ledger: one(ledger, { fields: [envelope.ledgerId], references: [ledger.id] }),
  workspace: one(budgetWorkspace, {
    fields: [envelope.ledgerId, envelope.currency],
    references: [budgetWorkspace.ledgerId, budgetWorkspace.currency],
  }),
  rolloverSettings: many(rolloverSetting),
}));

export const categoryMappingRelations = relations(categoryMapping, ({ one }) => ({
  ledger: one(ledger, { fields: [categoryMapping.ledgerId], references: [ledger.id] }),
  envelope: one(envelope, {
    fields: [categoryMapping.ledgerId, categoryMapping.envelopeId],
    references: [envelope.ledgerId, envelope.id],
  }),
}));
