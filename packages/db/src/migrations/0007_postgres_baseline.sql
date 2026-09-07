CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text NOT NULL,
	"household_id" text NOT NULL,
	"currency" text NOT NULL,
	"budget_period" text NOT NULL,
	"source_envelope_id" text,
	"destination_envelope_id" text,
	"amount_minor" integer NOT NULL,
	"reverses_assignment_id" text,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "assignments_amount_positive" CHECK ("assignments"."amount_minor" > 0),
	CONSTRAINT "assignments_has_endpoint" CHECK ("assignments"."source_envelope_id" IS NOT NULL OR "assignments"."destination_envelope_id" IS NOT NULL),
	CONSTRAINT "assignments_distinct_endpoints" CHECK ("assignments"."source_envelope_id" IS NULL OR "assignments"."destination_envelope_id" IS NULL OR "assignments"."source_envelope_id" <> "assignments"."destination_envelope_id"),
	CONSTRAINT "assignments_budget_period_period_format" CHECK ("assignments"."budget_period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "budget_workspaces" (
	"household_id" text NOT NULL,
	"currency" text NOT NULL,
	"activation_period" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_workspaces_household_id_currency_pk" PRIMARY KEY("household_id","currency"),
	CONSTRAINT "budget_workspaces_activation_period_format" CHECK ("budget_workspaces"."activation_period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "category_mappings" (
	"household_id" text NOT NULL,
	"category_id" text NOT NULL,
	"envelope_id" text,
	"effective_from_period" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_mappings_household_id_category_id_effective_from_period_pk" PRIMARY KEY("household_id","category_id","effective_from_period"),
	CONSTRAINT "period_effective_from_period_format" CHECK ("category_mappings"."effective_from_period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "envelopes" (
	"id" text NOT NULL,
	"household_id" text NOT NULL,
	"currency" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "envelopes_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "envelopes_lifecycle_valid" CHECK ("envelopes"."lifecycle" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "funding_memberships" (
	"household_id" text NOT NULL,
	"account_id" text NOT NULL,
	"currency" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"effective_from_period" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "funding_memberships_household_id_account_id_effective_from_period_pk" PRIMARY KEY("household_id","account_id","effective_from_period"),
	CONSTRAINT "period_effective_from_period_format" CHECK ("funding_memberships"."effective_from_period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "period_projection_cache" (
	"household_id" text NOT NULL,
	"currency" text NOT NULL,
	"budget_period" text NOT NULL,
	"projection_json" jsonb NOT NULL,
	"seq_stamped" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "period_projection_cache_household_id_currency_budget_period_pk" PRIMARY KEY("household_id","currency","budget_period")
);
--> statement-breakpoint
CREATE TABLE "refund_links" (
	"id" text NOT NULL,
	"household_id" text NOT NULL,
	"original_transaction_id" text NOT NULL,
	"refund_transaction_id" text NOT NULL,
	"currency" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_links_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "refund_links_amount_positive" CHECK ("refund_links"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "rollover_settings" (
	"household_id" text NOT NULL,
	"envelope_id" text NOT NULL,
	"positive_rollover" boolean DEFAULT true NOT NULL,
	"effective_from_period" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rollover_settings_household_id_envelope_id_effective_from_period_pk" PRIMARY KEY("household_id","envelope_id","effective_from_period"),
	CONSTRAINT "period_effective_from_period_format" CHECK ("rollover_settings"."effective_from_period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "command_results" (
	"household_id" text NOT NULL,
	"command_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "command_results_household_id_command_id_pk" PRIMARY KEY("household_id","command_id")
);
--> statement-breakpoint
CREATE TABLE "household_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"seq" integer NOT NULL,
	"user_id" text NOT NULL,
	"command_id" text NOT NULL,
	"effects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_pipeline_assertions" (
	"id" text PRIMARY KEY NOT NULL,
	"ok" integer NOT NULL,
	CONSTRAINT "pipeline_assertion_ok_true" CHECK ("_pipeline_assertions"."ok" = 1)
);
--> statement-breakpoint
CREATE TABLE "household" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"household_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"single_use" boolean DEFAULT true NOT NULL,
	"used_by_user_id" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"household_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"household_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"color" text DEFAULT '#FF6B6B' NOT NULL,
	"icon" text DEFAULT '🏷️' NOT NULL,
	"parent_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"lifecycle_changed_at" timestamp with time zone,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "categories_lifecycle_valid" CHECK ("categories"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "categories_type_valid" CHECK ("categories"."type" IN ('income', 'expense'))
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"household_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"color" text DEFAULT '#4A90D9' NOT NULL,
	"icon" text DEFAULT 'banknote.fill' NOT NULL,
	"initial_balance_minor" integer DEFAULT 0 NOT NULL,
	"exclude_from_total" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"lifecycle_changed_at" timestamp with time zone,
	"visibility" text DEFAULT 'public' NOT NULL,
	"owner_user_id" text,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "accounts_lifecycle_valid" CHECK ("accounts"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "accounts_type_valid" CHECK ("accounts"."type" IN ('cash', 'bank', 'card')),
	CONSTRAINT "accounts_private_owner_required" CHECK ("accounts"."visibility" = 'public' OR "accounts"."owner_user_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"household_id" text NOT NULL,
	"id" text NOT NULL,
	"type" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"original_amount_minor" integer,
	"original_currency" text,
	"exchange_rate" integer,
	"date" text NOT NULL,
	"account_id" text NOT NULL,
	"to_account_id" text,
	"category_id" text,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_rule_id" text,
	"description" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "transactions_type_valid" CHECK ("transactions"."type" IN ('expense', 'income', 'transfer')),
	CONSTRAINT "transactions_amount_positive" CHECK ("transactions"."amount_minor" > 0),
	CONSTRAINT "transactions_date_shape" CHECK ("transactions"."date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
	CONSTRAINT "transactions_transfer_shape" CHECK (("transactions"."type" = 'transfer' AND "transactions"."to_account_id" IS NOT NULL AND "transactions"."category_id" IS NULL AND "transactions"."account_id" <> "transactions"."to_account_id")
        OR ("transactions"."type" <> 'transfer' AND "transactions"."to_account_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "recurring_occurrences" (
	"household_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"scheduled_date" text NOT NULL,
	"transaction_id" text,
	"settled_at" timestamp with time zone NOT NULL,
	CONSTRAINT "recurring_occurrences_household_id_rule_id_scheduled_date_pk" PRIMARY KEY("household_id","rule_id","scheduled_date")
);
--> statement-breakpoint
CREATE TABLE "recurring_rules" (
	"household_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"amount_minor" integer,
	"currency" text NOT NULL,
	"account_id" text,
	"to_account_id" text,
	"category_id" text,
	"description" text DEFAULT '' NOT NULL,
	"frequency" text NOT NULL,
	"interval_count" integer DEFAULT 1 NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"end_count" integer,
	"time_zone" text NOT NULL,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"health" text DEFAULT 'ready' NOT NULL,
	"attention_reasons" text DEFAULT '[]' NOT NULL,
	"attention_details" text,
	"eligibility_floor" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"lifecycle_changed_at" timestamp with time zone,
	"health_changed_at" timestamp with time zone,
	"last_settlement_attempt_at" timestamp with time zone,
	"last_settlement_error" text,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_rules_household_id_id_pk" PRIMARY KEY("household_id","id"),
	CONSTRAINT "recurring_rules_lifecycle_valid" CHECK ("recurring_rules"."lifecycle" IN ('active', 'paused', 'completed', 'archived')),
	CONSTRAINT "recurring_rules_health_valid" CHECK ("recurring_rules"."health" IN ('ready', 'needs_attention'))
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_workspaces" ADD CONSTRAINT "budget_workspaces_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_workspaces" ADD CONSTRAINT "budget_workspaces_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_workspaces" ADD CONSTRAINT "budget_workspaces_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mappings" ADD CONSTRAINT "category_mappings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_memberships" ADD CONSTRAINT "funding_memberships_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_memberships" ADD CONSTRAINT "funding_memberships_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_memberships" ADD CONSTRAINT "funding_memberships_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_projection_cache" ADD CONSTRAINT "period_projection_cache_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_links" ADD CONSTRAINT "refund_links_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_links" ADD CONSTRAINT "refund_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_links" ADD CONSTRAINT "refund_links_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rollover_settings" ADD CONSTRAINT "rollover_settings_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rollover_settings" ADD CONSTRAINT "rollover_settings_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rollover_settings" ADD CONSTRAINT "rollover_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_results" ADD CONSTRAINT "command_results_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_changes" ADD CONSTRAINT "household_changes_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_changes" ADD CONSTRAINT "household_changes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household" ADD CONSTRAINT "household_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_code" ADD CONSTRAINT "invite_code_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_code" ADD CONSTRAINT "invite_code_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_code" ADD CONSTRAINT "invite_code_used_by_user_id_user_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_account_id_accounts_household_id_id_fk" FOREIGN KEY ("household_id","account_id") REFERENCES "public"."accounts"("household_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_to_account_id_accounts_household_id_id_fk" FOREIGN KEY ("household_id","to_account_id") REFERENCES "public"."accounts"("household_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_category_id_categories_household_id_id_fk" FOREIGN KEY ("household_id","category_id") REFERENCES "public"."categories"("household_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_occurrences" ADD CONSTRAINT "recurring_occurrences_household_id_rule_id_recurring_rules_household_id_id_fk" FOREIGN KEY ("household_id","rule_id") REFERENCES "public"."recurring_rules"("household_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "assignments_household_period_idx" ON "assignments" USING btree ("household_id","budget_period");--> statement-breakpoint
CREATE INDEX "category_mappings_household_category_idx" ON "category_mappings" USING btree ("household_id","category_id");--> statement-breakpoint
CREATE INDEX "envelopes_household_currency_idx" ON "envelopes" USING btree ("household_id","currency");--> statement-breakpoint
CREATE INDEX "funding_memberships_household_currency_idx" ON "funding_memberships" USING btree ("household_id","currency");--> statement-breakpoint
CREATE UNIQUE INDEX "refund_links_refund_once" ON "refund_links" USING btree ("refund_transaction_id");--> statement-breakpoint
CREATE INDEX "refund_links_original_idx" ON "refund_links" USING btree ("original_transaction_id");--> statement-breakpoint
CREATE INDEX "rollover_settings_household_envelope_idx" ON "rollover_settings" USING btree ("household_id","envelope_id");--> statement-breakpoint
CREATE UNIQUE INDEX "household_changes_household_seq_unique" ON "household_changes" USING btree ("household_id","seq");--> statement-breakpoint
CREATE UNIQUE INDEX "household_changes_household_command_unique" ON "household_changes" USING btree ("household_id","command_id");--> statement-breakpoint
CREATE INDEX "household_changes_commandId_idx" ON "household_changes" USING btree ("command_id");--> statement-breakpoint
CREATE INDEX "invite_code_householdId_idx" ON "invite_code" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_household_user_unique" ON "membership" USING btree ("household_id","user_id");--> statement-breakpoint
CREATE INDEX "membership_userId_idx" ON "membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_household_lifecycle_idx" ON "categories" USING btree ("household_id","lifecycle");--> statement-breakpoint
CREATE INDEX "accounts_household_lifecycle_idx" ON "accounts" USING btree ("household_id","lifecycle");--> statement-breakpoint
CREATE INDEX "accounts_household_visibility_owner_idx" ON "accounts" USING btree ("household_id","visibility","owner_user_id");--> statement-breakpoint
CREATE INDEX "transactions_household_date_idx" ON "transactions" USING btree ("household_id","date");--> statement-breakpoint
CREATE INDEX "transactions_household_account_idx" ON "transactions" USING btree ("household_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_recurring_occurrence_transaction" ON "recurring_occurrences" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "recurring_occurrences_rule_idx" ON "recurring_occurrences" USING btree ("household_id","rule_id");--> statement-breakpoint
CREATE INDEX "recurring_rules_household_lifecycle_idx" ON "recurring_rules" USING btree ("household_id","lifecycle");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION reject_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER category_mappings_append_only_update BEFORE UPDATE ON category_mappings FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER category_mappings_append_only_delete BEFORE DELETE ON category_mappings FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER funding_memberships_append_only_update BEFORE UPDATE ON funding_memberships FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER funding_memberships_append_only_delete BEFORE DELETE ON funding_memberships FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER rollover_settings_append_only_update BEFORE UPDATE ON rollover_settings FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER rollover_settings_append_only_delete BEFORE DELETE ON rollover_settings FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER assignments_append_only_update BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
CREATE TRIGGER assignments_append_only_delete BEFORE DELETE ON assignments FOR EACH ROW EXECUTE FUNCTION reject_append_only();
--> statement-breakpoint
INSERT INTO "user" ("id", "name", "email", "email_verified")
VALUES ('user-system-settlement', 'Settlement Scheduler', 'system@settlement.local', true)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
DO $$ BEGIN
  CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
GRANT SELECT ON TABLE public.membership, public.accounts, public.categories, public.transactions TO powersync_role;
--> statement-breakpoint
DO $$ BEGIN
  CREATE PUBLICATION powersync FOR TABLE public.membership, public.accounts, public.categories, public.transactions;
EXCEPTION WHEN duplicate_object THEN
  ALTER PUBLICATION powersync SET TABLE public.membership, public.accounts, public.categories, public.transactions;
END $$;
