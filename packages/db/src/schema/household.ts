import { relations, sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import * as auth from "./auth";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const MEMBERSHIP_STATUSES = ["active", "inactive", "pending"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/**
 * A Household is the local projection of one WorkOS Organization; its id is
 * the organization id, which is also the id of its organization Ledger.
 * `create_request_id` is the client-supplied idempotency key of the create
 * call, so a retried create finds the Household it already made instead of
 * creating a second Organization.
 */
export const household = pgTable(
  "household",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdByUserId: text("created_by_user_id").references(() => auth.user.id, {
      onDelete: "set null",
    }),
    createRequestId: text("create_request_id"),
    membersReconciledAt: timestamptz("members_reconciled_at"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("household_creator_request_unique").on(
      table.createdByUserId,
      table.createRequestId,
    ),
  ],
);

/**
 * Membership is a derived projection of a WorkOS organization membership.
 * `id` is the WorkOS membership id. `observed_at` is the ordering key every
 * writer (webhook, bootstrap, mutation) must respect: an observation older
 * than the one already projected never wins. Removed memberships stay as
 * `inactive` tombstones so a stale, reordered `created` event cannot bring
 * access back.
 */
export const membership = pgTable(
  "membership",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    status: text("status", { enum: MEMBERSHIP_STATUSES }).notNull().default("active"),
    observedAt: timestamptz("observed_at").defaultNow().notNull(),
    observedEventId: text("observed_event_id"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("membership_household_user_unique").on(table.householdId, table.userId),
    index("membership_userId_idx").on(table.userId),
    index("membership_household_status_idx").on(table.householdId, table.status),
    check("membership_status_valid", sql`${table.status} IN ('active', 'inactive', 'pending')`),
  ],
);

/**
 * One-time, short-lived handoff from the mobile app to the member-management
 * web page. Only the SHA-256 hash of the code is stored; the code itself
 * travels once, in a URL fragment, and is consumed on first exchange.
 */
export const widgetHandoff = pgTable(
  "widget_handoff",
  {
    codeHash: text("code_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    expiresAt: timestamptz("expires_at").notNull(),
    consumedAt: timestamptz("consumed_at"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [index("widget_handoff_expires_idx").on(table.expiresAt)],
);

export const householdRelations = relations(household, ({ many }) => ({
  memberships: many(membership),
}));

export const membershipRelations = relations(membership, ({ one }) => ({
  user: one(auth.user, { fields: [membership.userId], references: [auth.user.id] }),
  household: one(household, {
    fields: [membership.householdId],
    references: [household.id],
  }),
}));
