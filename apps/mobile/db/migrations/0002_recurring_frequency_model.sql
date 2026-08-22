ALTER TABLE `recurring_payments` ADD `frequency` text;--> statement-breakpoint
ALTER TABLE `recurring_payments` ADD `interval_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_payments` ADD `end_count` integer;--> statement-breakpoint
UPDATE `recurring_payments` SET `frequency` = CASE `interval` WHEN 'daily' THEN 'day' WHEN 'weekly' THEN 'week' WHEN 'monthly' THEN 'month' WHEN 'yearly' THEN 'year' ELSE 'month' END;--> statement-breakpoint
ALTER TABLE `recurring_payments` DROP COLUMN `interval`;
