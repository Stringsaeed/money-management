CREATE TABLE IF NOT EXISTS "household_change_sequences" (
  "household_id" text PRIMARY KEY NOT NULL,
  "seq" integer NOT NULL,
  CONSTRAINT "household_change_sequences_household_id_household_id_fk"
    FOREIGN KEY ("household_id") REFERENCES "public"."household"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
INSERT INTO "household_change_sequences" ("household_id", "seq")
SELECT "household_id", MAX("seq")
FROM "household_changes"
GROUP BY "household_id"
ON CONFLICT ("household_id") DO UPDATE
SET "seq" = GREATEST("household_change_sequences"."seq", excluded."seq");
