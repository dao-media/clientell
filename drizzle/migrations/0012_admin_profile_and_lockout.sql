CREATE TABLE `admin_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`business_name` text NOT NULL,
	`phone` text,
	`website` text,
	`social_links` text DEFAULT '[]' NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `failed_pin_attempts` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `clients` ADD `pin_lockout_until` integer;
--> statement-breakpoint
ALTER TABLE `clients` ADD `pin_strike_window_until` integer;
--> statement-breakpoint
ALTER TABLE `clients` ADD `is_locked` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `clients` ADD `locked_at` integer;
