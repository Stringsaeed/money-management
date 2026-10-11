ALTER TABLE "v2_recurring_rules" ADD COLUMN "mode" text DEFAULT 'auto_post' NOT NULL;
--> statement-breakpoint
ALTER TABLE "v2_recurring_rules" ADD CONSTRAINT "v2_recurring_rules_mode_valid" CHECK ("v2_recurring_rules"."mode" IN ('auto_post', 'remind'));
--> statement-breakpoint
ALTER TABLE "v2_recurring_occurrences" ADD COLUMN "status" text DEFAULT 'settled' NOT NULL;
--> statement-breakpoint
ALTER TABLE "v2_recurring_occurrences" ADD CONSTRAINT "v2_recurring_occurrences_status_shape" CHECK ("v2_recurring_occurrences"."status" = 'settled' OR ("v2_recurring_occurrences"."status" = 'skipped' AND "v2_recurring_occurrences"."transaction_id" IS NULL));
