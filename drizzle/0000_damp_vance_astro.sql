CREATE TABLE `bot` (
	`id` text PRIMARY KEY NOT NULL,
	`chain_id` integer NOT NULL,
	`factory_address` text NOT NULL,
	`vault_address` text NOT NULL,
	`creator_address` text NOT NULL,
	`operator_address` text NOT NULL,
	`asset_address` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`market` text NOT NULL,
	`strategy` text NOT NULL,
	`seed_assets` text NOT NULL,
	`performance_fee_bps` integer DEFAULT 0 NOT NULL,
	`creator_fee_recipient` text NOT NULL,
	`tx_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bot_vault_address_unique` ON `bot` (`vault_address`);--> statement-breakpoint
CREATE UNIQUE INDEX `bot_tx_hash_unique` ON `bot` (`tx_hash`);--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`priority` integer DEFAULT 1 NOT NULL
);
