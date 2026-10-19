CREATE TABLE `project_attachments` (
	`project_id` text NOT NULL,
	`id` text NOT NULL,
	`item_id` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`caption` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL,
	`object_key` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_approval_decisions` (
	`project_id` text NOT NULL,
	`proposal_id` text NOT NULL,
	`role` text NOT NULL,
	`author` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`created` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `proposal_id`, `role`),
	FOREIGN KEY (`project_id`,`proposal_id`) REFERENCES `project_proposals`(`project_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_scope_dependencies` (
	`project_id` text NOT NULL,
	`item_id` text NOT NULL,
	`depends_on_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `item_id`, `depends_on_id`),
	FOREIGN KEY (`project_id`,`item_id`) REFERENCES `project_scope_items`(`project_id`,`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`,`depends_on_id`) REFERENCES `project_scope_items`(`project_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_history` (
	`project_id` text NOT NULL,
	`id` text NOT NULL,
	`item_id` text NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`created` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_history_item` ON `project_history` (`project_id`,`item_id`);--> statement-breakpoint
CREATE TABLE `project_members` (
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `email`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_proposals` (
	`project_id` text NOT NULL,
	`id` text NOT NULL,
	`item_id` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`revision` integer NOT NULL,
	`reason` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL,
	`state` text NOT NULL,
	`appeal_of` text,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `id`),
	FOREIGN KEY (`project_id`,`item_id`) REFERENCES `project_scope_items`(`project_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_required_approvals` (
	`project_id` text NOT NULL,
	`proposal_id` text NOT NULL,
	`role` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `proposal_id`, `role`),
	FOREIGN KEY (`project_id`,`proposal_id`) REFERENCES `project_proposals`(`project_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_scope_revisions` (
	`project_id` text NOT NULL,
	`event_id` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`acceptance` text NOT NULL,
	`exclusions` text NOT NULL,
	`product` text NOT NULL,
	`module` text NOT NULL,
	`owner` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`estimate` text NOT NULL,
	`tickets` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`approved_revision` integer,
	`created` text,
	`created_by` text,
	`updated` text,
	`updated_by` text,
	`dependencies_json` text NOT NULL,
	PRIMARY KEY(`project_id`, `event_id`),
	FOREIGN KEY (`project_id`,`event_id`) REFERENCES `project_history`(`project_id`,`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_scope_items` (
	`project_id` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`acceptance` text NOT NULL,
	`exclusions` text NOT NULL,
	`product` text NOT NULL,
	`module` text NOT NULL,
	`owner` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`estimate` text NOT NULL,
	`tickets` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`approved_revision` integer,
	`created` text,
	`created_by` text,
	`updated` text,
	`updated_by` text,
	`position` integer NOT NULL,
	PRIMARY KEY(`project_id`, `id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `scope_project_status` ON `project_scope_items` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `scope_product_module` ON `project_scope_items` (`product`,`module`);--> statement-breakpoint
CREATE INDEX `scope_finish_status` ON `project_scope_items` (`end`,`status`);--> statement-breakpoint
CREATE INDEX `scope_owner` ON `project_scope_items` (`owner`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`version` integer NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`created_by` text,
	`updated_by` text,
	`legacy_version` integer NOT NULL,
	`write_token` text NOT NULL
);
