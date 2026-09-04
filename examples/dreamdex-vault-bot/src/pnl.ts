import { type BinaryPositionPnL, type OpenPositionPnL } from '@somnia-chain/markets-sdk';
import type { Address, Hex } from 'viem';
import type { VaultAdapter } from './adapter.ts';
import type { ReadExchange } from './discover.ts';
import { errorMessage, log } from './log.ts';

const STATUS = ['Listed', 'Trading', 'Locked', 'Settling', 'Resolved', 'Voided'] as const;

type BetRow = {
	marketId: Hex;
	asset: string;
	status: string;
	decimals: number;
	yes: bigint;
	no: bigint;
	costBasis: bigint;
	markValue: bigint | null;
	unrealized: bigint | null;
	realized: bigint;
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

function asMarketId(id: string): Hex {
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

function fmt(raw: bigint, decimals: number): string {
	const n = Number(raw) / 10 ** decimals;
	if (!Number.isFinite(n)) return raw.toString();
	return n.toFixed(4);
}

function fmtSigned(raw: bigint | null, decimals: number): string {
	if (raw === null) return 'n/a';
	const n = Number(raw) / 10 ** decimals;
	if (!Number.isFinite(n)) return raw.toString();
	return `${n >= 0 ? '+' : ''}${n.toFixed(4)}`;
}

function fromSdk(
	marketId: Hex,
	pnl: BinaryPositionPnL,
	meta: { asset: string; status: string; decimals: number }
): BetRow {
	return {
		marketId,
		asset: meta.asset,
		status: meta.status,
		decimals: meta.decimals,
		yes: pnl.balanceYes,
		no: pnl.balanceNo,
		costBasis: pnl.costBasis,
		markValue: pnl.markValue,
		unrealized: pnl.unrealizedPnl,
		realized: pnl.realizedPnl
	};
}

async function markOnchain(
	exchange: ReadExchange,
	adapter: VaultAdapter,
	marketId: Hex
): Promise<BetRow> {
	const onchain = await exchange.client.getMarketOnchain(marketId);
	const decimals = onchain.decimals || 6;
	const one = 10n ** BigInt(decimals);
	const [yes, no] = await Promise.all([
		adapter.outcomeBalance(onchain.outcomeToken, onchain.yesId),
		adapter.outcomeBalance(onchain.outcomeToken, onchain.noId)
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
			? `Resolved(${onchain.winningOutcome === 0 ? 'YES' : 'NO'})`
			: (STATUS[onchain.status] ?? String(onchain.status));
	return {
		marketId,
		asset: 'ec',
		status,
		decimals,
		yes,
		no,
		costBasis: 0n,
		markValue,
		unrealized: null,
		realized: 0n
	};
}

async function rowForId(
	exchange: ReadExchange,
	adapter: VaultAdapter,
	vault: Address,
	marketId: Hex,
	open: Map<string, OpenPositionPnL>
): Promise<BetRow> {
	const hit = open.get(asMarketId(marketId));
	if (hit) {
		return fromSdk(marketId, hit, {
			asset: hit.market.asset || 'mkt',
			status: hit.market.status,
			decimals: hit.market.quoteDecimals || 6
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
			asset: market?.asset || 'mkt',
			status: market?.status ?? 'unknown',
			decimals: market?.quoteDecimals || 6
		});
	} catch (error) {
		const msg = errorMessage(error);
		if (!msg.includes('no binary market')) {
			log(`pnl ${shortId(marketId)} indexer miss (${msg}); marking on-chain`);
		}
		return await markOnchain(exchange, adapter, marketId);
	}
}

function logRow(row: BetRow): void {
	log(
		`pnl ${row.asset} ${shortId(row.marketId)} ${row.status} yes=${fmt(row.yes, row.decimals)} no=${fmt(row.no, row.decimals)} cost=${fmt(row.costBasis, row.decimals)} mark=${row.markValue === null ? 'n/a' : fmt(row.markValue, row.decimals)} u=${fmtSigned(row.unrealized, row.decimals)} r=${fmtSigned(row.realized, row.decimals)}`
	);
}

/**
 * Per-bet mark PnL for every marketId the bot has minted or placed on.
 * Account is the vault (not the operator). Indexer avg-cost when available;
 * otherwise on-chain YES/NO marked to book or settlement.
 */
export async function reportVaultPnl(opts: {
	exchange: ReadExchange;
	adapter: VaultAdapter;
	vault: Address;
	marketIds: Iterable<Hex>;
	seedRaw?: bigint | null;
}): Promise<void> {
	const ids = [...new Set([...opts.marketIds].map((id) => asMarketId(id)))];
	if (ids.length === 0) {
		log('pnl no bets in .state yet');
		return;
	}

	let open = new Map<string, OpenPositionPnL>();
	try {
		const rows = await withTimeout(
			opts.exchange.client.getOpenPositionsWithPnL(opts.vault),
			20_000,
			'getOpenPositionsWithPnL'
		);
		for (const row of rows) {
			open.set(asMarketId(row.market.id), row);
		}
	} catch (error) {
		log(`pnl open-positions miss (${errorMessage(error)}); per-market fallback`);
	}

	const rows: BetRow[] = [];
	for (let i = 0; i < ids.length; i += 3) {
		const chunk = ids.slice(i, i + 3);
		const part = await Promise.all(
			chunk.map((id) => rowForId(opts.exchange, opts.adapter, opts.vault, id, open))
		);
		rows.push(...part);
	}

	let markSum = 0n;
	let markKnown = true;
	let uSum = 0n;
	let uAny = false;
	let rSum = 0n;
	let decimals = 6;
	for (const row of rows) {
		decimals = row.decimals || decimals;
		logRow(row);
		if (row.markValue === null) markKnown = false;
		else markSum += row.markValue;
		if (row.unrealized !== null) {
			uSum += row.unrealized;
			uAny = true;
		}
		rSum += row.realized;
	}

	const idle = await opts.adapter.idleCollateral();
	const nav = markKnown ? idle + markSum : null;
	const seedBit =
		opts.seedRaw && opts.seedRaw > 0n && nav !== null
			? ` vsSeed=${fmtSigned(nav - opts.seedRaw, decimals)}`
			: '';
	log(
		`pnl vault bets=${rows.length} idle=${fmt(idle, decimals)} inventory=${markKnown ? fmt(markSum, decimals) : 'n/a'} nav=${nav === null ? 'n/a' : fmt(nav, decimals)} uPnL=${uAny ? fmtSigned(uSum, decimals) : 'n/a'} rPnL=${fmtSigned(rSum, decimals)}${seedBit}`
	);
}
