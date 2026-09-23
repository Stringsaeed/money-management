import { relations, sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const V2_IDENTITY_KINDS = ["user"] as const;
export type V2IdentityKind = (typeof V2_IDENTITY_KINDS)[number];

export const V2_GUEST_SESSION_STATUSES = ["active", "revoked", "claimed"] as const;
export type V2GuestSessionStatus = (typeof V2_GUEST_SESSION_STATUSES)[number];

export const V2_HOUSEHOLD_MEMBER_STATUSES = ["active", "inactive", "pending"] as const;
export type V2HouseholdMemberStatus = (typeof V2_HOUSEHOLD_MEMBER_STATUSES)[number];

export const V2_HOUSEHOLD_ROLES = ["admin", "member", "viewer"] as const;
export type V2HouseholdRole = (typeof V2_HOUSEHOLD_ROLES)[number];

export const V2_LEDGER_OWNER_TYPES = ["user", "guest", "household"] as const;
export type V2LedgerOwnerType = (typeof V2_LEDGER_OWNER_TYPES)[number];

/** V2 identity projection. It is deliberately separate from the legacy user table. */
export const v2Identity = pgTable(
  "v2_identity",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: V2_IDENTITY_KINDS }).notNull().default("user"),
    workosUserId: text("workos_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_identity_workos_user_unique").on(table.workosUserId),
    check("v2_identity_kind_valid", sql`${table.kind} IN ('user')`),
  ],
);

/** Opaque guest credentials are represented by a hash only; the raw token never persists. */
export const v2GuestSession = pgTable(
  "v2_guest_session",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    clientKeyHash: text("client_key_hash").notNull(),
    status: text("status", { enum: V2_GUEST_SESSION_STATUSES }).notNull().default("active"),
    expiresAt: timestamptz("expires_at").notNull(),
    claimedByUserId: text("claimed_by_user_id").references(() => v2Identity.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamptz("revoked_at"),
    claimedAt: timestamptz("claimed_at"),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_guest_session_token_hash_unique").on(table.tokenHash),
    index("v2_guest_session_client_created_idx").on(table.clientKeyHash, table.createdAt),
    index("v2_guest_session_expiry_idx").on(table.expiresAt),
    check(
      "v2_guest_session_status_valid",
      sql`${table.status} IN ('active', 'revoked', 'claimed')`,
    ),
  ],
);

/** V2 household projection. WorkOS owns the organization; this table owns V2 product metadata. */
export const v2Household = pgTable(
  "v2_household",
  {
    id: text("id").primaryKey(),
    workosOrganizationId: text("workos_organization_id").notNull(),
    name: text("name").notNull(),
    createRequestId: text("create_request_id"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => v2Identity.id, { onDelete: "restrict" }),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_household_workos_organization_unique").on(table.workosOrganizationId),
    uniqueIndex("v2_household_create_request_unique").on(table.createRequestId),
  ],
);

/** Membership projection for V2 organizations. WorkOS remains the authority for invitations. */
export const v2HouseholdMember = pgTable(
  "v2_household_member",
  {
    id: text("id").primaryKey(),
    householdId: text("household_id")
      .notNull()
      .references(() => v2Household.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => v2Identity.id, { onDelete: "cascade" }),
    role: text("role", { enum: V2_HOUSEHOLD_ROLES }).notNull().default("member"),
    status: text("status", { enum: V2_HOUSEHOLD_MEMBER_STATUSES }).notNull().default("active"),
    observedAt: timestamptz("observed_at").defaultNow().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_household_member_household_user_unique").on(table.householdId, table.userId),
    uniqueIndex("v2_household_member_user_active_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    index("v2_household_member_user_idx").on(table.userId),
    index("v2_household_member_household_status_idx").on(table.householdId, table.status),
    check("v2_household_member_role_valid", sql`${table.role} IN ('admin', 'member', 'viewer')`),
    check(
      "v2_household_member_status_valid",
      sql`${table.status} IN ('active', 'inactive', 'pending')`,
    ),
  ],
);

/** Ownership registry for future V2 financial tables; no legacy foreign keys. */
export const v2Ledger = pgTable(
  "v2_ledger",
  {
    id: text("id").primaryKey(),
    ownerType: text("owner_type", { enum: V2_LEDGER_OWNER_TYPES }).notNull(),
    ownerId: text("owner_id").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull(),
    updatedAt: timestamptz("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("v2_ledger_owner_unique").on(table.ownerType, table.ownerId),
    index("v2_ledger_owner_id_idx").on(table.ownerId),
    check("v2_ledger_owner_type_valid", sql`${table.ownerType} IN ('user', 'guest', 'household')`),
  ],
);

export const v2IdentityRelations = relations(v2Identity, ({ many }) => ({
  guestSessions: many(v2GuestSession),
  createdHouseholds: many(v2Household),
  memberships: many(v2HouseholdMember),
}));

export const v2GuestSessionRelations = relations(v2GuestSession, ({ one }) => ({
  claimedByUser: one(v2Identity, {
    fields: [v2GuestSession.claimedByUserId],
    references: [v2Identity.id],
  }),
}));

export const v2HouseholdRelations = relations(v2Household, ({ one, many }) => ({
  createdByUser: one(v2Identity, {
    fields: [v2Household.createdByUserId],
    references: [v2Identity.id],
  }),
  members: many(v2HouseholdMember),
}));

export const v2HouseholdMemberRelations = relations(v2HouseholdMember, ({ one }) => ({
  household: one(v2Household, {
    fields: [v2HouseholdMember.householdId],
    references: [v2Household.id],
  }),
  user: one(v2Identity, {
    fields: [v2HouseholdMember.userId],
    references: [v2Identity.id],
  }),
}));
