import { type MarketOnchain } from '@somnia-chain/markets-sdk';
import type { Hex } from 'viem';
import type { VaultAdapter } from './adapter.ts';
import { type ReadExchange } from './discover.ts';
import { errorMessage, log } from './log.ts';
import { rememberMarketId } from './state.ts';
import { sendVaultWrite, type TrackedOrder, type WriteGate } from './writes.ts';

export type CycleContext = {
	gate: WriteGate;
	adapter: VaultAdapter | null;
	exchange: ReadExchange;
	tracked: TrackedOrder[];
};

export async function redeemVaultPositions(
	ctx: CycleContext,
	marketIds: Iterable<Hex>
): Promise<void> {
	if (!ctx.adapter) return;
	for (const marketId of marketIds) {
		let onchain: MarketOnchain;
		try {
			onchain = await ctx.exchange.client.getMarketOnchain(marketId);
		} catch (error) {
			log(`redeem skip ${marketId}: ${errorMessage(error)}`);
			continue;
		}
		if (!onchain.isResolved && !onchain.isVoided) continue;

		const outcomes: { idx: number; id: bigint }[] = onchain.isVoided
			? [
					{ idx: 0, id: onchain.yesId },
					{ idx: 1, id: onchain.noId }
				]
			: [
					{
						idx: onchain.winningOutcome === 0 ? 0 : 1,
						id: onchain.winningOutcome === 0 ? onchain.yesId : onchain.noId
					}
				];

		for (const outcome of outcomes) {
			const held = await ctx.adapter.outcomeBalance(onchain.outcomeToken, outcome.id);
			if (held <= 0n) continue;
			await sendVaultWrite(
				ctx.gate,
				'redeem',
				[marketId, outcome.idx, held],
				`redeem ${marketId} outcome=${outcome.idx} amount=${held}`
			);
		}
	}
}

/** ec-settlement CLAIM=1: indexer sweep of vault-owed settled positions. */
export async function claimSettled(ctx: CycleContext, vault: Hex): Promise<void> {
	if (!ctx.adapter) return;
	let claims;
	try {
		claims = await ctx.exchange.client.getClaimable(vault);
	} catch (error) {
		log(`claim sweep miss: ${errorMessage(error)}`);
		return;
	}
	for (const row of claims) {
		if (row.amount <= 0n) continue;
		const marketId = (row.marketId.startsWith('0x') ? row.marketId : `0x${row.marketId}`) as Hex;
		await sendVaultWrite(
			ctx.gate,
			'redeem',
			[marketId, row.outcomeIdx, row.amount],
			`claim ${marketId} outcome=${row.outcomeIdx} amount=${row.amount}`
		);
		await rememberMarketId(marketId);
	}
}

export async function cancelTracked(ctx: CycleContext): Promise<void> {
	if (ctx.gate.dryRun) return;
	for (const order of ctx.tracked) {
		await sendVaultWrite(
			ctx.gate,
			'cancelOrder',
			[order.marketId, order.orderId],
			`cancelOrder ${order.orderId} ${order.marketId}`
		);
	}
	ctx.tracked.length = 0;
}
