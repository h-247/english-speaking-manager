CREATE TABLE `custom_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prompt_user_idx` ON `custom_prompts` (`user_id`);--> statement-breakpoint
CREATE TABLE `practice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`chatgpt_url` text NOT NULL,
	`normalized_url` text NOT NULL,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`notes` text,
	`tags` text,
	`pass_count` integer,
	`fail_count` integer,
	`score` real,
	`practiced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_normalized_url_idx` ON `practice_sessions` (`user_id`,`normalized_url`);--> statement-breakpoint
CREATE INDEX `user_status_idx` ON `practice_sessions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `user_created_at_idx` ON `practice_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `user_practiced_at_idx` ON `practice_sessions` (`user_id`,`practiced_at`);--> statement-breakpoint
CREATE INDEX `user_updated_at_idx` ON `practice_sessions` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `user_topic_idx` ON `practice_sessions` (`user_id`,`topic`);