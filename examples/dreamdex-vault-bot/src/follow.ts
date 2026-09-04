import { ORDER_TYPE, type MarketOnchain } from '@somnia-chain/markets-sdk';
import { getAddress, type Hex } from 'viem';
import { SIDE, snap, type VaultAdapter } from './adapter.ts';
import type { OracleFollowConfig } from './config.ts';
import { type EligibleMarket, type ReadExchange, TUSDC } from './discover.ts';
import { errorMessage, log } from './log.ts';
import { Positions, type Leg } from './position.ts';
import {
	estimateUp,
	marketBoundUp,
	marketImpliedUp,
	type Asset,
	type ReferenceReader,
	type SpotHistory,
	type SpotReader
} from './signal.ts';
import { rememberMarketId } from './state.ts';
import { sendVaultWrite, type TrackedOrder, type WriteGate } from './writes.ts';

export type FollowCycle = {
	scanned: number;
	skips: Map<string, number>;
	best?: {
		symbol: string;
		pUp: number;
		tilt: number;
		fair: number;
		ask: number;
		short: number;
		ref: string;
		vol: string;
	};
	widest?: { symbol: string; model: number; market: number; by: number };
};

export function newFollowCycle(): FollowCycle {
	return { scanned: 0, skips: new Map() };
}

function note(cycle: FollowCycle, reason: string): void {
	cycle.skips.set(reason, (cycle.skips.get(reason) ?? 0) + 1);
}

export type FollowContext = {
	gate: WriteGate;
	adapter: VaultAdapter | null;
	exchange: ReadExchange;
	follow: OracleFollowConfig;
	spot: SpotReader;
	refs: ReferenceReader;
	history: SpotHistory;
	position: Positions;
	lastTake: Map<string, number>;
	synced: Set<string>;
	tracked: TrackedOrder[];
	warned: Set<string>;
};

const ASSETS: readonly Asset[] = ['BTC', 'ETH'];
const isAsset = (a: string): a is Asset => (ASSETS as readonly string[]).includes(a);

function expireNs(onchain: MarketOnchain): bigint {
	const byMarket = onchain.expiry * 1_000_000_000n;
	const inFiveMin = BigInt(Math.floor(Date.now() / 1000) + 300) * 1_000_000_000n;
	return byMarket < inFiveMin ? byMarket : inFiveMin;
}

function snapTick(price: bigint, tick: bigint, one: bigint): bigint {
	let snapped = snap(price, tick);
	if (snapped <= 0n) snapped = tick;
	if (snapped >= one) snapped = one - tick;
	return snapped;
}

function toHumanBook(
	levels: { price: bigint; quantity: bigint }[],
	one: bigint
): [number, number][] {
	return levels.map((l) => [Number(l.price) / Number(one), Number(l.quantity) / Number(one)]);
}

function nearExpiryStopMs(intervalSec: number, overrideMs: number | null): number {
	if (overrideMs !== null) return overrideMs;
	if (intervalSec > 0) return Math.max(30_000, Math.min(300_000, intervalSec * 1000 * 0.4));
	return 300_000;
}

async function syncOnce(ctx: FollowContext, marketId: Hex): Promise<void> {
	if (ctx.synced.has(marketId)) return;
	const result = await sendVaultWrite(ctx.gate, 'syncMarket', [marketId], `syncMarket ${marketId}`);
	if ('dryRun' in result || result.ok || result.kind === 'reverted') {
		ctx.synced.add(marketId);
	}
}

/**
 * Directional IOC take — BUY_YES or BUY_NO only (never SELL, never mint a pair).
 * Port of dreamdex-bot-kit ec-oracle-follow, vault adapter as trader.
 */
export async function takeFollow(
	ctx: FollowContext,
	market: EligibleMarket,
	cycle: FollowCycle
): Promise<void> {
	if (!ctx.adapter) {
		log(`DRY skip take ${market.asset} ${market.marketId}: no vault`);
		return;
	}

	const vaultAsset = getAddress(await ctx.adapter.vaultAsset());
	if (vaultAsset !== getAddress(market.collateral) || vaultAsset !== getAddress(TUSDC)) {
		log(
			`collateral mismatch ${market.asset}: vault ${vaultAsset} vs market ${market.collateral} (tUSDC ${TUSDC})`
		);
		return;
	}

	if (!isAsset(market.asset.toUpperCase())) {
		if (!ctx.warned.has(market.asset)) {
			ctx.warned.add(market.asset);
			log(`skipping ${market.asset} markets — no price feed wired for that asset`);
		}
		note(cycle, 'unknown asset');
		return;
	}
	const asset = market.asset.toUpperCase() as Asset;
	const key = market.marketId;
	cycle.scanned++;

	const now = Date.now();
	const expiryMs = Number(market.onchain.expiry) * 1000;
	const stopMs = nearExpiryStopMs(market.intervalSec, ctx.follow.nearExpiryStopMs);
	if (Number.isFinite(expiryMs) && expiryMs - now < stopMs) {
		note(cycle, 'near expiry');
		return;
	}

	const observed = await ctx.spot.getSpot(asset);
	if (observed) ctx.history.record(asset, observed);
	const mom = ctx.history.momentum(asset, now);
	if (!mom) {
		if (!ctx.warned.has(`warm:${asset}`)) {
			ctx.warned.add(`warm:${asset}`);
			log(`warming up spot history for ${asset}`);
		}
		note(cycle, 'warming up');
		return;
	}
	ctx.warned.delete(`warm:${asset}`);

	const ttl = Number.isFinite(expiryMs) ? expiryMs - now : null;
	const ref = await ctx.refs.referenceFor(
		{ marketId: market.marketId, strike: market.strike },
		mom.spot
	);
	const horizonOk =
		ctx.follow.maxHorizons <= 0 ||
		(ttl !== null && ttl <= ctx.follow.maxHorizons * ctx.follow.windowMs);
	const useMomentum = horizonOk && Math.abs(mom.r) >= ctx.follow.threshold;
	if (!ref && !useMomentum) {
		note(
			cycle,
			horizonOk
				? 'no view and no reference price'
				: 'no reference, and expiry too far out for momentum'
		);
		return;
	}

	const measured = ctx.history.volatility(asset);
	const expectedMove = Math.max(measured ?? ctx.follow.expectedMove, ctx.follow.minVol);

	const decimals = market.onchain.decimals || 6;
	const one = 10n ** BigInt(decimals);
	const book = await ctx.exchange.client.getBinaryOrderBook(market.onchain.pool, {
		depth: 3,
		decimals
	});
	const yesHuman = {
		bids: toHumanBook(book.yesBids, one),
		asks: toHumanBook(book.yesAsks, one)
	};
	let anchorUp = marketImpliedUp(yesHuman);
	if (anchorUp === null) {
		if (!ref) {
			note(cycle, 'no two-sided market to price against');
			return;
		}
		anchorUp = marketBoundUp(yesHuman);
		if (anchorUp === null) {
			note(cycle, 'empty book');
			return;
		}
	}

	const { pUp, tilt } = estimateUp({
		spot: mom.spot,
		r: useMomentum ? mom.r : 0,
		strike: ref?.price ?? null,
		timeToExpiryMs: ttl,
		windowMs: ctx.follow.windowMs,
		expectedMove,
		sensitivity: ctx.follow.sensitivity,
		model: ctx.follow.model,
		anchorUp
	});

	if (tilt === 0) {
		note(cycle, 'no disagreement with market');
		return;
	}
	const bullish = tilt > 0;
	const leg: Leg = bullish ? 'yes' : 'no';

	const yesRaw = await ctx.adapter.outcomeBalance(
		market.onchain.outcomeToken,
		market.onchain.yesId
	);
	const noRaw = await ctx.adapter.outcomeBalance(market.onchain.outcomeToken, market.onchain.noId);
	const heldYes = Number(yesRaw) / Number(one);
	const heldNo = Number(noRaw) / Number(one);
	ctx.position.set(key, { yes: heldYes, no: heldNo });

	const opposing = ctx.position.opposing(key, leg);
	if (opposing > 0) {
		if (!ctx.warned.has(`opp:${key}`)) {
			ctx.warned.add(`opp:${key}`);
			log(
				`${market.asset} ${key}: signal favours ${bullish ? 'YES' : 'NO'} but we hold ${opposing.toFixed(4)} ` +
					`${bullish ? 'NO' : 'YES'} — sitting out (buying the other leg would only mint sets)`
			);
		}
		note(cycle, 'holding the opposing leg');
		return;
	}

	const fairFav = bullish ? pUp : 1 - pUp;
	const marketFair = bullish ? anchorUp : 1 - anchorUp;
	const disagreement = Math.abs(fairFav - marketFair);
	if (ctx.follow.maxDisagreement > 0 && disagreement > ctx.follow.maxDisagreement) {
		if (!cycle.widest || disagreement > cycle.widest.by) {
			cycle.widest = {
				symbol: `${market.asset}#${bullish ? 'YES' : 'NO'}`,
				model: fairFav,
				market: marketFair,
				by: disagreement
			};
		}
		note(cycle, 'model disagrees with market');
		return;
	}

	const favLevels = bullish ? book.yesAsks : book.noAsks;
	const top = favLevels[0];
	if (!top) {
		note(cycle, 'empty ask side');
		return;
	}
	const askPx = Number(top.price) / Number(one);
	const askAmt = Number(top.quantity) / Number(one);
	const short = askPx - (fairFav - ctx.follow.edge);
	if (short > 0) {
		if (!cycle.best || short < cycle.best.short) {
			cycle.best = {
				symbol: `${market.asset}#${bullish ? 'YES' : 'NO'}`,
				pUp,
				tilt,
				fair: fairFav,
				ask: askPx,
				short,
				ref: ref ? `${ref.kind} ${ref.price.toFixed(2)}` : 'none',
				vol: `${(expectedMove * 100).toFixed(3)}%${measured === null ? ' assumed' : ''}`
			};
		}
		note(cycle, 'no edge');
		return;
	}

	const net = ctx.position.net(key);
	if (net >= ctx.follow.maxShares) {
		note(cycle, 'at max shares');
		return;
	}
	if (ctx.position.totalNet() >= ctx.follow.maxExposure) {
		note(cycle, 'at max exposure');
		return;
	}
	if (now - (ctx.lastTake.get(key) ?? 0) < ctx.follow.cooldownMs) {
		note(cycle, 'cooling down');
		return;
	}

	const params = await ctx.exchange.client.getBinaryBookParams(market.onchain.pool);
	const idle = await ctx.adapter.idleCollateral();
	const budgetHuman = Math.min(
		askAmt,
		ctx.follow.maxShares - net,
		ctx.follow.maxExposure - ctx.position.totalNet()
	);
	const want = snap(BigInt(Math.floor(budgetHuman * Number(one))), params.lotSize);
	const maxByIdle = snap(idle, params.lotSize);
	const size = want < maxByIdle ? want : maxByIdle;
	if (size < params.minQuantity || size <= 0n) {
		note(cycle, idle < params.minQuantity ? 'insufficient vault collateral' : 'below one lot');
		return;
	}

	await syncOnce(ctx, market.marketId);

	const cross = top.price + params.tickSize;
	const price = snapTick(cross, params.tickSize, one);
	const side = bullish ? SIDE.BUY_YES : SIDE.BUY_NO;
	const expiry = expireNs(market.onchain);
	const sizeHuman = Number(size) / Number(one);
	const why =
		`${ref ? `${ref.kind} ${ref.price.toFixed(2)} vs spot ${mom.spot.toFixed(2)}` : 'no reference'}, ` +
		`vol ${(expectedMove * 100).toFixed(3)}%${measured === null ? ' assumed' : ' measured'}, ` +
		`r ${useMomentum ? `${mom.r >= 0 ? '+' : ''}${mom.r.toFixed(4)}` : 'muted'}, ` +
		`tilt ${tilt >= 0 ? '+' : ''}${tilt.toFixed(3)} off market ${marketFair.toFixed(3)}, ` +
		`pUp ${pUp.toFixed(3)}, fair ${fairFav.toFixed(3)}, ask ${askPx.toFixed(3)}`;

	const placed = await sendVaultWrite(
		ctx.gate,
		'placeOrder',
		[market.marketId, side, price, size, expiry, ORDER_TYPE.MARKET],
		`${bullish ? 'BUY_YES' : 'BUY_NO'} ${sizeHuman} ${market.asset} @ ${askPx.toFixed(3)} (${why})`
	);
	if (!('dryRun' in placed) && !placed.ok) return;

	ctx.position.add(key, leg, sizeHuman);
	ctx.lastTake.set(key, now);
	await rememberMarketId(market.marketId);
	if (
		!('dryRun' in placed) &&
		placed.ok &&
		typeof placed.result === 'bigint' &&
		placed.result > 0n
	) {
		ctx.tracked.push({ marketId: market.marketId, orderId: placed.result });
	}
}

export function formatHeartbeat(cycle: FollowCycle, position: Positions): string {
	const reasons = [...cycle.skips].map(([r, n]) => `${r} ×${n}`).join(', ') || 'none';
	const b = cycle.best;
	const closest = b
		? ` · closest ${b.symbol} ref ${b.ref} vol ${b.vol} tilt ${b.tilt >= 0 ? '+' : ''}${b.tilt.toFixed(3)} fair ${b.fair.toFixed(3)} ask ${b.ask.toFixed(3)} (needs ${b.short.toFixed(3)} more)`
		: '';
	const w = cycle.widest;
	const gap = w
		? ` · ${w.symbol} model ${w.model.toFixed(3)} vs market ${w.market.toFixed(3)} (off by ${w.by.toFixed(3)})`
		: '';
	const gross = position.totalGross();
	const netTotal = position.totalNet();
	const book =
		gross === 0 ? 'flat' : `net ${netTotal}${gross === netTotal ? '' : ` of ${gross} gross`}`;
	return `idle · ${cycle.scanned} tradable · ${book} · ${reasons}${gap}${closest}`;
}
