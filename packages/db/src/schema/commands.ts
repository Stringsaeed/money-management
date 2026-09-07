import { relations, sql } from "drizzle-orm";
import {
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

import type { EffectTag } from "@trove/protocol";

import * as auth from "./auth";
import { household } from "./household";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const householdChange = pgTable(
  "household_changes",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    commandId: text("command_id").notNull(),
    effects: jsonb("effects")
      .$type<EffectTag[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("household_changes_household_seq_unique").on(table.householdId, table.seq),
    uniqueIndex("household_changes_household_command_unique").on(
      table.householdId,
      table.commandId,
    ),
    index("household_changes_commandId_idx").on(table.commandId),
  ],
);

export const commandResult = pgTable(
  "command_results",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    commandId: text("command_id").notNull(),
    result: jsonb("result").$type<unknown>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.householdId, table.commandId] })],
);

export const pipelineAssertion = pgTable(
  "_pipeline_assertions",
  {
    id: text("id").primaryKey(),
    ok: integer("ok").notNull(),
  },
  (table) => [check("pipeline_assertion_ok_true", sql`${table.ok} = 1`)],
);

export const householdChangeRelations = relations(householdChange, ({ one }) => ({
  household: one(household, {
    fields: [householdChange.householdId],
    references: [household.id],
  }),
  user: one(auth.user, { fields: [householdChange.userId], references: [auth.user.id] }),
}));
