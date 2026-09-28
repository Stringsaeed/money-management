import { index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/**
 * Fixed-window counters that cap paid AI calls per person. `subject` is the
 * principal (`user:<id>` or `guest:<id>`), `bucket` names the quota and its
 * window start. Rows past `expires_at` are pruned by the hourly cron.
 */
export const v2AiUsage = pgTable(
  "v2_ai_usage",
  {
    subject: text("subject").notNull(),
    bucket: text("bucket").notNull(),
    count: integer("count").notNull().default(0),
    expiresAt: timestamptz("expires_at").notNull(),
  },
  (table) => [
    primaryKey({ name: "v2_ai_usage_pk", columns: [table.subject, table.bucket] }),
    index("v2_ai_usage_expires_idx").on(table.expiresAt),
  ],
);
