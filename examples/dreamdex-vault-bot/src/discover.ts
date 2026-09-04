import {
	SOMNIA_TESTNET_ADDRESSES,
	SOMNIA_TESTNET_PRICE_FEED,
	SomniaMarkets,
	type BinaryMarket,
	type LiveBinaryMarketsFilter,
	type MarketOnchain
} from '@somnia-chain/markets-sdk';
import { somniaShannon } from '@somnia-chain/markets-sdk/chains';
import { getAddress, parseAbi, type Address, type Hex, type PublicClient } from 'viem';
import { errorMessage, log } from './log.ts';

const moduleMarketsAbi = parseAbi([
	'function markets(bytes32 marketId) view returns (uint256 oracleQuestionId, uint8 outcomeSlotCount, uint8 voidPolicy, address collateral, uint32 originOperatorId, bytes32 originVenueId, address oracleAdapter, address creator, address market, address pool, uint256 yesId, uint256 noId, uint64 tradingStart, uint64 expiry)'
]);

const moduleCreatedAbi = [
	{
		type: 'event',
		name: 'MarketCreated',
		inputs: [
			{ name: 'marketId', type: 'bytes32', indexed: true },
			{ name: 'market', type: 'address', indexed: true },
			{ name: 'pool', type: 'address', indexed: true },
			{ name: 'oracleQuestionId', type: 'uint256', indexed: false },
			{ name: 'operatorId', type: 'uint32', indexed: false },
			{ name: 'venueId', type: 'bytes32', indexed: false },
			{ name: 'creator', type: 'address', indexed: false },
			{ name: 'collateral', type: 'address', indexed: false },
			{ name: 'yesId', type: 'uint256', indexed: false },
			{ name: 'noId', type: 'uint256', indexed: false },
			{ name: 'nonce', type: 'uint64', indexed: false },
			{ name: 'outcomeSlotCount', type: 'uint8', indexed: false },
			{ name: 'marketType', type: 'uint8', indexed: false },
			{ name: 'tradingStart', type: 'uint64', indexed: false },
			{ name: 'expiry', type: 'uint64', indexed: false },
			{ name: 'voidPolicy', type: 'uint8', indexed: false },
			{ name: 'asset', type: 'string', indexed: false },
			{ name: 'strike', type: 'uint256', indexed: false },
			{ name: 'question', type: 'string', indexed: false },
			{ name: 'context', type: 'bytes', indexed: false }
		]
	}
] as const;

export type ReadExchange = SomniaMarkets;

export function createReadExchange(opts: {
	indexerUrl: string;
	wsRpcUrl: string;
	priceFeedUrl?: string;
}): ReadExchange {
	return new SomniaMarkets({
		indexerUrl: opts.indexerUrl,
		chain: somniaShannon,
		wsRpcUrl: opts.wsRpcUrl,
		addresses: SOMNIA_TESTNET_ADDRESSES,
		priceFeed: opts.priceFeedUrl
			? { url: opts.priceFeedUrl, quote: 'USDC' }
			: SOMNIA_TESTNET_PRICE_FEED
	});
}

export const TUSDC = getAddress(
	SOMNIA_TESTNET_ADDRESSES.testUsdc ??
		SOMNIA_TESTNET_ADDRESSES.collateral ??
		'0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E'
);

export type EligibleMarket = {
	marketId: Hex;
	symbol: string;
	asset: string;
	strike: string;
	collateral: Address;
	intervalSec: number;
	onchain: MarketOnchain;
};

function minLeftSec(intervalSec: number): number {
	const window = intervalSec > 0 ? intervalSec : 900;
	return Math.max(30, Math.min(300, Math.floor(window * 0.4)));
}

const CADENCE_LADDER = [60, 300, 900, 3600, 14400, 86400] as const;
const CADENCE_TOLERANCE_SEC = 5;

function snapCadence(sec: number): number {
	if (!Number.isFinite(sec) || sec <= 0) return 0;
	for (const rung of CADENCE_LADDER) {
		if (Math.abs(sec - rung) <= CADENCE_TOLERANCE_SEC) return rung;
	}
	return Math.round(sec);
}

function matchesCadence(intervalSec: number, wanted: number): boolean {
	if (!wanted) return true;
	return snapCadence(intervalSec) === wanted;
}

function asMarketId(id: string): Hex {
	return (id.startsWith('0x') ? id : `0x${id}`) as Hex;
}

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

async function fromIndexer(
	exchange: ReadExchange,
	underlying: string,
	cadenceSec: number,
	operatorId: number
): Promise<BinaryMarket[]> {
	const filter: LiveBinaryMarketsFilter = {};
	if (underlying) filter.asset = underlying;
	if (cadenceSec > 0) filter.intervalSec = cadenceSec;
	if (operatorId > 0) filter.operatorId = operatorId;
	filter.limit = 20;
	filter.status = 'Trading';
	const run = () =>
		withTimeout(
			exchange.client.listLiveBinaryMarkets(filter),
			20_000,
			'indexer listLiveBinaryMarkets'
		);
	try {
		return await run();
	} catch (first) {
		log(`indexer retry after ${errorMessage(first)}`);
		await new Promise((r) => setTimeout(r, 1_000));
		return await run();
	}
}

async function fromLogs(
	publicClient: PublicClient,
	underlying: string,
	cadenceSec: number
): Promise<
	{
		marketId: Hex;
		asset: string;
		collateral: Address;
		expiry: bigint;
		tradingStart: number;
		intervalSec: number;
		strike: string;
	}[]
> {
	const creator = SOMNIA_TESTNET_ADDRESSES.binaryModule;
	if (!creator) return [];
	const head = await publicClient.getBlockNumber();
	const now = BigInt(Math.floor(Date.now() / 1000));
	const found: {
		marketId: Hex;
		asset: string;
		collateral: Address;
		expiry: bigint;
		tradingStart: number;
		intervalSec: number;
		strike: string;
	}[] = [];
	const windows = cadenceSec >= 3600 ? 12 : cadenceSec >= 900 ? 8 : cadenceSec > 0 ? 6 : 12;
	log(`MarketCreated log fallback, last ${windows * 1000} blocks`);
	for (let i = 0; i < windows; i++) {
		const to = head - BigInt(i * 1000);
		const from = to >= 999n ? to - 999n : 0n;
		try {
			const logs = await publicClient.getLogs({
				address: creator,
				event: moduleCreatedAbi[0],
				fromBlock: from,
				toBlock: to
			});
			for (const row of logs) {
				const args = row.args;
				if (!args.marketId || !args.collateral || !args.expiry) continue;
				if (args.expiry <= now + 90n) continue;
				if (args.tradingStart !== undefined && args.tradingStart > now) continue;
				const asset = (args.asset ?? '').toUpperCase();
				if (underlying && !asset.includes(underlying)) continue;
				const intervalSec = Number((args.expiry ?? 0n) - (args.tradingStart ?? 0n));
				if (!matchesCadence(intervalSec, cadenceSec)) continue;
				found.push({
					marketId: args.marketId,
					asset: args.asset ?? '',
					collateral: getAddress(args.collateral),
					expiry: args.expiry,
					tradingStart: Number(args.tradingStart ?? 0n),
					intervalSec,
					strike: args.strike !== undefined ? String(args.strike) : '0'
				});
			}
		} catch {
			continue;
		}
		if (from === 0n) break;
	}
	return found;
}

export async function discoverEligible(opts: {
	exchange: ReadExchange;
	publicClient: PublicClient;
	vaultAsset: Address | null;
	underlying: string;
	cadenceSec: number;
	operatorId: number;
}): Promise<EligibleMarket[]> {
	let rows: BinaryMarket[] = [];
	let indexerOk = false;
	try {
		rows = await fromIndexer(opts.exchange, opts.underlying, opts.cadenceSec, opts.operatorId);
		indexerOk = true;
	} catch (error) {
		log(`indexer discover failed (${errorMessage(error)}); falling back to MarketCreated logs`);
	}

	const eligible: EligibleMarket[] = [];
	const seen = new Set<string>();

	const consider = async (input: {
		marketId: Hex;
		asset: string;
		collateral?: Address;
		intervalSec?: number;
		tradingStart?: number;
		strike?: string;
	}): Promise<void> => {
		if (seen.has(input.marketId.toLowerCase())) return;
		seen.add(input.marketId.toLowerCase());
		if (opts.underlying && !input.asset.toUpperCase().includes(opts.underlying)) {
			return;
		}
		let onchain: MarketOnchain;
		try {
			onchain = await opts.exchange.client.getMarketOnchain(input.marketId);
		} catch (error) {
			log(`${input.marketId} on-chain read failed: ${errorMessage(error)}`);
			return;
		}
		if (onchain.status !== 1) return;
		const now = Date.now() / 1000;
		let tradingStart = input.tradingStart && input.tradingStart > 0 ? input.tradingStart : 0;
		let expiry = Number(onchain.expiry);
		const moduleAddr = SOMNIA_TESTNET_ADDRESSES.binaryModule;
		if (moduleAddr) {
			try {
				const rec = await opts.publicClient.readContract({
					address: moduleAddr,
					abi: moduleMarketsAbi,
					functionName: 'markets',
					args: [input.marketId]
				});
				tradingStart = Number(rec[12]);
				expiry = Number(rec[13]);
			} catch (error) {
				log(`${input.marketId} module window read failed: ${errorMessage(error)}`);
			}
		}
		// Vault mintCompleteSet reverts MarketNotTrading unless clock is inside
		// module tradingStart/expiry — on-chain status() can still say Trading.
		if (now < tradingStart) return;
		const intervalSec =
			input.intervalSec && input.intervalSec > 0
				? input.intervalSec
				: tradingStart > 0 && expiry > tradingStart
					? expiry - tradingStart
					: 900;
		if (expiry - now < minLeftSec(intervalSec)) return;
		if (!matchesCadence(intervalSec, opts.cadenceSec)) return;

		const marketCollateral = getAddress(onchain.collateral);
		if (opts.vaultAsset && getAddress(opts.vaultAsset) !== marketCollateral) {
			log(
				`collateral mismatch ${input.asset} ${input.marketId}: vault ${opts.vaultAsset} vs market ${marketCollateral} (hackathon tUSDC ${TUSDC})`
			);
			return;
		}
		if (getAddress(TUSDC) !== marketCollateral) {
			log(
				`collateral mismatch ${input.asset} ${input.marketId}: market ${marketCollateral} is not tUSDC ${TUSDC}`
			);
			return;
		}

		eligible.push({
			marketId: input.marketId,
			symbol: `${input.asset}-${input.marketId.slice(0, 10)}`,
			asset: input.asset,
			strike: input.strike ?? '0',
			collateral: marketCollateral,
			intervalSec,
			onchain
		});
	};

	if (indexerOk) {
		for (const row of rows) {
			await consider({
				marketId: asMarketId(row.marketId),
				asset: row.asset,
				collateral: getAddress(row.collateral),
				intervalSec: Number(row.intervalSec ?? 0),
				tradingStart: Number(row.tradingStart ?? 0),
				strike: row.strike ?? '0'
			});
		}
		eligible.sort((a, b) => Number(b.onchain.expiry) - Number(a.onchain.expiry));
		return eligible;
	}

	try {
		const logged = await fromLogs(opts.publicClient, opts.underlying, opts.cadenceSec);
		for (const row of logged) {
			await consider(row);
		}
	} catch (error) {
		log(`log discover failed: ${errorMessage(error)}`);
	}
	eligible.sort((a, b) => Number(b.onchain.expiry) - Number(a.onchain.expiry));
	return eligible;
}
