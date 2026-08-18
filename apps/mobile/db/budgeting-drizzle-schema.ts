import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  check,
  foreignKey,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

interface BudgetingSchemaReferences {
  accountId: AnySQLiteColumn;
  categoryId: AnySQLiteColumn;
}

/** Typed Drizzle mapping for the tables created by the code-backed budgeting migration. */
export function createBudgetingDrizzleSchema(references: BudgetingSchemaReferences) {
  const budgetWorkspaces = sqliteTable("budget_workspaces", {
    currency: text("currency").primaryKey(),
    activationPeriod: text("activation_period").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });

  const fundingMemberships = sqliteTable(
    "funding_memberships",
    {
      accountId: text("account_id")
        .notNull()
        .references(() => references.accountId, { onDelete: "restrict" }),
      currency: text("currency")
        .notNull()
        .references(() => budgetWorkspaces.currency, { onDelete: "restrict" }),
      effectiveFromPeriod: text("effective_from_period").notNull(),
      effectiveToPeriod: text("effective_to_period"),
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      primaryKey({ columns: [table.accountId, table.effectiveFromPeriod] }),
      check(
        "funding_membership_period_order",
        sql`${table.effectiveToPeriod} IS NULL OR ${table.effectiveToPeriod} >= ${table.effectiveFromPeriod}`,
      ),
    ],
  );

  const envelopes = sqliteTable(
    "envelopes",
    {
      id: text("id").primaryKey(),
      currency: text("currency")
        .notNull()
        .references(() => budgetWorkspaces.currency, { onDelete: "restrict" }),
      name: text("name").notNull(),
      icon: text("icon").notNull(),
      color: text("color").notNull(),
      lifecycle: text("lifecycle").notNull().default("active"),
      sortOrder: integer("sort_order").notNull().default(0),
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull(),
    },
    (table) => [check("envelope_lifecycle", sql`${table.lifecycle} IN ('active', 'archived')`)],
  );

  const categoryMappings = sqliteTable(
    "category_mappings",
    {
      categoryId: text("category_id")
        .notNull()
        .references(() => references.categoryId, { onDelete: "restrict" }),
      envelopeId: text("envelope_id")
        .notNull()
        .references(() => envelopes.id, { onDelete: "restrict" }),
      effectiveFromPeriod: text("effective_from_period").notNull(),
      effectiveToPeriod: text("effective_to_period"),
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      primaryKey({ columns: [table.categoryId, table.effectiveFromPeriod] }),
      check(
        "category_mapping_period_order",
        sql`${table.effectiveToPeriod} IS NULL OR ${table.effectiveToPeriod} >= ${table.effectiveFromPeriod}`,
      ),
    ],
  );

  const assignments = sqliteTable(
    "assignments",
    {
      id: text("id").primaryKey(),
      currency: text("currency")
        .notNull()
        .references(() => budgetWorkspaces.currency, { onDelete: "restrict" }),
      budgetPeriod: text("budget_period").notNull(),
      sourceEnvelopeId: text("source_envelope_id").references(() => envelopes.id, {
        onDelete: "restrict",
      }),
      destinationEnvelopeId: text("destination_envelope_id").references(() => envelopes.id, {
        onDelete: "restrict",
      }),
      amountMinor: integer("amount_minor").notNull(),
      reversesAssignmentId: text("reverses_assignment_id"),
      createdAt: text("created_at").notNull(),
    },
    (table) => [
      foreignKey({
        name: "assignments_reverses_assignment_id_assignments_id_fk",
        columns: [table.reversesAssignmentId],
        foreignColumns: [table.id],
      }).onDelete("restrict"),
      check("assignment_positive_amount", sql`${table.amountMinor} > 0`),
      check(
        "assignment_has_endpoint",
        sql`${table.sourceEnvelopeId} IS NOT NULL OR ${table.destinationEnvelopeId} IS NOT NULL`,
      ),
      check(
        "assignment_distinct_endpoints",
        sql`${table.sourceEnvelopeId} IS NULL OR ${table.destinationEnvelopeId} IS NULL OR ${table.sourceEnvelopeId} <> ${table.destinationEnvelopeId}`,
      ),
    ],
  );

  const rolloverSettings = sqliteTable(
    "rollover_settings",
    {
      envelopeId: text("envelope_id")
        .notNull()
        .references(() => envelopes.id, { onDelete: "restrict" }),
      effectiveFromPeriod: text("effective_from_period").notNull(),
      positiveRollover: integer("positive_rollover", { mode: "boolean" }).notNull().default(true),
      createdAt: text("created_at").notNull(),
    },
    (table) => [primaryKey({ columns: [table.envelopeId, table.effectiveFromPeriod] })],
  );

  const setupDrafts = sqliteTable("setup_drafts", {
    id: text("id").primaryKey(),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  });

  return {
    assignments,
    budgetWorkspaces,
    categoryMappings,
    envelopes,
    fundingMemberships,
    rolloverSettings,
    setupDrafts,
  };
}
