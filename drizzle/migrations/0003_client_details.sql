ALTER TABLE `clients` RENAME COLUMN `name` TO `company`;
--> statement-breakpoint
ALTER TABLE `clients` RENAME COLUMN `primary_email` TO `email`;
--> statement-breakpoint
ALTER TABLE `clients` ADD `contact_name` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `clients` ADD `phone` text;
--> statement-breakpoint
UPDATE `clients` SET `contact_name` = `company` WHERE `contact_name` = '';
