CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` integer NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`caption` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
