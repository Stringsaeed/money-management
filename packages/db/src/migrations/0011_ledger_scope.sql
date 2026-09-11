CREATE TABLE IF NOT EXISTS "ledger" (
  "id" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "personal_user_id" text,
  "organization_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ledger_personal_user_id_unique" UNIQUE("personal_user_id"),
  CONSTRAINT "ledger_personal_user_id_user_id_fk"
    FOREIGN KEY ("personal_user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ledger_kind_valid" CHECK ("ledger"."kind" IN ('personal', 'organization')),
  CONSTRAINT "ledger_owner_matches_kind" CHECK (
    ("ledger"."kind" = 'personal'
      AND "ledger"."personal_user_id" IS NOT NULL
      AND "ledger"."organization_id" IS NULL
      AND "ledger"."id" = 'personal:' || "ledger"."personal_user_id")
    OR ("ledger"."kind" = 'organization'
      AND "ledger"."organization_id" IS NOT NULL
      AND "ledger"."personal_user_id" IS NULL
      AND "ledger"."id" = "ledger"."organization_id"
      AND "ledger"."id" NOT LIKE 'personal:%')
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ledger_organization_idx" ON "ledger" USING btree ("organization_id");
--> statement-breakpoint
INSERT INTO "ledger" ("id", "kind", "organization_id", "created_at", "updated_at")
SELECT "id", 'organization', "id", "created_at", "updated_at"
FROM "household"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION mirror_household_organization_ledger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM "ledger" WHERE "id" = OLD."id" AND "kind" = 'organization';
    RETURN OLD;
  END IF;
  INSERT INTO "ledger" ("id", "kind", "organization_id", "created_at", "updated_at")
  VALUES (NEW."id", 'organization', NEW."id", NEW."created_at", NEW."created_at")
  ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS household_mirror_ledger_insert ON "household";
CREATE TRIGGER household_mirror_ledger_insert AFTER INSERT ON "household"
  FOR EACH ROW EXECUTE FUNCTION mirror_household_organization_ledger();
DROP TRIGGER IF EXISTS household_mirror_ledger_delete ON "household";
CREATE TRIGGER household_mirror_ledger_delete AFTER DELETE ON "household"
  FOR EACH ROW EXECUTE FUNCTION mirror_household_organization_ledger();
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "household_changes" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "command_results" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "household_change_sequences" ADD COLUMN IF NOT EXISTS "ledger_id" text;
--> statement-breakpoint
UPDATE "accounts" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "categories" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "transactions" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "household_changes" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "command_results" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "household_change_sequences" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "household_changes" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "command_results" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "household_change_sequences" ALTER COLUMN "ledger_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "categories" ADD CONSTRAINT "categories_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "household_changes" ADD CONSTRAINT "household_changes_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "command_results" ADD CONSTRAINT "command_results_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "household_change_sequences" ADD CONSTRAINT "household_change_sequences_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ledger_id_id_unique" UNIQUE("ledger_id", "id");
ALTER TABLE "categories" ADD CONSTRAINT "categories_ledger_id_id_unique" UNIQUE("ledger_id", "id");
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledger_id_account_id_accounts_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "account_id") REFERENCES "public"."accounts"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledger_id_to_account_id_accounts_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "to_account_id") REFERENCES "public"."accounts"("ledger_id", "id")
  ON DELETE set null ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledger_id_category_id_categories_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "category_id") REFERENCES "public"."categories"("ledger_id", "id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_ledger_lifecycle_idx" ON "accounts" USING btree ("ledger_id", "lifecycle");
CREATE INDEX IF NOT EXISTS "categories_ledger_lifecycle_idx" ON "categories" USING btree ("ledger_id", "lifecycle");
CREATE INDEX IF NOT EXISTS "transactions_ledger_date_idx" ON "transactions" USING btree ("ledger_id", "date");
CREATE INDEX IF NOT EXISTS "transactions_ledger_account_idx" ON "transactions" USING btree ("ledger_id", "account_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "household_changes_ledger_seq_unique" ON "household_changes" USING btree ("ledger_id", "seq");
CREATE UNIQUE INDEX IF NOT EXISTS "household_changes_ledger_command_unique" ON "household_changes" USING btree ("ledger_id", "command_id");
--> statement-breakpoint
ALTER TABLE "command_results" DROP CONSTRAINT IF EXISTS "command_results_household_id_command_id_pk";
ALTER TABLE "command_results" ADD CONSTRAINT "command_results_ledger_id_command_id_pk" PRIMARY KEY("ledger_id", "command_id");
--> statement-breakpoint
ALTER TABLE "household_change_sequences" DROP CONSTRAINT IF EXISTS "household_change_sequences_pkey";
ALTER TABLE "household_change_sequences" ADD CONSTRAINT "household_change_sequences_ledger_id_pk" PRIMARY KEY("ledger_id");
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "household_changes" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "command_results" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "household_change_sequences" ALTER COLUMN "household_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_household_required_for_organization"
  CHECK ("accounts"."household_id" IS NOT NULL OR "accounts"."ledger_id" LIKE 'personal:%');
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_required_for_organization"
  CHECK ("categories"."household_id" IS NOT NULL OR "categories"."ledger_id" LIKE 'personal:%');
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_required_for_organization"
  CHECK ("transactions"."household_id" IS NOT NULL OR "transactions"."ledger_id" LIKE 'personal:%');
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'powersync_role') THEN
    GRANT SELECT ON TABLE public.ledger TO powersync_role;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    ALTER PUBLICATION powersync SET TABLE
      public.membership,
      public.ledger,
      public.accounts,
      public.categories,
      public.transactions,
      public.budget_workspaces,
      public.envelopes,
      public.category_mappings,
      public.funding_memberships,
      public.rollover_settings,
      public.assignments,
      public.refund_links,
      public.recurring_rules,
      public.recurring_occurrences;
  END IF;
END $$;
