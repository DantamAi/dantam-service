CREATE TABLE `catalog_options` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`product` text NOT NULL,
	`name` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `product` text DEFAULT 'Clinic App' NOT NULL;