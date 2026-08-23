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

import type { EffectTag } from "@trove/protocol";

import * as auth from "./auth";
import { household } from "./household";

/**
 * One row appended per committed command. This is the sync feed, the
 * change-notification watermark unit, and the household activity history —
 * not a compliance-only audit log.
 *
 * `seq` is a per-household monotonic counter allocated at append time inside
 * the same atomic batch as the command's writes (D1 serializes batches, so
 * `MAX(seq) + 1` cannot interleave).
 */
export const householdChange = sqliteTable(
  "household_changes",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    /** Authenticated user the command was attributed to. */
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    /** Idempotency key of the command that produced this change. */
    commandId: text("command_id").notNull(),
    /** Subset of effect tags this command invalidated. */
    effects: text("effects", { mode: "json" })
      .$type<EffectTag[]>()
      .notNull()
      .default(sql`'[]'`),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
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

/**
 * Idempotency store for committed commands. A retry after a timeout replays
 * the stored `applied` payload (joined with the original `household_changes`
 * row for `seq`/`effects`) instead of re-executing.
 */
export const commandResult = sqliteTable(
  "command_results",
  {
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    commandId: text("command_id").notNull(),
    /** JSON-serialized `applied` payload returned on replay. */
    result: text("result", { mode: "json" }).$type<unknown>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.householdId, table.commandId] })],
);

/**
 * Internal guard table used to turn precondition failures into statement
 * errors inside an atomic D1 `batch()`. D1 batches roll back entirely when any
 * statement throws, so inserting a row that violates the CHECK constraint is
 * how "stale version / unsatisfied predicate" aborts the whole command —
 * partial application is never observable.
 */
export const pipelineAssertion = sqliteTable(
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
