ALTER TABLE `contracts` ADD `client_signature` text;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `designer_signature` text;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `client_signed_at` integer;
--> statement-breakpoint
ALTER TABLE `contracts` ADD `designer_signed_at` integer;
