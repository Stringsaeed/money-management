CREATE TABLE `categories` (
	`household_id` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text DEFAULT '#FF6B6B' NOT NULL,
	`icon` text DEFAULT '🏷️' NOT NULL,
	`parent_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`lifecycle` text DEFAULT 'active' NOT NULL,
	`lifecycle_changed_at` integer,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "categories_lifecycle_valid" CHECK("categories"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "categories_type_valid" CHECK("categories"."type" IN ('income', 'expense'))
);
--> statement-breakpoint
CREATE INDEX `categories_household_lifecycle_idx` ON `categories` (`household_id`,`lifecycle`);--> statement-breakpoint
CREATE TABLE `accounts` (
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
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "accounts_lifecycle_valid" CHECK("accounts"."lifecycle" IN ('active', 'archived')),
	CONSTRAINT "accounts_type_valid" CHECK("accounts"."type" IN ('cash', 'bank', 'card'))
);
--> statement-breakpoint
CREATE INDEX `accounts_household_lifecycle_idx` ON `accounts` (`household_id`,`lifecycle`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`household_id` text NOT NULL,
	`id` text NOT NULL,
	`type` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`original_amount_minor` integer,
	`original_currency` text,
	`exchange_rate` integer,
	`date` text NOT NULL,
	`account_id` text NOT NULL,
	`to_account_id` text,
	`category_id` text,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurring_rule_id` text,
	`description` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`household_id`, `id`),
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`,`account_id`) REFERENCES `accounts`(`household_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`,`to_account_id`) REFERENCES `accounts`(`household_id`,`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`household_id`,`category_id`) REFERENCES `categories`(`household_id`,`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "transactions_type_valid" CHECK("transactions"."type" IN ('expense', 'income', 'transfer')),
	CONSTRAINT "transactions_amount_positive" CHECK("transactions"."amount_minor" > 0),
	CONSTRAINT "transactions_date_shape" CHECK("transactions"."date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "transactions_transfer_shape" CHECK(("transactions"."type" = 'transfer' AND "transactions"."to_account_id" IS NOT NULL AND "transactions"."category_id" IS NULL AND "transactions"."account_id" <> "transactions"."to_account_id")
        OR ("transactions"."type" <> 'transfer' AND "transactions"."to_account_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `transactions_household_date_idx` ON `transactions` (`household_id`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_household_account_idx` ON `transactions` (`household_id`,`account_id`);