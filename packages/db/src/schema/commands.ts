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
import { ledger } from "./ledger-scope";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const householdChange = pgTable(
  "household_changes",
  {
    id: text("id").primaryKey(),
    /** Ledger whose history this row extends; the `seq` watermark is per ledger. */
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
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
    uniqueIndex("household_changes_ledger_seq_unique").on(table.ledgerId, table.seq),
    uniqueIndex("household_changes_ledger_command_unique").on(table.ledgerId, table.commandId),
    index("household_changes_commandId_idx").on(table.commandId),
  ],
);

export const householdChangeSequence = pgTable("household_change_sequences", {
  ledgerId: text("ledger_id")
    .primaryKey()
    .references(() => ledger.id, { onDelete: "cascade" }),
  householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull(),
});

export const commandResult = pgTable(
  "command_results",
  {
    ledgerId: text("ledger_id")
      .notNull()
      .references(() => ledger.id, { onDelete: "cascade" }),
    householdId: text("household_id").references(() => household.id, { onDelete: "cascade" }),
    commandId: text("command_id").notNull(),
    result: jsonb("result").$type<unknown>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.ledgerId, table.commandId] })],
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
  ledger: one(ledger, {
    fields: [householdChange.ledgerId],
    references: [ledger.id],
  }),
  household: one(household, {
    fields: [householdChange.householdId],
    references: [household.id],
  }),
  user: one(auth.user, { fields: [householdChange.userId], references: [auth.user.id] }),
}));
