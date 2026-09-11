CREATE TABLE IF NOT EXISTS "deletion_operation" (
  "id" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "target_id" text NOT NULL,
  "requested_by_user_id" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "cursor" integer DEFAULT 0 NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "deletion_operation_kind_valid" CHECK ("kind" IN ('user', 'household')),
  CONSTRAINT "deletion_operation_status_valid" CHECK ("status" IN ('pending', 'running', 'succeeded', 'failed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deletion_operation_target_idx" ON "deletion_operation" USING btree ("kind", "target_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deletion_operation_status_idx" ON "deletion_operation" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deleted_identity" (
  "id" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reason" text DEFAULT 'user_request' NOT NULL,
  CONSTRAINT "deleted_identity_kind_valid" CHECK ("kind" IN ('user', 'organization'))
);
