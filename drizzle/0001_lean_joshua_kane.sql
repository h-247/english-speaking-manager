CREATE TABLE `practice_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`pass_count` integer NOT NULL,
	`fail_count` integer NOT NULL,
	`score` real NOT NULL,
	`notes` text,
	`practiced_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `practice_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempt_session_idx` ON `practice_attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `attempt_user_idx` ON `practice_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `attempt_practiced_at_idx` ON `practice_attempts` (`practiced_at`);