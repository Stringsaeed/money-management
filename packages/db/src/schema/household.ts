import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import * as auth from "./auth";

export const household = sqliteTable("household", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => auth.user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const membership = sqliteTable(
  "membership",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // "owner" | "admin" | "member" | "viewer"
    /** Optimistic-concurrency version, generalized from Rule Revision. */
    version: integer("version").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("membership_household_user_unique").on(table.householdId, table.userId),
    index("membership_userId_idx").on(table.userId),
  ],
);

export const inviteCode = sqliteTable(
  "invite_code",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    singleUse: integer("single_use", { mode: "boolean" }).default(true).notNull(),
    usedByUserId: text("used_by_user_id").references(() => auth.user.id, {
      onDelete: "set null",
    }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("invite_code_householdId_idx").on(table.householdId)],
);

export const householdRelations = relations(household, ({ many }) => ({
  memberships: many(membership),
  invites: many(inviteCode),
}));

export const membershipRelations = relations(membership, ({ one }) => ({
  user: one(auth.user, { fields: [membership.userId], references: [auth.user.id] }),
  household: one(household, {
    fields: [membership.householdId],
    references: [household.id],
  }),
}));

export const inviteCodeRelations = relations(inviteCode, ({ one }) => ({
  household: one(household, {
    fields: [inviteCode.householdId],
    references: [household.id],
  }),
}));
