CREATE TABLE IF NOT EXISTS "v2_ai_usage" (
  "subject" text NOT NULL,
  "bucket" text NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "v2_ai_usage_pk" PRIMARY KEY ("subject", "bucket")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "v2_ai_usage_expires_idx" ON "v2_ai_usage" ("expires_at");
