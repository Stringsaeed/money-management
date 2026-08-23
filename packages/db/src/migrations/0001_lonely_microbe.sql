CREATE TABLE `command_results` (
	`household_id` text NOT NULL,
	`command_id` text NOT NULL,
	`result` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `command_id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `household_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`seq` integer NOT NULL,
	`user_id` text NOT NULL,
	`command_id` text NOT NULL,
	`effects` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `household_changes_household_seq_unique` ON `household_changes` (`household_id`,`seq`);--> statement-breakpoint
CREATE UNIQUE INDEX `household_changes_household_command_unique` ON `household_changes` (`household_id`,`command_id`);--> statement-breakpoint
CREATE INDEX `household_changes_commandId_idx` ON `household_changes` (`command_id`);--> statement-breakpoint
CREATE TABLE `_pipeline_assertions` (
	`id` text PRIMARY KEY NOT NULL,
	`ok` integer NOT NULL,
	CONSTRAINT "pipeline_assertion_ok_true" CHECK("_pipeline_assertions"."ok" = 1)
);
--> statement-breakpoint
ALTER TABLE `membership` ADD `version` integer DEFAULT 0 NOT NULL;