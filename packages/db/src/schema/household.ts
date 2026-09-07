import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import * as auth from "./auth";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const household = pgTable("household", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => auth.user.id, { onDelete: "cascade" }),
  createdAt: timestamptz("created_at").defaultNow().notNull(),
  updatedAt: timestamptz("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

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
    version: integer("version").notNull().default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("membership_household_user_unique").on(table.householdId, table.userId),
    index("membership_userId_idx").on(table.userId),
  ],
);

export const inviteCode = pgTable(
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
    expiresAt: timestamptz("expires_at").notNull(),
    singleUse: boolean("single_use").default(true).notNull(),
    usedByUserId: text("used_by_user_id").references(() => auth.user.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamptz("revoked_at"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
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
