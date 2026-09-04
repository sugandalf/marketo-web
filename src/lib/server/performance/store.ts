import { desc } from 'drizzle-orm';
import { db } from '../db';
import { botFight, botStats } from '../db/schema';

export type BotStatsRow = {
	chainId: number;
	vaultAddress: string;
	tvlAssets: string;
	pnlAssets: string;
	realizedPnlAssets: string;
	unrealizedPnlAssets: string | null;
	updatedAt: number;
};

export type BotFightRow = {
	chainId: number;
	vaultAddress: string;
	marketId: string;
	date: string;
	window: '15m' | '1h';
	market: 'BTC' | 'ETH';
	side: 'up' | 'down';
	pnlAssets: string;
	settledAt: number;
};

function asWindow(value: string): '15m' | '1h' | null {
	return value === '15m' || value === '1h' ? value : null;
}

function asMarket(value: string): 'BTC' | 'ETH' | null {
	return value === 'BTC' || value === 'ETH' ? value : null;
}

function asSide(value: string): 'up' | 'down' | null {
	return value === 'up' || value === 'down' ? value : null;
}

export async function listBotStats(): Promise<BotStatsRow[]> {
	const rows = await db
		.select({
			chainId: botStats.chainId,
			vaultAddress: botStats.vaultAddress,
			tvlAssets: botStats.tvlAssets,
			pnlAssets: botStats.pnlAssets,
			realizedPnlAssets: botStats.realizedPnlAssets,
			unrealizedPnlAssets: botStats.unrealizedPnlAssets,
			updatedAt: botStats.updatedAt
		})
		.from(botStats);
	return rows;
}

export async function listBotFights(): Promise<BotFightRow[]> {
	const rows = await db
		.select({
			chainId: botFight.chainId,
			vaultAddress: botFight.vaultAddress,
			marketId: botFight.marketId,
			date: botFight.date,
			window: botFight.window,
			market: botFight.market,
			side: botFight.side,
			pnlAssets: botFight.pnlAssets,
			settledAt: botFight.settledAt
		})
		.from(botFight)
		.orderBy(desc(botFight.settledAt));
	const fights: BotFightRow[] = [];
	for (const row of rows) {
		const window = asWindow(row.window);
		const market = asMarket(row.market);
		const side = asSide(row.side);
		if (!window || !market || !side) continue;
		fights.push({
			chainId: row.chainId,
			vaultAddress: row.vaultAddress,
			marketId: row.marketId,
			date: row.date,
			window,
			market,
			side,
			pnlAssets: row.pnlAssets,
			settledAt: row.settledAt
		});
	}
	return fights;
}
