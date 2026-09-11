import { relations, sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import * as auth from "./auth";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

const LEDGER_KINDS = ["personal", "organization"] as const;

/**
 * A Ledger: the owner of every Account, Category, and Transaction.
 *
 * A personal Ledger is owned by one User and its id is `personal:${userId}`;
 * an organization Ledger is owned by one WorkOS organization and its id is
 * the organization id. Until Household administration migrates to WorkOS
 * (#228) every existing Household is projected here as an organization Ledger
 * whose id and `organization_id` are the Household id — so `ledger_id` and
 * `household_id` carry the same value on Household-owned rows.
 */
export const ledger = pgTable(
  "ledger",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: LEDGER_KINDS }).notNull(),
    personalUserId: text("personal_user_id").references(() => auth.user.id, {
      onDelete: "cascade",
    }),
    organizationId: text("organization_id"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique("ledger_personal_user_id_unique").on(table.personalUserId),
    check("ledger_kind_valid", sql`${table.kind} IN ('personal', 'organization')`),
    // The id shape is part of the contract, not a convention: `ledger_id LIKE
    // 'personal:%'` is what row-level checks and Sync Streams rely on to tell
    // a Personal Ledger from an organization one without a join.
    check(
      "ledger_owner_matches_kind",
      sql`(${table.kind} = 'personal'
          AND ${table.personalUserId} IS NOT NULL
          AND ${table.organizationId} IS NULL
          AND ${table.id} = 'personal:' || ${table.personalUserId})
        OR (${table.kind} = 'organization'
          AND ${table.organizationId} IS NOT NULL
          AND ${table.personalUserId} IS NULL
          AND ${table.id} = ${table.organizationId}
          AND ${table.id} NOT LIKE 'personal:%')`,
    ),
    index("ledger_organization_idx").on(table.organizationId),
  ],
);

export const ledgerRelations = relations(ledger, ({ one }) => ({
  personalUser: one(auth.user, {
    fields: [ledger.personalUserId],
    references: [auth.user.id],
  }),
}));
