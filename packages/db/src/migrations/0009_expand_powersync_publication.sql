ALTER TABLE "budget_workspaces" ADD COLUMN IF NOT EXISTS "id" text;
--> statement-breakpoint
ALTER TABLE "category_mappings" ADD COLUMN IF NOT EXISTS "id" text;
--> statement-breakpoint
ALTER TABLE "funding_memberships" ADD COLUMN IF NOT EXISTS "id" text;
--> statement-breakpoint
ALTER TABLE "rollover_settings" ADD COLUMN IF NOT EXISTS "id" text;
--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD COLUMN IF NOT EXISTS "id" text;
--> statement-breakpoint
UPDATE "budget_workspaces"
SET "id" = 'workspace:' || md5("household_id" || ':' || "currency")
WHERE "id" IS NULL;
--> statement-breakpoint
UPDATE "category_mappings"
SET "id" = 'mapping:' || md5("household_id" || ':' || "category_id" || ':' || "effective_from_period")
WHERE "id" IS NULL;
--> statement-breakpoint
UPDATE "funding_memberships"
SET "id" = 'funding:' || md5("household_id" || ':' || "account_id" || ':' || "effective_from_period")
WHERE "id" IS NULL;
--> statement-breakpoint
UPDATE "rollover_settings"
SET "id" = 'rollover:' || md5("household_id" || ':' || "envelope_id" || ':' || "effective_from_period")
WHERE "id" IS NULL;
--> statement-breakpoint
UPDATE "recurring_occurrences"
SET "id" = 'occurrence:' || md5("household_id" || ':' || "rule_id" || ':' || "scheduled_date")
WHERE "id" IS NULL;
--> statement-breakpoint
ALTER TABLE "budget_workspaces" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "budget_workspaces" ALTER COLUMN "id" SET DEFAULT md5(random()::text || clock_timestamp()::text);
ALTER TABLE "category_mappings" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "category_mappings" ALTER COLUMN "id" SET DEFAULT md5(random()::text || clock_timestamp()::text);
ALTER TABLE "funding_memberships" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "funding_memberships" ALTER COLUMN "id" SET DEFAULT md5(random()::text || clock_timestamp()::text);
ALTER TABLE "rollover_settings" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "rollover_settings" ALTER COLUMN "id" SET DEFAULT md5(random()::text || clock_timestamp()::text);
ALTER TABLE "recurring_occurrences" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "recurring_occurrences" ALTER COLUMN "id" SET DEFAULT md5(random()::text || clock_timestamp()::text);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT id FROM envelopes GROUP BY id HAVING count(*) > 1)
    OR EXISTS (SELECT id FROM assignments GROUP BY id HAVING count(*) > 1)
    OR EXISTS (SELECT id FROM refund_links GROUP BY id HAVING count(*) > 1)
    OR EXISTS (SELECT id FROM recurring_rules GROUP BY id HAVING count(*) > 1)
  THEN
    RAISE EXCEPTION 'PowerSync requires globally unique ids; duplicate domain ids must be repaired before migration 0009';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "recurring_occurrences" DROP CONSTRAINT IF EXISTS "recurring_occurrences_household_id_rule_id_recurring_rules_household_id_id_fk";
--> statement-breakpoint
ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_household_id_id_pk";
ALTER TABLE "budget_workspaces" DROP CONSTRAINT IF EXISTS "budget_workspaces_household_id_currency_pk";
ALTER TABLE "category_mappings" DROP CONSTRAINT IF EXISTS "category_mappings_household_id_category_id_effective_from_period_pk";
ALTER TABLE "envelopes" DROP CONSTRAINT IF EXISTS "envelopes_household_id_id_pk";
ALTER TABLE "funding_memberships" DROP CONSTRAINT IF EXISTS "funding_memberships_household_id_account_id_effective_from_period_pk";
ALTER TABLE "refund_links" DROP CONSTRAINT IF EXISTS "refund_links_household_id_id_pk";
ALTER TABLE "rollover_settings" DROP CONSTRAINT IF EXISTS "rollover_settings_household_id_envelope_id_effective_from_period_pk";
ALTER TABLE "recurring_occurrences" DROP CONSTRAINT IF EXISTS "recurring_occurrences_household_id_rule_id_scheduled_date_pk";
ALTER TABLE "recurring_rules" DROP CONSTRAINT IF EXISTS "recurring_rules_household_id_id_pk";
--> statement-breakpoint
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'assignments',
    'budget_workspaces',
    'category_mappings',
    'envelopes',
    'funding_memberships',
    'refund_links',
    'rollover_settings',
    'recurring_occurrences',
    'recurring_rules'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = format('public.%I', table_name)::regclass
        AND contype = 'p'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I PRIMARY KEY (id)', table_name, table_name || '_pkey');
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "assignments_household_id_unique" ON "assignments" ("household_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "budget_workspaces_household_currency_unique" ON "budget_workspaces" ("household_id", "currency");
CREATE UNIQUE INDEX IF NOT EXISTS "category_mappings_household_category_period_unique" ON "category_mappings" ("household_id", "category_id", "effective_from_period");
CREATE UNIQUE INDEX IF NOT EXISTS "envelopes_household_id_unique" ON "envelopes" ("household_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "funding_memberships_household_account_period_unique" ON "funding_memberships" ("household_id", "account_id", "effective_from_period");
CREATE UNIQUE INDEX IF NOT EXISTS "refund_links_household_id_unique" ON "refund_links" ("household_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "rollover_settings_household_envelope_period_unique" ON "rollover_settings" ("household_id", "envelope_id", "effective_from_period");
CREATE UNIQUE INDEX IF NOT EXISTS "recurring_occurrences_household_rule_date_unique" ON "recurring_occurrences" ("household_id", "rule_id", "scheduled_date");
CREATE UNIQUE INDEX IF NOT EXISTS "recurring_rules_household_id_unique" ON "recurring_rules" ("household_id", "id");
--> statement-breakpoint
ALTER TABLE "recurring_occurrences"
  ADD CONSTRAINT "recurring_occurrences_household_id_rule_id_recurring_rules_household_id_id_fk"
  FOREIGN KEY ("household_id", "rule_id")
  REFERENCES "public"."recurring_rules"("household_id", "id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'powersync_role') THEN
    GRANT SELECT ON TABLE
      public.budget_workspaces,
      public.envelopes,
      public.category_mappings,
      public.funding_memberships,
      public.rollover_settings,
      public.assignments,
      public.refund_links,
      public.recurring_rules,
      public.recurring_occurrences
    TO powersync_role;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    ALTER PUBLICATION powersync SET TABLE
      public.membership,
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
