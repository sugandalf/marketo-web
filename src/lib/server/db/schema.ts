import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const bot = sqliteTable('bot', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	chainId: integer('chain_id').notNull(),
	factoryAddress: text('factory_address').notNull(),
	vaultAddress: text('vault_address').notNull().unique(),
	creatorAddress: text('creator_address').notNull(),
	operatorAddress: text('operator_address').notNull(),
	assetAddress: text('asset_address').notNull(),
	name: text('name').notNull(),
	symbol: text('symbol').notNull(),
	market: text('market').notNull(),
	strategy: text('strategy').notNull(),
	seedAssets: text('seed_assets').notNull(),
	performanceFeeBps: integer('performance_fee_bps').notNull().default(0),
	creatorFeeRecipient: text('creator_fee_recipient').notNull(),
	txHash: text('tx_hash').notNull().unique(),
	createdAt: integer('created_at')
		.notNull()
		.$defaultFn(() => Date.now())
});
