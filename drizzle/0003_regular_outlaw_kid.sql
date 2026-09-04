CREATE TABLE `bot_fight` (
	`id` text PRIMARY KEY NOT NULL,
	`chain_id` integer NOT NULL,
	`vault_address` text NOT NULL,
	`market_id` text NOT NULL,
	`date` text NOT NULL,
	`window` text NOT NULL,
	`market` text NOT NULL,
	`side` text NOT NULL,
	`pnl_assets` text NOT NULL,
	`settled_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bot_fight_vault_market_unique` ON `bot_fight` (`vault_address`,`market_id`);--> statement-breakpoint
CREATE TABLE `bot_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`chain_id` integer NOT NULL,
	`vault_address` text NOT NULL,
	`tvl_assets` text NOT NULL,
	`pnl_assets` text NOT NULL,
	`realized_pnl_assets` text NOT NULL,
	`unrealized_pnl_assets` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bot_stats_chain_vault_unique` ON `bot_stats` (`chain_id`,`vault_address`);