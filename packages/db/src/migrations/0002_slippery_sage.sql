CREATE TABLE `assignments` (
	`id` text NOT NULL,
	`household_id` text NOT NULL,
	`currency` text NOT NULL,
	`budget_period` text NOT NULL,
	`source_envelope_id` text,
	`destination_envelope_id` text,
	`amount_minor` integer NOT NULL,
	`reverses_assignment_id` text,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "assignments_amount_positive" CHECK("assignments"."amount_minor" > 0),
	CONSTRAINT "assignments_has_endpoint" CHECK("assignments"."source_envelope_id" IS NOT NULL OR "assignments"."destination_envelope_id" IS NOT NULL),
	CONSTRAINT "assignments_distinct_endpoints" CHECK("assignments"."source_envelope_id" IS NULL OR "assignments"."destination_envelope_id" IS NULL OR "assignments"."source_envelope_id" <> "assignments"."destination_envelope_id")
);
--> statement-breakpoint
CREATE INDEX `assignments_household_period_idx` ON `assignments` (`household_id`,`budget_period`);--> statement-breakpoint
CREATE TABLE `budget_workspaces` (
	`household_id` text NOT NULL,
	`currency` text NOT NULL,
	`activation_period` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `currency`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `category_mappings` (
	`household_id` text NOT NULL,
	`category_id` text NOT NULL,
	`envelope_id` text,
	`effective_from_period` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `category_id`, `effective_from_period`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `category_mappings_household_category_idx` ON `category_mappings` (`household_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `envelopes` (
	`id` text NOT NULL,
	`household_id` text NOT NULL,
	`currency` text NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`lifecycle` text DEFAULT 'active' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "envelopes_lifecycle_valid" CHECK("envelopes"."lifecycle" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE INDEX `envelopes_household_currency_idx` ON `envelopes` (`household_id`,`currency`);--> statement-breakpoint
CREATE TABLE `funding_memberships` (
	`household_id` text NOT NULL,
	`account_id` text NOT NULL,
	`currency` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`effective_from_period` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `account_id`, `effective_from_period`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `funding_memberships_household_currency_idx` ON `funding_memberships` (`household_id`,`currency`);--> statement-breakpoint
CREATE TABLE `period_projection_cache` (
	`household_id` text NOT NULL,
	`currency` text NOT NULL,
	`budget_period` text NOT NULL,
	`projection_json` text NOT NULL,
	`seq_stamped` integer NOT NULL,
	`computed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `currency`, `budget_period`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `refund_links` (
	`id` text NOT NULL,
	`household_id` text NOT NULL,
	`original_transaction_id` text NOT NULL,
	`refund_transaction_id` text NOT NULL,
	`currency` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "refund_links_amount_positive" CHECK("refund_links"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refund_links_refund_once` ON `refund_links` (`refund_transaction_id`);--> statement-breakpoint
CREATE INDEX `refund_links_original_idx` ON `refund_links` (`original_transaction_id`);--> statement-breakpoint
CREATE TABLE `rollover_settings` (
	`household_id` text NOT NULL,
	`envelope_id` text NOT NULL,
	`positive_rollover` integer DEFAULT true NOT NULL,
	`effective_from_period` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `envelope_id`, `effective_from_period`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rollover_settings_household_envelope_idx` ON `rollover_settings` (`household_id`,`envelope_id`);--> statement-breakpoint
-- Append-only discipline (ADR-0006/0007/0012/0016): period-effective and
-- assignment rows are never updated or deleted — a change appends a new row
-- (or tombstone). SQLite triggers enforce what drizzle cannot express.
CREATE TRIGGER IF NOT EXISTS category_mappings_append_only_update
BEFORE UPDATE ON `category_mappings`
BEGIN
  SELECT RAISE(ABORT, 'category_mappings is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS category_mappings_append_only_delete
BEFORE DELETE ON `category_mappings`
BEGIN
  SELECT RAISE(ABORT, 'category_mappings is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS funding_memberships_append_only_update
BEFORE UPDATE ON `funding_memberships`
BEGIN
  SELECT RAISE(ABORT, 'funding_memberships is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS funding_memberships_append_only_delete
BEFORE DELETE ON `funding_memberships`
BEGIN
  SELECT RAISE(ABORT, 'funding_memberships is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS rollover_settings_append_only_update
BEFORE UPDATE ON `rollover_settings`
BEGIN
  SELECT RAISE(ABORT, 'rollover_settings is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS rollover_settings_append_only_delete
BEFORE DELETE ON `rollover_settings`
BEGIN
  SELECT RAISE(ABORT, 'rollover_settings is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS assignments_append_only_update
BEFORE UPDATE ON `assignments`
BEGIN
  SELECT RAISE(ABORT, 'assignments is append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS assignments_append_only_delete
BEFORE DELETE ON `assignments`
BEGIN
  SELECT RAISE(ABORT, 'assignments is append-only');
END;
