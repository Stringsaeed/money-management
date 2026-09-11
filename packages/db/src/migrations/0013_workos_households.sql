-- Households are WorkOS Organizations; Membership is a projection derived from
-- verified WorkOS events plus bootstrap reads (ADR 0027).
ALTER TABLE "membership" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "membership" ADD COLUMN IF NOT EXISTS "observed_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "membership" ADD COLUMN IF NOT EXISTS "observed_event_id" text;
--> statement-breakpoint
UPDATE "membership" SET "role" = 'admin' WHERE "role" = 'owner';
--> statement-breakpoint
ALTER TABLE "membership" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "membership" DROP COLUMN IF EXISTS "version";
--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_status_valid"
  CHECK ("membership"."status" IN ('active', 'inactive', 'pending'));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_household_status_idx" ON "membership" USING btree ("household_id", "status");
--> statement-breakpoint
DROP TABLE IF EXISTS "invite_code";
--> statement-breakpoint
DROP TRIGGER IF EXISTS household_mirror_ledger_insert ON "household";
DROP TRIGGER IF EXISTS household_mirror_ledger_delete ON "household";
DROP FUNCTION IF EXISTS mirror_household_organization_ledger();
--> statement-breakpoint
ALTER TABLE "household" DROP CONSTRAINT IF EXISTS "household_created_by_user_id_user_id_fk";
ALTER TABLE "household" ALTER COLUMN "created_by_user_id" DROP NOT NULL;
ALTER TABLE "household" ADD CONSTRAINT "household_created_by_user_id_user_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "create_request_id" text;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "members_reconciled_at" timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS "household_creator_request_unique"
  ON "household" USING btree ("created_by_user_id", "create_request_id");
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "memberships_reconciled_at" timestamp with time zone;
--> statement-breakpoint
-- Organization-ledger Accounts are Household facts. Personal Ledgers retain
-- private Account support, but no Household Account may be hidden from Members.
UPDATE "accounts" SET "visibility" = 'public' WHERE "household_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organization_accounts_shared"
  CHECK ("accounts"."household_id" IS NULL OR "accounts"."visibility" = 'public');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "widget_handoff" (
  "code_hash" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "organization_id" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "widget_handoff_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "widget_handoff_organization_id_household_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "widget_handoff_expires_idx" ON "widget_handoff" USING btree ("expires_at");
