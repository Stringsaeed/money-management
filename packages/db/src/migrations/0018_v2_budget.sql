CREATE TABLE "v2_budgets" (
	"ledger_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"activation_period_start" text NOT NULL,
	"usual_salary_minor" bigint,
	"payday_reminder" boolean DEFAULT true NOT NULL,
	"default_account_id" text,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "v2_budgets_currency_valid" CHECK ("v2_budgets"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "v2_budgets_activation_start_valid" CHECK ("v2_budgets"."activation_period_start" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
	CONSTRAINT "v2_budgets_usual_salary_positive" CHECK ("v2_budgets"."usual_salary_minor" IS NULL OR "v2_budgets"."usual_salary_minor" BETWEEN 1 AND 9007199254740991)
);
--> statement-breakpoint
CREATE TABLE "v2_budget_paydays" (
	"ledger_id" text NOT NULL,
	"budget_id" text NOT NULL,
	"effective_from" text NOT NULL,
	"kind" text NOT NULL,
	"day" integer,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "v2_budget_paydays_budget_id_effective_from_pk" PRIMARY KEY("budget_id","effective_from"),
	CONSTRAINT "v2_budget_paydays_effective_from_valid" CHECK ("v2_budget_paydays"."effective_from" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
	CONSTRAINT "v2_budget_paydays_rule_valid" CHECK (("v2_budget_paydays"."kind" = 'day' AND "v2_budget_paydays"."day" BETWEEN 1 AND 28)
        OR ("v2_budget_paydays"."kind" = 'last_workday' AND "v2_budget_paydays"."day" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "v2_budget_funding_accounts" (
	"ledger_id" text NOT NULL,
	"budget_id" text NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "v2_budget_funding_accounts_budget_id_account_id_pk" PRIMARY KEY("budget_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "v2_envelopes" (
	"ledger_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"name" text NOT NULL,
	"group" text NOT NULL,
	"start_fresh" boolean DEFAULT false NOT NULL,
	"target_minor" bigint,
	"due_date" text,
	"repeat" text,
	"lifecycle" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "v2_envelopes_group_valid" CHECK ("v2_envelopes"."group" IN ('bills', 'everyday', 'saving')),
	CONSTRAINT "v2_envelopes_lifecycle_valid" CHECK ("v2_envelopes"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "v2_envelopes_target_positive" CHECK ("v2_envelopes"."target_minor" IS NULL OR "v2_envelopes"."target_minor" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "v2_envelopes_due_date_valid" CHECK ("v2_envelopes"."due_date" IS NULL OR "v2_envelopes"."due_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
	CONSTRAINT "v2_envelopes_repeat_valid" CHECK ("v2_envelopes"."repeat" IS NULL OR "v2_envelopes"."repeat" IN ('once', 'every_3_months', 'every_6_months', 'yearly'))
);
--> statement-breakpoint
CREATE TABLE "v2_envelope_categories" (
	"ledger_id" text NOT NULL,
	"envelope_id" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "v2_envelope_categories_envelope_id_category_id_pk" PRIMARY KEY("envelope_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "v2_assignments" (
	"ledger_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"period_start" text NOT NULL,
	"from_envelope_id" text,
	"to_envelope_id" text,
	"amount_minor" bigint NOT NULL,
	"reason" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "v2_assignments_period_start_valid" CHECK ("v2_assignments"."period_start" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
	CONSTRAINT "v2_assignments_amount_positive" CHECK ("v2_assignments"."amount_minor" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "v2_assignments_reason_valid" CHECK ("v2_assignments"."reason" IN ('plan', 'cover', 'move', 'leftover', 'repeat')),
	CONSTRAINT "v2_assignments_sides_valid" CHECK (("v2_assignments"."from_envelope_id" IS NOT NULL OR "v2_assignments"."to_envelope_id" IS NOT NULL)
        AND "v2_assignments"."from_envelope_id" IS DISTINCT FROM "v2_assignments"."to_envelope_id")
);
--> statement-breakpoint
CREATE INDEX "v2_assignments_budget_period_idx" ON "v2_assignments" USING btree ("budget_id","period_start");
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_budgets_ledger_unique" ON "v2_budgets" USING btree ("ledger_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_budgets_ledger_id_id_unique" ON "v2_budgets" USING btree ("ledger_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_envelopes_ledger_id_id_unique" ON "v2_envelopes" USING btree ("ledger_id","id");
--> statement-breakpoint
CREATE INDEX "v2_envelopes_budget_lifecycle_idx" ON "v2_envelopes" USING btree ("budget_id","lifecycle");
--> statement-breakpoint
CREATE UNIQUE INDEX "v2_envelope_categories_ledger_category_unique" ON "v2_envelope_categories" USING btree ("ledger_id","category_id");
--> statement-breakpoint
ALTER TABLE "v2_budgets" ADD CONSTRAINT "v2_budgets_ledger_id_v2_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."v2_ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_budgets" ADD CONSTRAINT "v2_budgets_default_account_fk" FOREIGN KEY ("ledger_id","default_account_id") REFERENCES "public"."v2_accounts"("ledger_id","id") ON DELETE SET NULL ("default_account_id") ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_budget_paydays" ADD CONSTRAINT "v2_budget_paydays_ledger_id_v2_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."v2_ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_budget_paydays" ADD CONSTRAINT "v2_budget_paydays_budget_fk" FOREIGN KEY ("ledger_id","budget_id") REFERENCES "public"."v2_budgets"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_budget_funding_accounts" ADD CONSTRAINT "v2_budget_funding_accounts_ledger_id_v2_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."v2_ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_budget_funding_accounts" ADD CONSTRAINT "v2_budget_funding_accounts_budget_fk" FOREIGN KEY ("ledger_id","budget_id") REFERENCES "public"."v2_budgets"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_budget_funding_accounts" ADD CONSTRAINT "v2_budget_funding_accounts_account_fk" FOREIGN KEY ("ledger_id","account_id") REFERENCES "public"."v2_accounts"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_envelopes" ADD CONSTRAINT "v2_envelopes_ledger_id_v2_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."v2_ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_envelopes" ADD CONSTRAINT "v2_envelopes_budget_fk" FOREIGN KEY ("ledger_id","budget_id") REFERENCES "public"."v2_budgets"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" ADD CONSTRAINT "v2_envelope_categories_ledger_id_v2_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."v2_ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" ADD CONSTRAINT "v2_envelope_categories_envelope_fk" FOREIGN KEY ("ledger_id","envelope_id") REFERENCES "public"."v2_envelopes"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_envelope_categories" ADD CONSTRAINT "v2_envelope_categories_category_fk" FOREIGN KEY ("ledger_id","category_id") REFERENCES "public"."v2_categories"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_assignments" ADD CONSTRAINT "v2_assignments_ledger_id_v2_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."v2_ledger"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_assignments" ADD CONSTRAINT "v2_assignments_budget_fk" FOREIGN KEY ("ledger_id","budget_id") REFERENCES "public"."v2_budgets"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_assignments" ADD CONSTRAINT "v2_assignments_from_envelope_fk" FOREIGN KEY ("ledger_id","from_envelope_id") REFERENCES "public"."v2_envelopes"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "v2_assignments" ADD CONSTRAINT "v2_assignments_to_envelope_fk" FOREIGN KEY ("ledger_id","to_envelope_id") REFERENCES "public"."v2_envelopes"("ledger_id","id") ON DELETE cascade ON UPDATE no action;
