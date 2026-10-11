DROP INDEX "v2_budgets_ledger_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_budgets_ledger_currency_unique" ON "v2_budgets" USING btree ("ledger_id","currency");
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_envelopes_ledger_budget_id_unique" ON "v2_envelopes" USING btree ("ledger_id","budget_id","id");
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" ADD COLUMN "budget_id" text;
--> statement-breakpoint
UPDATE "v2_envelope_categories" SET "budget_id" = "v2_envelopes"."budget_id" FROM "v2_envelopes" WHERE "v2_envelopes"."ledger_id" = "v2_envelope_categories"."ledger_id" AND "v2_envelopes"."id" = "v2_envelope_categories"."envelope_id";
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" ALTER COLUMN "budget_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" DROP CONSTRAINT "v2_envelope_categories_envelope_fk";
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" ADD CONSTRAINT "v2_envelope_categories_envelope_fk" FOREIGN KEY ("ledger_id","budget_id","envelope_id") REFERENCES "public"."v2_envelopes"("ledger_id","budget_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX "v2_envelope_categories_ledger_category_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_envelope_categories_budget_category_unique" ON "v2_envelope_categories" USING btree ("budget_id","category_id");
--> statement-breakpoint
CREATE INDEX "v2_envelope_categories_ledger_category_idx" ON "v2_envelope_categories" USING btree ("ledger_id","category_id");
