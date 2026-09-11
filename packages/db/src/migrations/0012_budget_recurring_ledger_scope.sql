ALTER TABLE "budget_workspaces" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "envelopes" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "category_mappings" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "funding_memberships" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "rollover_settings" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "refund_links" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "period_projection_cache" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "recurring_rules" ADD COLUMN IF NOT EXISTS "ledger_id" text;
ALTER TABLE "recurring_occurrences" ADD COLUMN IF NOT EXISTS "ledger_id" text;
--> statement-breakpoint
UPDATE "budget_workspaces" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "envelopes" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "category_mappings" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "funding_memberships" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "rollover_settings" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "assignments" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "refund_links" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "period_projection_cache" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "recurring_rules" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
UPDATE "recurring_occurrences" SET "ledger_id" = "household_id" WHERE "ledger_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "budget_workspaces" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "envelopes" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "category_mappings" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "funding_memberships" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "rollover_settings" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "assignments" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "refund_links" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "period_projection_cache" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "recurring_rules" ALTER COLUMN "ledger_id" SET NOT NULL;
ALTER TABLE "recurring_occurrences" ALTER COLUMN "ledger_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "budget_workspaces" ADD CONSTRAINT "budget_workspaces_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "funding_memberships" ADD CONSTRAINT "funding_memberships_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "rollover_settings" ADD CONSTRAINT "rollover_settings_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "refund_links" ADD CONSTRAINT "refund_links_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "period_projection_cache" ADD CONSTRAINT "period_projection_cache_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_ledger_id_ledger_id_fk"
  FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_ledger_id_id_unique" UNIQUE("ledger_id", "id");
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_ledger_id_id_unique" UNIQUE("ledger_id", "id");
ALTER TABLE "refund_links" ADD CONSTRAINT "refund_links_ledger_id_id_unique" UNIQUE("ledger_id", "id");
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_ledger_id_id_unique" UNIQUE("ledger_id", "id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "budget_workspaces_ledger_currency_unique"
  ON "budget_workspaces" USING btree ("ledger_id", "currency");
CREATE UNIQUE INDEX IF NOT EXISTS "category_mappings_ledger_category_period_unique"
  ON "category_mappings" USING btree ("ledger_id", "category_id", "effective_from_period");
CREATE UNIQUE INDEX IF NOT EXISTS "funding_memberships_ledger_account_period_unique"
  ON "funding_memberships" USING btree ("ledger_id", "account_id", "effective_from_period");
CREATE UNIQUE INDEX IF NOT EXISTS "rollover_settings_ledger_envelope_period_unique"
  ON "rollover_settings" USING btree ("ledger_id", "envelope_id", "effective_from_period");
CREATE UNIQUE INDEX IF NOT EXISTS "recurring_occurrences_ledger_rule_date_unique"
  ON "recurring_occurrences" USING btree ("ledger_id", "rule_id", "scheduled_date");
--> statement-breakpoint
ALTER TABLE "category_mappings"
  ADD CONSTRAINT "category_mappings_ledger_id_envelope_id_envelopes_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "envelope_id") REFERENCES "public"."envelopes"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "category_mappings"
  ADD CONSTRAINT "category_mappings_ledger_id_category_id_categories_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "category_id") REFERENCES "public"."categories"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "funding_memberships"
  ADD CONSTRAINT "funding_memberships_ledger_id_account_id_accounts_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "account_id") REFERENCES "public"."accounts"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "rollover_settings"
  ADD CONSTRAINT "rollover_settings_ledger_id_envelope_id_envelopes_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "envelope_id") REFERENCES "public"."envelopes"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_ledger_id_source_envelope_id_envelopes_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "source_envelope_id") REFERENCES "public"."envelopes"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_ledger_id_destination_envelope_id_envelopes_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "destination_envelope_id") REFERENCES "public"."envelopes"("ledger_id", "id")
  ON DELETE no action ON UPDATE no action;
ALTER TABLE "recurring_occurrences"
  ADD CONSTRAINT "recurring_occurrences_ledger_id_rule_id_recurring_rules_ledger_id_id_fk"
  FOREIGN KEY ("ledger_id", "rule_id") REFERENCES "public"."recurring_rules"("ledger_id", "id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "envelopes_ledger_currency_idx" ON "envelopes" USING btree ("ledger_id", "currency");
CREATE INDEX IF NOT EXISTS "assignments_ledger_period_idx" ON "assignments" USING btree ("ledger_id", "budget_period");
CREATE INDEX IF NOT EXISTS "category_mappings_ledger_category_idx" ON "category_mappings" USING btree ("ledger_id", "category_id");
CREATE INDEX IF NOT EXISTS "funding_memberships_ledger_currency_idx" ON "funding_memberships" USING btree ("ledger_id", "currency");
CREATE INDEX IF NOT EXISTS "rollover_settings_ledger_envelope_idx" ON "rollover_settings" USING btree ("ledger_id", "envelope_id");
CREATE INDEX IF NOT EXISTS "recurring_rules_ledger_lifecycle_idx" ON "recurring_rules" USING btree ("ledger_id", "lifecycle");
CREATE INDEX IF NOT EXISTS "recurring_occurrences_ledger_rule_idx" ON "recurring_occurrences" USING btree ("ledger_id", "rule_id");
--> statement-breakpoint
ALTER TABLE "period_projection_cache" DROP CONSTRAINT IF EXISTS "period_projection_cache_household_id_currency_budget_period_pk";
ALTER TABLE "period_projection_cache"
  ADD CONSTRAINT "period_projection_cache_ledger_id_currency_budget_period_pk"
  PRIMARY KEY("ledger_id", "currency", "budget_period");
--> statement-breakpoint
ALTER TABLE "budget_workspaces" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "envelopes" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "category_mappings" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "funding_memberships" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "rollover_settings" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "assignments" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "refund_links" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "period_projection_cache" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "recurring_rules" ALTER COLUMN "household_id" DROP NOT NULL;
ALTER TABLE "recurring_occurrences" ALTER COLUMN "household_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "budget_workspaces" ADD CONSTRAINT "budget_workspaces_household_required_for_organization"
  CHECK ("budget_workspaces"."household_id" IS NOT NULL OR "budget_workspaces"."ledger_id" LIKE 'personal:%');
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_household_required_for_organization"
  CHECK ("envelopes"."household_id" IS NOT NULL OR "envelopes"."ledger_id" LIKE 'personal:%');
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_household_required_for_organization"
  CHECK ("category_mappings"."household_id" IS NOT NULL OR "category_mappings"."ledger_id" LIKE 'personal:%');
ALTER TABLE "funding_memberships" ADD CONSTRAINT "funding_memberships_household_required_for_organization"
  CHECK ("funding_memberships"."household_id" IS NOT NULL OR "funding_memberships"."ledger_id" LIKE 'personal:%');
ALTER TABLE "rollover_settings" ADD CONSTRAINT "rollover_settings_household_required_for_organization"
  CHECK ("rollover_settings"."household_id" IS NOT NULL OR "rollover_settings"."ledger_id" LIKE 'personal:%');
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_household_required_for_organization"
  CHECK ("assignments"."household_id" IS NOT NULL OR "assignments"."ledger_id" LIKE 'personal:%');
ALTER TABLE "refund_links" ADD CONSTRAINT "refund_links_household_required_for_organization"
  CHECK ("refund_links"."household_id" IS NOT NULL OR "refund_links"."ledger_id" LIKE 'personal:%');
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_household_required_for_organization"
  CHECK ("recurring_rules"."household_id" IS NOT NULL OR "recurring_rules"."ledger_id" LIKE 'personal:%');
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_household_required_for_organization"
  CHECK ("recurring_occurrences"."household_id" IS NOT NULL OR "recurring_occurrences"."ledger_id" LIKE 'personal:%');
ALTER TABLE "period_projection_cache" ADD CONSTRAINT "period_projection_cache_household_required_for_organization"
  CHECK ("period_projection_cache"."household_id" IS NOT NULL OR "period_projection_cache"."ledger_id" LIKE 'personal:%');
