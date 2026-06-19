ALTER TABLE `question_sets` ADD COLUMN `categories` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `questions` ADD COLUMN `categories` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `assignments` ADD COLUMN `categories` text DEFAULT '[]' NOT NULL;
