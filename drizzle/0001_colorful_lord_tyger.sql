CREATE TABLE `deposit` (
	`id` text PRIMARY KEY NOT NULL,
	`chain_id` integer NOT NULL,
	`vault_address` text NOT NULL,
	`depositor_address` text NOT NULL,
	`sender_address` text NOT NULL,
	`asset_address` text NOT NULL,
	`assets` text NOT NULL,
	`shares` text NOT NULL,
	`tx_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deposit_tx_hash_unique` ON `deposit` (`tx_hash`);