PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`household_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`color` text DEFAULT '#4A90D9' NOT NULL,
	`icon` text DEFAULT 'banknote.fill' NOT NULL,
	`initial_balance_minor` integer DEFAULT 0 NOT NULL,
	`exclude_from_total` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`lifecycle` text DEFAULT 'active' NOT NULL,
	`lifecycle_changed_at` integer,
	`visibility` text DEFAULT 'public' NOT NULL,
	`owner_user_id` text,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "accounts_lifecycle_valid" CHECK("__new_accounts"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "accounts_type_valid" CHECK("__new_accounts"."type" IN ('cash', 'bank', 'card')),
	CONSTRAINT "accounts_private_owner_required" CHECK("__new_accounts"."visibility" = 'public' OR "__new_accounts"."owner_user_id" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("household_id", "id", "name", "type", "currency", "color", "icon", "initial_balance_minor", "exclude_from_total", "sort_order", "lifecycle", "lifecycle_changed_at", "visibility", "owner_user_id", "version", "created_by", "updated_by", "created_at", "updated_at") SELECT "household_id", "id", "name", "type", "currency", "color", "icon", "initial_balance_minor", "exclude_from_total", "sort_order", "lifecycle", "lifecycle_changed_at", 'public', "created_by", "version", "created_by", "updated_by", "created_at", "updated_at" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `accounts_household_lifecycle_idx` ON `accounts` (`household_id`,`lifecycle`);--> statement-breakpoint
CREATE INDEX `accounts_household_visibility_owner_idx` ON `accounts` (`household_id`,`visibility`,`owner_user_id`);
