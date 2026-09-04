import { and, eq } from 'drizzle-orm';
import { bot, botFight, botStats } from '../db/schema';
import type { PerformanceDb } from './db';
import type { VaultMark } from './mark';

export type EnteredVault = {
	chainId: number;
	vaultAddress: string;
	assetAddress: string;
};

export async function listEnteredVaults(db: PerformanceDb): Promise<EnteredVault[]> {
	const rows = await db
		.select({
			chainId: bot.chainId,
			vaultAddress: bot.vaultAddress,
			assetAddress: bot.assetAddress
		})
		.from(bot);
	return rows;
}

export async function listStoredMarketIds(
	db: PerformanceDb,
	vaultAddress: string
): Promise<string[]> {
	const rows = await db
		.select({ marketId: botFight.marketId })
		.from(botFight)
		.where(eq(botFight.vaultAddress, vaultAddress));
	return rows.map((row) => row.marketId);
}

export function persistVaultMark(db: PerformanceDb, vault: EnteredVault, mark: VaultMark): void {
	db.transaction((tx) => {
		const existing = tx
			.select({ id: botStats.id })
			.from(botStats)
			.where(
				and(eq(botStats.chainId, vault.chainId), eq(botStats.vaultAddress, vault.vaultAddress))
			)
			.limit(1)
			.all();
		const stats = {
			chainId: vault.chainId,
			vaultAddress: vault.vaultAddress,
			tvlAssets: mark.tvlAssets.toString(),
			pnlAssets: mark.pnlAssets.toString(),
			realizedPnlAssets: mark.realizedPnlAssets.toString(),
			unrealizedPnlAssets:
				mark.unrealizedPnlAssets === null ? null : mark.unrealizedPnlAssets.toString(),
			updatedAt: Date.now()
		};
		if (existing[0]) {
			tx.update(botStats).set(stats).where(eq(botStats.id, existing[0].id)).run();
		} else {
			tx.insert(botStats).values(stats).run();
		}

		for (const fight of mark.fights) {
			const row = {
				chainId: vault.chainId,
				vaultAddress: vault.vaultAddress,
				marketId: fight.marketId,
				date: fight.date,
				window: fight.window,
				market: fight.market,
				side: fight.side,
				pnlAssets: fight.pnlAssets.toString(),
				settledAt: fight.settledAt
			};
			const found = tx
				.select({ id: botFight.id })
				.from(botFight)
				.where(
					and(eq(botFight.vaultAddress, vault.vaultAddress), eq(botFight.marketId, fight.marketId))
				)
				.limit(1)
				.all();
			if (found[0]) {
				tx.update(botFight).set(row).where(eq(botFight.id, found[0].id)).run();
			} else {
				tx.insert(botFight).values(row).run();
			}
		}
	});
}
