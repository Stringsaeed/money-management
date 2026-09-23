CREATE TABLE IF NOT EXISTS "v2_identity" (
  "id" text PRIMARY KEY NOT NULL,
  "kind" text DEFAULT 'user' NOT NULL,
  "workos_user_id" text NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_identity_kind_valid" CHECK ("kind" IN ('user'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_identity_workos_user_unique" ON "v2_identity" USING btree ("workos_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v2_guest_session" (
  "id" text PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL,
  "client_key_hash" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "claimed_by_user_id" text,
  "revoked_at" timestamp with time zone,
  "claimed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_guest_session_status_valid" CHECK ("status" IN ('active', 'revoked', 'claimed')),
  CONSTRAINT "v2_guest_session_claimed_user_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "v2_identity"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_guest_session_token_hash_unique" ON "v2_guest_session" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_guest_session_client_created_idx" ON "v2_guest_session" USING btree ("client_key_hash", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_guest_session_expiry_idx" ON "v2_guest_session" USING btree ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v2_household" (
  "id" text PRIMARY KEY NOT NULL,
  "workos_organization_id" text NOT NULL,
  "name" text NOT NULL,
  "create_request_id" text,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_household_created_by_user_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "v2_identity"("id") ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_household_workos_organization_unique" ON "v2_household" USING btree ("workos_organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_household_create_request_unique" ON "v2_household" USING btree ("create_request_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v2_household_member" (
  "id" text PRIMARY KEY NOT NULL,
  "household_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" text DEFAULT 'member' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "observed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_household_member_household_fk" FOREIGN KEY ("household_id") REFERENCES "v2_household"("id") ON DELETE CASCADE,
  CONSTRAINT "v2_household_member_user_fk" FOREIGN KEY ("user_id") REFERENCES "v2_identity"("id") ON DELETE CASCADE,
  CONSTRAINT "v2_household_member_role_valid" CHECK ("role" IN ('admin', 'member', 'viewer')),
  CONSTRAINT "v2_household_member_status_valid" CHECK ("status" IN ('active', 'inactive', 'pending'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_household_member_household_user_unique" ON "v2_household_member" USING btree ("household_id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_household_member_user_active_unique" ON "v2_household_member" USING btree ("user_id") WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_household_member_user_idx" ON "v2_household_member" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_household_member_household_status_idx" ON "v2_household_member" USING btree ("household_id", "status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v2_ledger" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_type" text NOT NULL,
  "owner_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_ledger_owner_type_valid" CHECK ("owner_type" IN ('user', 'guest', 'household'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "v2_ledger_owner_unique" ON "v2_ledger" USING btree ("owner_type", "owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_ledger_owner_id_idx" ON "v2_ledger" USING btree ("owner_id");
--> statement-breakpoint
-- V2 internet-first ledger storage.
--
-- This migration is intentionally independent of every legacy ledger, budget,
-- command, and PowerSync table. The production migration journal entry is
-- finalized by the release integrator after the V2 auth/household migration.

CREATE TABLE IF NOT EXISTS "v2_accounts" (
  "ledger_id" text NOT NULL,
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "currency" text NOT NULL,
  "opening_balance_minor" bigint DEFAULT 0 NOT NULL,
  "lifecycle" text DEFAULT 'active' NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_accounts_ledger_fk"
    FOREIGN KEY ("ledger_id") REFERENCES "v2_ledger"("id") ON DELETE cascade,
  CONSTRAINT "v2_accounts_ledger_id_unique" UNIQUE ("ledger_id", "id"),
  CONSTRAINT "v2_accounts_type_valid"
    CHECK ("type" IN ('checking', 'savings', 'cash', 'credit_card', 'investment', 'other')),
  CONSTRAINT "v2_accounts_lifecycle_valid" CHECK ("lifecycle" IN ('active', 'archived')),
  CONSTRAINT "v2_accounts_currency_valid" CHECK ("currency" ~ '^[A-Z]{3}$'),
  CONSTRAINT "v2_accounts_opening_balance_safe"
    CHECK ("opening_balance_minor" BETWEEN -9007199254740991 AND 9007199254740991)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_accounts_ledger_lifecycle_idx"
  ON "v2_accounts" ("ledger_id", "lifecycle");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "v2_categories" (
  "ledger_id" text NOT NULL,
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "color" text DEFAULT '#4A8F69' NOT NULL,
  "icon" text DEFAULT 'tag' NOT NULL,
  "parent_id" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "lifecycle" text DEFAULT 'active' NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_categories_ledger_fk"
    FOREIGN KEY ("ledger_id") REFERENCES "v2_ledger"("id") ON DELETE cascade,
  CONSTRAINT "v2_categories_ledger_id_unique" UNIQUE ("ledger_id", "id"),
  CONSTRAINT "v2_categories_kind_valid" CHECK ("kind" IN ('income', 'expense')),
  CONSTRAINT "v2_categories_lifecycle_valid" CHECK ("lifecycle" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_categories_ledger_lifecycle_idx"
  ON "v2_categories" ("ledger_id", "lifecycle");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "v2_recurring_rules" (
  "ledger_id" text NOT NULL,
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "amount_minor" bigint NOT NULL,
  "currency" text NOT NULL,
  "account_id" text NOT NULL,
  "to_account_id" text,
  "category_id" text,
  "note" text DEFAULT '' NOT NULL,
  "frequency" text NOT NULL,
  "interval_count" integer DEFAULT 1 NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text,
  "end_count" integer,
  "time_zone" text NOT NULL,
  "lifecycle" text DEFAULT 'active' NOT NULL,
  "health" text DEFAULT 'ready' NOT NULL,
  "attention_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "eligibility_floor" text NOT NULL,
  "revision" integer DEFAULT 1 NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_recurring_rules_ledger_fk"
    FOREIGN KEY ("ledger_id") REFERENCES "v2_ledger"("id") ON DELETE cascade,
  CONSTRAINT "v2_recurring_rules_ledger_id_unique" UNIQUE ("ledger_id", "id"),
  CONSTRAINT "v2_recurring_rules_kind_valid"
    CHECK ("kind" IN ('income', 'expense', 'transfer')),
  CONSTRAINT "v2_recurring_rules_amount_positive" CHECK ("amount_minor" > 0),
  CONSTRAINT "v2_recurring_rules_amount_safe"
    CHECK ("amount_minor" BETWEEN 1 AND 9007199254740991),
  CONSTRAINT "v2_recurring_rules_currency_valid" CHECK ("currency" ~ '^[A-Z]{3}$'),
  CONSTRAINT "v2_recurring_rules_frequency_valid"
    CHECK ("frequency" IN ('day', 'week', 'month', 'year')),
  CONSTRAINT "v2_recurring_rules_interval_positive" CHECK ("interval_count" > 0),
  CONSTRAINT "v2_recurring_rules_lifecycle_valid"
    CHECK ("lifecycle" IN ('active', 'paused', 'completed', 'archived')),
  CONSTRAINT "v2_recurring_rules_health_valid"
    CHECK ("health" IN ('ready', 'needs_attention')),
  CONSTRAINT "v2_recurring_rules_transfer_shape"
    CHECK (("kind" = 'transfer' AND "to_account_id" IS NOT NULL AND "category_id" IS NULL AND "account_id" <> "to_account_id")
      OR ("kind" <> 'transfer' AND "to_account_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_recurring_rules_ledger_lifecycle_idx"
  ON "v2_recurring_rules" ("ledger_id", "lifecycle");
--> statement-breakpoint
ALTER TABLE "v2_recurring_rules"
  ADD CONSTRAINT "v2_recurring_rules_account_fk"
  FOREIGN KEY ("ledger_id", "account_id") REFERENCES "v2_accounts" ("ledger_id", "id");
--> statement-breakpoint
ALTER TABLE "v2_recurring_rules"
  ADD CONSTRAINT "v2_recurring_rules_to_account_fk"
  FOREIGN KEY ("ledger_id", "to_account_id") REFERENCES "v2_accounts" ("ledger_id", "id")
  ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "v2_recurring_rules"
  ADD CONSTRAINT "v2_recurring_rules_category_fk"
  FOREIGN KEY ("ledger_id", "category_id") REFERENCES "v2_categories" ("ledger_id", "id")
  ON DELETE SET NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "v2_transactions" (
  "ledger_id" text NOT NULL,
  "id" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "amount_minor" bigint NOT NULL,
  "currency" text NOT NULL,
  "date" text NOT NULL,
  "account_id" text NOT NULL,
  "to_account_id" text,
  "category_id" text,
  "recurring_rule_id" text,
  "note" text DEFAULT '' NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_transactions_ledger_fk"
    FOREIGN KEY ("ledger_id") REFERENCES "v2_ledger"("id") ON DELETE cascade,
  CONSTRAINT "v2_transactions_ledger_id_unique" UNIQUE ("ledger_id", "id"),
  CONSTRAINT "v2_transactions_kind_valid"
    CHECK ("kind" IN ('income', 'expense', 'transfer')),
  CONSTRAINT "v2_transactions_amount_positive" CHECK ("amount_minor" > 0),
  CONSTRAINT "v2_transactions_amount_safe"
    CHECK ("amount_minor" BETWEEN 1 AND 9007199254740991),
  CONSTRAINT "v2_transactions_currency_valid" CHECK ("currency" ~ '^[A-Z]{3}$'),
  CONSTRAINT "v2_transactions_date_valid" CHECK ("date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT "v2_transactions_transfer_shape"
    CHECK (("kind" = 'transfer' AND "to_account_id" IS NOT NULL AND "category_id" IS NULL AND "account_id" <> "to_account_id")
      OR ("kind" <> 'transfer' AND "to_account_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_transactions_ledger_date_id_idx"
  ON "v2_transactions" ("ledger_id", "date", "id");
CREATE INDEX IF NOT EXISTS "v2_transactions_ledger_account_date_idx"
  ON "v2_transactions" ("ledger_id", "account_id", "date");
CREATE INDEX IF NOT EXISTS "v2_transactions_ledger_category_date_idx"
  ON "v2_transactions" ("ledger_id", "category_id", "date");
--> statement-breakpoint
ALTER TABLE "v2_transactions"
  ADD CONSTRAINT "v2_transactions_account_fk"
  FOREIGN KEY ("ledger_id", "account_id") REFERENCES "v2_accounts" ("ledger_id", "id");
--> statement-breakpoint
ALTER TABLE "v2_transactions"
  ADD CONSTRAINT "v2_transactions_to_account_fk"
  FOREIGN KEY ("ledger_id", "to_account_id") REFERENCES "v2_accounts" ("ledger_id", "id")
  ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "v2_transactions"
  ADD CONSTRAINT "v2_transactions_category_fk"
  FOREIGN KEY ("ledger_id", "category_id") REFERENCES "v2_categories" ("ledger_id", "id")
  ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "v2_transactions"
  ADD CONSTRAINT "v2_transactions_recurring_rule_fk"
  FOREIGN KEY ("ledger_id", "recurring_rule_id") REFERENCES "v2_recurring_rules" ("ledger_id", "id")
  ON DELETE SET NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "v2_recurring_occurrences" (
  "id" text PRIMARY KEY NOT NULL,
  "ledger_id" text NOT NULL,
  "rule_id" text NOT NULL,
  "scheduled_date" text NOT NULL,
  "transaction_id" text,
  "settled_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_recurring_occurrences_ledger_fk"
    FOREIGN KEY ("ledger_id") REFERENCES "v2_ledger"("id") ON DELETE cascade,
  CONSTRAINT "v2_recurring_occurrences_rule_fk"
    FOREIGN KEY ("ledger_id", "rule_id") REFERENCES "v2_recurring_rules" ("ledger_id", "id") ON DELETE cascade,
  CONSTRAINT "v2_recurring_occurrences_transaction_fk"
    FOREIGN KEY ("ledger_id", "transaction_id") REFERENCES "v2_transactions" ("ledger_id", "id") ON DELETE SET NULL,
  CONSTRAINT "v2_recurring_occurrences_date_valid"
    CHECK ("scheduled_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT "v2_recurring_occurrences_rule_date_unique"
    UNIQUE ("ledger_id", "rule_id", "scheduled_date"),
  CONSTRAINT "v2_recurring_occurrences_transaction_unique"
    UNIQUE ("transaction_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_recurring_occurrences_ledger_rule_idx"
  ON "v2_recurring_occurrences" ("ledger_id", "rule_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "v2_idempotency_keys" (
  "ledger_id" text NOT NULL,
  "key" text NOT NULL,
  "operation" text NOT NULL,
  "status_code" integer NOT NULL,
  "response_json" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "v2_idempotency_keys_ledger_fk"
    FOREIGN KEY ("ledger_id") REFERENCES "v2_ledger"("id") ON DELETE cascade,
  CONSTRAINT "v2_idempotency_keys_pk" PRIMARY KEY ("ledger_id", "key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_idempotency_keys_created_idx"
  ON "v2_idempotency_keys" ("created_at");
