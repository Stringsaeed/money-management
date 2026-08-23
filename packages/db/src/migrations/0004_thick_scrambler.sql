CREATE TABLE `recurring_occurrences` (
	`household_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`transaction_id` text,
	`settled_at` integer NOT NULL,
	PRIMARY KEY(`household_id`, `rule_id`, `scheduled_date`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`,`rule_id`) REFERENCES `recurring_rules`(`household_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_recurring_occurrence_transaction` ON `recurring_occurrences` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `recurring_occurrences_rule_idx` ON `recurring_occurrences` (`household_id`,`rule_id`);--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`household_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount_minor` integer,
	`currency` text NOT NULL,
	`account_id` text,
	`to_account_id` text,
	`category_id` text,
	`description` text DEFAULT '' NOT NULL,
	`frequency` text NOT NULL,
	`interval_count` integer DEFAULT 1 NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`end_count` integer,
	`time_zone` text NOT NULL,
	`lifecycle` text DEFAULT 'active' NOT NULL,
	`health` text DEFAULT 'ready' NOT NULL,
	`attention_reasons` text DEFAULT '[]' NOT NULL,
	`attention_details` text,
	`eligibility_floor` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`lifecycle_changed_at` integer,
	`health_changed_at` integer,
	`last_settlement_attempt_at` integer,
	`last_settlement_error` text,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "recurring_rules_lifecycle_valid" CHECK("recurring_rules"."lifecycle" IN ('active', 'paused', 'completed', 'archived')),
	CONSTRAINT "recurring_rules_health_valid" CHECK("recurring_rules"."health" IN ('ready', 'needs_attention'))
);
--> statement-breakpoint
CREATE INDEX `recurring_rules_household_lifecycle_idx` ON `recurring_rules` (`household_id`,`lifecycle`);