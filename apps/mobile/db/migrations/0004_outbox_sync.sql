CREATE TABLE `outbox_commands` (
	`command_id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`preconditions` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_kind` text,
	`rejection_payload` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbox_commands_status_created_idx` ON `outbox_commands` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`household_id` text PRIMARY KEY NOT NULL,
	`watermark` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
