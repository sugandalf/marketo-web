import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

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

export const deposit = sqliteTable('deposit', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	chainId: integer('chain_id').notNull(),
	vaultAddress: text('vault_address').notNull(),
	depositorAddress: text('depositor_address').notNull(),
	senderAddress: text('sender_address').notNull(),
	assetAddress: text('asset_address').notNull(),
	assets: text('assets').notNull(),
	shares: text('shares').notNull(),
	txHash: text('tx_hash').notNull().unique(),
	createdAt: integer('created_at')
		.notNull()
		.$defaultFn(() => Date.now())
});

export const withdrawal = sqliteTable('withdrawal', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	chainId: integer('chain_id').notNull(),
	vaultAddress: text('vault_address').notNull(),
	ownerAddress: text('owner_address').notNull(),
	receiverAddress: text('receiver_address').notNull(),
	senderAddress: text('sender_address').notNull(),
	assetAddress: text('asset_address').notNull(),
	assets: text('assets').notNull(),
	shares: text('shares').notNull(),
	txHash: text('tx_hash').notNull().unique(),
	createdAt: integer('created_at')
		.notNull()
		.$defaultFn(() => Date.now())
});

export const botStats = sqliteTable(
	'bot_stats',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		chainId: integer('chain_id').notNull(),
		vaultAddress: text('vault_address').notNull(),
		tvlAssets: text('tvl_assets').notNull(),
		pnlAssets: text('pnl_assets').notNull(),
		realizedPnlAssets: text('realized_pnl_assets').notNull(),
		unrealizedPnlAssets: text('unrealized_pnl_assets'),
		updatedAt: integer('updated_at')
			.notNull()
			.$defaultFn(() => Date.now())
	},
	(t) => [unique('bot_stats_chain_vault_unique').on(t.chainId, t.vaultAddress)]
);

export const botFight = sqliteTable(
	'bot_fight',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		chainId: integer('chain_id').notNull(),
		vaultAddress: text('vault_address').notNull(),
		marketId: text('market_id').notNull(),
		date: text('date').notNull(),
		window: text('window').notNull(),
		market: text('market').notNull(),
		side: text('side').notNull(),
		pnlAssets: text('pnl_assets').notNull(),
		settledAt: integer('settled_at').notNull()
	},
	(t) => [unique('bot_fight_vault_market_unique').on(t.vaultAddress, t.marketId)]
);
