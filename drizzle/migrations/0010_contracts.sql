CREATE TABLE `clauses` (
	`id` text PRIMARY KEY NOT NULL,
	`section_number` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`doc_type` text NOT NULL,
	`clause_type` text NOT NULL,
	`module_key` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`project_name` text NOT NULL,
	`description` text,
	`deliverables` text DEFAULT '[]' NOT NULL,
	`out_of_scope` text DEFAULT '[]' NOT NULL,
	`approval_stages` text DEFAULT '[]' NOT NULL,
	`milestones` text DEFAULT '[]' NOT NULL,
	`estimated_start` integer,
	`base_fee` integer DEFAULT 0 NOT NULL,
	`overage_rate` integer DEFAULT 6500 NOT NULL,
	`remaining_structure` text DEFAULT 'single' NOT NULL,
	`third_party_option` text,
	`handling_pct` integer DEFAULT 12 NOT NULL,
	`per_item_threshold` integer DEFAULT 10000 NOT NULL,
	`service_ownership` text DEFAULT '[]' NOT NULL,
	`personal_guarantee` integer DEFAULT false NOT NULL,
	`confidentiality` integer DEFAULT false NOT NULL,
	`confidentiality_tier` integer,
	`premium_pct` integer DEFAULT 0 NOT NULL,
	`premium_floor` integer DEFAULT 75000 NOT NULL,
	`governing_state` text DEFAULT 'West Virginia' NOT NULL,
	`venue_county` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`signed_at` integer,
	`pdf_key` text,
	`download_token` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contracts_download_token_unique` ON `contracts` (`download_token`);
--> statement-breakpoint
ALTER TABLE `clients` ADD `legal_name` text;
--> statement-breakpoint
ALTER TABLE `clients` ADD `entity_type` text;
--> statement-breakpoint
ALTER TABLE `clients` ADD `entity_state` text;
