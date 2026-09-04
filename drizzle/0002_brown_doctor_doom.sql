CREATE TABLE `withdrawal` (
	`id` text PRIMARY KEY NOT NULL,
	`chain_id` integer NOT NULL,
	`vault_address` text NOT NULL,
	`owner_address` text NOT NULL,
	`receiver_address` text NOT NULL,
	`sender_address` text NOT NULL,
	`asset_address` text NOT NULL,
	`assets` text NOT NULL,
	`shares` text NOT NULL,
	`tx_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `withdrawal_tx_hash_unique` ON `withdrawal` (`tx_hash`);