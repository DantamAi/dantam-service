CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` integer NOT NULL,
	`action` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`module` text NOT NULL,
	`assignee` text NOT NULL,
	`description` text NOT NULL,
	`expected` text NOT NULL,
	`actual` text NOT NULL,
	`steps` text NOT NULL,
	`source_id` text,
	`release` text NOT NULL,
	`due` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_source_id_unique` ON `tickets` (`source_id`);