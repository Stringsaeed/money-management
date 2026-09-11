import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/**
 * Durable, retryable cleanup across WorkOS and Postgres (#230).
 * Each row is one deletion (User or Household). `cursor` is the next step
 * index to run; retries are idempotent and resume from that cursor.
 */
export const deletionOperation = pgTable(
  "deletion_operation",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["user", "household"] }).notNull(),
    targetId: text("target_id").notNull(),
    requestedByUserId: text("requested_by_user_id").notNull(),
    status: text("status", {
      enum: ["pending", "running", "succeeded", "failed"],
    })
      .notNull()
      .default("pending"),
    cursor: integer("cursor").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check("deletion_operation_kind_valid", sql`${table.kind} IN ('user', 'household')`),
    check(
      "deletion_operation_status_valid",
      sql`${table.status} IN ('pending', 'running', 'succeeded', 'failed')`,
    ),
    index("deletion_operation_target_idx").on(table.kind, table.targetId),
    index("deletion_operation_status_idx").on(table.status),
  ],
);

/**
 * Tombstone for a deleted WorkOS identity or Organization. Delayed webhooks,
 * import retries, and stale clients must not recreate access past this row.
 */
export const deletedIdentity = pgTable(
  "deleted_identity",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["user", "organization"] }).notNull(),
    deletedAt: timestamptz("deleted_at").defaultNow().notNull(),
    reason: text("reason").notNull().default("user_request"),
  },
  (table) => [check("deleted_identity_kind_valid", sql`${table.kind} IN ('user', 'organization')`)],
);
