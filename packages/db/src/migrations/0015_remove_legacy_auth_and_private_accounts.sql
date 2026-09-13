DROP TABLE IF EXISTS "session" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "account" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "verification" CASCADE;--> statement-breakpoint
UPDATE "accounts" SET "visibility" = 'public' WHERE "visibility" = 'private';--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_private_owner_required";--> statement-breakpoint
DROP INDEX IF EXISTS "accounts_household_visibility_owner_idx";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "visibility";
