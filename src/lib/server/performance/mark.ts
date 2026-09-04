import {
	type BinaryPositionPnL,
	type BinarySide,
	type FillRow,
	type OpenPositionPnL,
	type SomniaMarkets
} from '@somnia-chain/markets-sdk';
import { erc20Abi, getAddress, type Address, type Hex, type PublicClient } from 'viem';
import { errorMessage, log } from './log';

const TAPE_PAGE = 50;
const TAPE_MAX_PAGES = 40;

const erc6909Abi = [
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'id', type: 'uint256' }
		],
		outputs: [{ type: 'uint256' }]
	}
] as const;

export type FightDraft = {
	marketId: Hex;
	date: string;
	window: '15m' | '1h';
	market: 'BTC' | 'ETH';
	side: 'up' | 'down';
	pnlAssets: bigint;
	settledAt: number;
};

export type VaultMark = {
	tvlAssets: bigint;
	pnlAssets: bigint;
	realizedPnlAssets: bigint;
	unrealizedPnlAssets: bigint | null;
	fights: FightDraft[];
};

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
	});
	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timer !== undefined) clearTimeout(timer);
	}
}

export function asMarketId(id: string): Hex {
	let h = id.toLowerCase();
	if (h.startsWith('0x')) h = h.slice(2);
	h = h.replace(/^0+/, '') || '0';
	return `0x${h.padStart(64, '0')}` as Hex;
}

function shortId(marketId: string): string {
	let h = marketId.toLowerCase();
	if (h.startsWith('0x')) h = h.slice(2);
	h = h.replace(/^0+/, '') || '0';
	return `0x${h}`;
}

type PositionRow = {
	marketId: Hex;
	asset: string;
	status: string;
	interval: string | null;
	intervalSec: string | null;
	expirySec: number | null;
	resolvedAtSec: number | null;
	winningOutcome: number | null;
	voided: boolean;
	yes: bigint;
	no: bigint;
	markValue: bigint | null;
	unrealized: bigint | null;
	realized: bigint;
};

function toWindow(interval: string | null, intervalSec: string | null): '15m' | '1h' {
	const label = (interval ?? '').toLowerCase();
	if (label === '1h' || label === '4h' || label === '24h') return '1h';
	if (label === '15m' || label === '5m' || label === '1m') return '15m';
	const sec = Number(intervalSec);
	if (Number.isFinite(sec) && sec >= 3600) return '1h';
	return '15m';
}

function toMarket(asset: string): 'BTC' | 'ETH' {
	return asset.toUpperCase().includes('ETH') ? 'ETH' : 'BTC';
}

function betSideFromBinary(side: BinarySide | null | undefined): 'up' | 'down' | null {
	if (side === 'BUY_YES' || side === 'SELL_NO') return 'up';
	if (side === 'BUY_NO' || side === 'SELL_YES') return 'down';
	return null;
}

function fillBetSide(fill: FillRow, vault: string): 'up' | 'down' | null {
	const account = vault.toLowerCase();
	if (fill.taker?.toLowerCase() === account) {
		return betSideFromBinary(fill.takerOrder?.side ?? fill.takerSide);
	}
	if (fill.maker?.toLowerCase() === account) {
		return betSideFromBinary(fill.makerSide);
	}
	return null;
}

function toSide(row: PositionRow, fillSide?: 'up' | 'down'): 'up' | 'down' {
	if (row.yes > 0n || row.no > 0n) return row.yes >= row.no ? 'up' : 'down';
	if (fillSide) return fillSide;
	if (row.winningOutcome === 1) return 'down';
	return 'up';
}

function settledAt(row: PositionRow): number {
	if (row.resolvedAtSec && row.resolvedAtSec > 0) return row.resolvedAtSec * 1000;
	if (row.expirySec && row.expirySec > 0) return row.expirySec * 1000;
	return Date.now();
}

function isoDate(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

function isSettled(row: PositionRow): boolean {
	const status = row.status.toLowerCase();
	return (
		row.voided ||
		status.includes('resolved') ||
		status.includes('voided') ||
		status.includes('finalized')
	);
}

async function pageTape<T>(
	label: string,
	fetchPage: (offset: number) => Promise<T[]>
): Promise<T[]> {
	const rows: T[] = [];
	for (let page = 0; page < TAPE_MAX_PAGES; page++) {
		const offset = page * TAPE_PAGE;
		const chunk = await withTimeout(fetchPage(offset), 20_000, `${label} offset ${offset}`);
		rows.push(...chunk);
		if (chunk.length < TAPE_PAGE) return rows;
	}
	log(`${label} truncated at ${rows.length} rows`);
	return rows;
}

function fightPnl(row: PositionRow): bigint {
	if (row.unrealized !== null) return row.realized + row.unrealized;
	return row.realized;
}

async function idleCollateral(
	publicClient: PublicClient,
	vault: Address,
	asset: Address
): Promise<bigint> {
	return await publicClient.readContract({
		address: asset,
		abi: erc20Abi,
		functionName: 'balanceOf',
		args: [vault]
	});
}

async function outcomeBalance(
	publicClient: PublicClient,
	token: Address,
	vault: Address,
	id: bigint
): Promise<bigint> {
	return await publicClient.readContract({
		address: token,
		abi: erc6909Abi,
		functionName: 'balanceOf',
		args: [vault, id]
	});
}

function fromSdk(
	marketId: Hex,
	pnl: BinaryPositionPnL,
	meta: {
		asset: string;
		status: string;
		interval: string | null;
		intervalSec: string | null;
		expirySec: number | null;
		resolvedAtSec: number | null;
		winningOutcome: number | null;
		voided: boolean;
	}
): PositionRow {
	return {
		marketId,
		asset: meta.asset,
		status: meta.status,
		interval: meta.interval,
		intervalSec: meta.intervalSec,
		expirySec: meta.expirySec,
		resolvedAtSec: meta.resolvedAtSec,
		winningOutcome: meta.winningOutcome,
		voided: meta.voided,
		yes: pnl.balanceYes,
		no: pnl.balanceNo,
		markValue: pnl.markValue,
		unrealized: pnl.unrealizedPnl,
		realized: pnl.realizedPnl
	};
}

async function markOnchain(
	exchange: SomniaMarkets,
	publicClient: PublicClient,
	vault: Address,
	marketId: Hex
): Promise<PositionRow> {
	const onchain = await exchange.client.getMarketOnchain(marketId);
	const decimals = onchain.decimals || 6;
	const one = 10n ** BigInt(decimals);
	const [yes, no] = await Promise.all([
		outcomeBalance(publicClient, onchain.outcomeToken, vault, onchain.yesId),
		outcomeBalance(publicClient, onchain.outcomeToken, vault, onchain.noId)
	]);
	let yesPrice: bigint | null = null;
	if (onchain.isResolved) {
		yesPrice = onchain.winningOutcome === 0 ? one : 0n;
	} else if (onchain.isVoided) {
		yesPrice = one / 2n;
	} else {
		try {
			const book = await exchange.client.getBinaryOrderBook(onchain.pool, {
				depth: 1,
				decimals
			});
			const bid = book.yesBids[0]?.price;
			const ask = book.yesAsks[0]?.price;
			if (bid !== undefined && ask !== undefined) yesPrice = (bid + ask) / 2n;
			else yesPrice = ask ?? bid ?? null;
		} catch {
			yesPrice = null;
		}
	}
	const noPrice = yesPrice === null ? null : one - yesPrice;
	const markValue =
		yesPrice === null || noPrice === null ? null : (yes * yesPrice) / one + (no * noPrice) / one;
	const status = onchain.isVoided
		? 'Voided'
		: onchain.isResolved
			? 'Resolved'
			: String(onchain.status);
	let market: { asset?: string; interval?: string | null; intervalSec?: string | null } | null =
		null;
	try {
		market = await exchange.client.getBinaryMarket(marketId);
	} catch {
		market = null;
	}
	return {
		marketId,
		asset: market?.asset || 'BTC',
		status,
		interval: market?.interval ?? null,
		intervalSec: market?.intervalSec ?? null,
		expirySec: Number(onchain.expiry),
		resolvedAtSec: onchain.isResolved || onchain.isVoided ? Number(onchain.expiry) : null,
		winningOutcome: onchain.isResolved ? onchain.winningOutcome : null,
		voided: onchain.isVoided,
		yes,
		no,
		markValue,
		unrealized: null,
		realized: 0n
	};
}

async function rowForId(
	exchange: SomniaMarkets,
	publicClient: PublicClient,
	vault: Address,
	marketId: Hex,
	open: Map<string, OpenPositionPnL>
): Promise<PositionRow> {
	const hit = open.get(asMarketId(marketId));
	if (hit) {
		return fromSdk(marketId, hit, {
			asset: hit.market.asset || 'BTC',
			status: hit.market.status,
			interval: hit.market.interval,
			intervalSec: hit.market.intervalSec,
			expirySec: Number(hit.market.expiry) || null,
			resolvedAtSec: null,
			winningOutcome: hit.market.winningOutcome ?? null,
			voided: hit.market.voided
		});
	}
	try {
		const [pnl, market] = await Promise.all([
			withTimeout(
				exchange.client.getBinaryPositionPnL(vault, marketId),
				12_000,
				`pnl ${shortId(marketId)}`
			),
			exchange.client.getBinaryMarket(marketId).catch(() => null)
		]);
		return fromSdk(asMarketId(marketId), pnl, {
			asset: market?.asset || 'BTC',
			status: market?.status ?? 'unknown',
			interval: market?.interval ?? null,
			intervalSec: market?.intervalSec ?? null,
			expirySec: market ? Number(market.expiry) || null : null,
			resolvedAtSec: market?.resolvedAtTimestamp ? Number(market.resolvedAtTimestamp) : null,
			winningOutcome: market?.winningOutcome ?? null,
			voided: Boolean(market?.voided)
		});
	} catch (error) {
		const msg = errorMessage(error);
		if (!msg.includes('no binary market')) {
			log(`mark ${shortId(marketId)} indexer miss (${msg}); marking on-chain`);
		}
		return await markOnchain(exchange, publicClient, vault, marketId);
	}
}

async function collectMarketIds(
	exchange: SomniaMarkets,
	vault: Address,
	storedIds: Iterable<string>
): Promise<{ ids: Hex[]; fillSide: Map<string, 'up' | 'down'> }> {
	const ids = new Set<string>();
	const fillSide = new Map<string, 'up' | 'down'>();
	for (const id of storedIds) ids.add(asMarketId(id));
	try {
		const fills = await pageTape('getUserFills', (offset) =>
			exchange.client.getUserFills(vault, { limit: TAPE_PAGE, offset })
		);
		for (const fill of fills) {
			if (!fill.market) continue;
			const id = asMarketId(fill.market);
			ids.add(id);
			if (!fillSide.has(id)) {
				const side = fillBetSide(fill, vault);
				if (side) fillSide.set(id, side);
			}
		}
	} catch (error) {
		log(`fills miss (${errorMessage(error)})`);
	}
	try {
		const actions = await pageTape('getRouterActions', (offset) =>
			exchange.client.getRouterActions(vault, { limit: TAPE_PAGE, offset })
		);
		for (const action of actions) {
			if (action.market) ids.add(asMarketId(action.market));
		}
	} catch (error) {
		log(`router-actions miss (${errorMessage(error)})`);
	}
	try {
		const open = await withTimeout(
			exchange.client.getOpenPositionsWithPnL(vault),
			20_000,
			'getOpenPositionsWithPnL'
		);
		for (const row of open) ids.add(asMarketId(row.market.id));
	} catch (error) {
		log(`open-positions miss (${errorMessage(error)})`);
	}
	try {
		const claimable = await withTimeout(
			exchange.client.getClaimable(vault),
			20_000,
			'getClaimable'
		);
		for (const row of claimable) ids.add(asMarketId(row.marketId));
	} catch (error) {
		log(`claimable miss (${errorMessage(error)})`);
	}
	return { ids: [...ids].map((id) => asMarketId(id)), fillSide };
}

export async function markVault(opts: {
	exchange: SomniaMarkets;
	publicClient: PublicClient;
	vault: Address;
	asset: Address;
	storedMarketIds: Iterable<string>;
}): Promise<VaultMark> {
	const vault = getAddress(opts.vault);
	const asset = getAddress(opts.asset);
	const { ids, fillSide } = await collectMarketIds(opts.exchange, vault, opts.storedMarketIds);

	let open = new Map<string, OpenPositionPnL>();
	try {
		const rows = await withTimeout(
			opts.exchange.client.getOpenPositionsWithPnL(vault),
			20_000,
			'getOpenPositionsWithPnL'
		);
		for (const row of rows) {
			open.set(asMarketId(row.market.id), row);
		}
	} catch (error) {
		log(`open-positions miss (${errorMessage(error)}); per-market fallback`);
	}

	const rows: PositionRow[] = [];
	for (let i = 0; i < ids.length; i += 3) {
		const chunk = ids.slice(i, i + 3);
		const part = await Promise.all(
			chunk.map((id) => rowForId(opts.exchange, opts.publicClient, vault, id, open))
		);
		rows.push(...part);
	}

	let markSum = 0n;
	let markKnown = true;
	let uSum = 0n;
	let uAny = false;
	let rSum = 0n;
	const fights: FightDraft[] = [];
	for (const row of rows) {
		if (row.markValue === null) markKnown = false;
		else markSum += row.markValue;
		if (row.unrealized !== null) {
			uSum += row.unrealized;
			uAny = true;
		}
		rSum += row.realized;
		if (isSettled(row)) {
			const at = settledAt(row);
			fights.push({
				marketId: row.marketId,
				date: isoDate(at),
				window: toWindow(row.interval, row.intervalSec),
				market: toMarket(row.asset),
				side: toSide(row, fillSide.get(row.marketId)),
				pnlAssets: fightPnl(row),
				settledAt: at
			});
		}
	}

	const idle = await idleCollateral(opts.publicClient, vault, asset);
	const tvlAssets = markKnown ? idle + markSum : idle;
	const pnlAssets = uAny ? rSum + uSum : rSum;
	return {
		tvlAssets,
		pnlAssets,
		realizedPnlAssets: rSum,
		unrealizedPnlAssets: uAny ? uSum : null,
		fights
	};
}
