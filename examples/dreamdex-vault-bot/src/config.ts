import { getAddress, isAddress, isHex, type Address, type Hex } from 'viem';
import { log } from './log.ts';

export const PRODUCT_CHAIN_ID = 50312;
export const DEFAULT_INTERVAL_MS = 8_000;
export const DEFAULT_MAX_SHARES = 1;
export const DEFAULT_RPC = 'https://dream-rpc.somnia.network';
export const DEFAULT_WS = 'wss://api.infra.testnet.somnia.network/ws';
export const DEFAULT_INDEXER = 'https://dev.smk.somnia.host/v1/graphql';

function env(name: string): string | undefined {
	const value = process.env[name]?.trim();
	return value ? value : undefined;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
	if (raw === undefined) return fallback;
	const v = raw.toLowerCase();
	if (v === '1' || v === 'true' || v === 'yes') return true;
	if (v === '0' || v === 'false' || v === 'no') return false;
	return fallback;
}

function parseIntEnv(name: string, fallback: number): number {
	const raw = env(name);
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseAddress(raw: string | undefined): Address | null {
	if (!raw || !isAddress(raw)) return null;
	return getAddress(raw);
}

function parsePrivateKey(raw: string | undefined): Hex | null {
	if (!raw || raw === '0x...') return null;
	const hex = raw.startsWith('0x') ? raw : `0x${raw}`;
	if (!isHex(hex) || hex.length !== 66) return null;
	return hex as Hex;
}

function parseNum(name: string, fallback: number): number {
	const raw = env(name);
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) ? n : fallback;
}

export type OracleFollowConfig = {
	windowMs: number;
	threshold: number;
	sensitivity: number;
	expectedMove: number;
	minVol: number;
	model: 'strike' | 'momentum';
	edge: number;
	minAsk: number;
	maxDisagreement: number;
	maxShares: number;
	maxExposure: number;
	cooldownMs: number;
	maxHorizons: number;
	maxSpotAgeMs: number;
	volWindowMs: number;
	nearExpiryStopMs: number | null;
	heartbeatMs: number;
	priceFeedUrl: string;
};

export type BotConfig = {
	dryRun: boolean;
	vault: Address | null;
	operatorKey: Hex | null;
	rpcUrl: string;
	wsRpcUrl: string;
	indexerUrl: string;
	intervalMs: number;
	maxShares: number;
	maxMarkets: number;
	underlying: string;
	/** Empty → any cadence. `EC_INTERVAL=15m,1h` becomes `[900, 3600]`. */
	cadenceSec: number[];
	pnlIntervalMs: number;
	seedRaw: bigint | null;
	operatorId: number;
	follow: OracleFollowConfig;
};

const CADENCE_ALIASES: Record<string, number> = {
	'1m': 60,
	'5m': 300,
	'15m': 900,
	'1h': 3600,
	'4h': 14400,
	'24h': 86400
};

export function formatCadence(sec: number): string {
	return sec >= 3600 ? `${sec / 3600}h` : `${sec / 60}m`;
}

function parseOneCadence(raw: string): number | null {
	const key = raw.toLowerCase();
	if (CADENCE_ALIASES[key] !== undefined) return CADENCE_ALIASES[key];
	const n = Number(raw);
	if (Number.isFinite(n) && n > 0) {
		const sec = Math.floor(n);
		if (Object.values(CADENCE_ALIASES).includes(sec)) return sec;
	}
	return null;
}

/** DreamDEX ladder. `15m,1h` or unset (any). Unknown tokens are skipped. */
function parseCadences(raw: string | undefined): number[] {
	if (!raw) return [];
	const out: number[] = [];
	let unknown = false;
	for (const part of raw.split(/[,\s]+/).filter(Boolean)) {
		const sec = parseOneCadence(part);
		if (sec === null) {
			unknown = true;
			continue;
		}
		if (!out.includes(sec)) out.push(sec);
	}
	if (unknown || (raw.trim() !== '' && out.length === 0)) {
		log(`unknown EC_INTERVAL=${raw} (use 5m, 15m, 1h or 15m,1h); trading ${out.length ? out.map(formatCadence).join(',') : 'any cadence'}`);
	}
	return out;
}

export function loadConfig(): BotConfig {
	return {
		dryRun: parseBool(env('DRY_RUN'), true),
		vault: parseAddress(env('VAULT_ADDRESS')),
		operatorKey: parsePrivateKey(env('OPERATOR_PRIVATE_KEY')),
		rpcUrl: env('SOMNIA_RPC_URL') || env('PUBLIC_SOMNIA_RPC_URL') || DEFAULT_RPC,
		wsRpcUrl: env('WS_RPC_URL') || DEFAULT_WS,
		indexerUrl: env('INDEXER_URL') || DEFAULT_INDEXER,
		intervalMs: parseIntEnv('OF_INTERVAL_MS', parseIntEnv('TAKE_INTERVAL_MS', DEFAULT_INTERVAL_MS)),
		maxShares: parseIntEnv('OF_MAX_SHARES', parseIntEnv('TAKE_MAX_SHARES', DEFAULT_MAX_SHARES)),
		maxMarkets: parseIntEnv('TAKE_MAX_MARKETS', 0),
		underlying: (env('EC_UNDERLYING') ?? '').toUpperCase(),
		cadenceSec: parseCadences(env('EC_INTERVAL') ?? env('EC_CADENCE')),
		pnlIntervalMs: parseIntEnv('PNL_INTERVAL_MS', 30_000),
		seedRaw: parseSeed(env('VAULT_SEED_TUSDC')),
		operatorId: parseIntEnv('OPERATOR_ID', 0),
		follow: {
			windowMs: parseIntEnv('OF_MOMENTUM_WINDOW_MS', 60_000),
			threshold: parseNum('OF_MOMENTUM_THRESHOLD', 0.0005),
			sensitivity: parseNum('OF_SENSITIVITY', 20),
			expectedMove: parseNum('OF_EXPECTED_MOVE', 0.004),
			minVol: parseNum('OF_MIN_VOL', 0.001),
			model: (env('OF_MODEL') ?? 'strike') === 'momentum' ? 'momentum' : 'strike',
			edge: parseNum('OF_EDGE', 0.08),
			minAsk: parseNum('OF_MIN_ASK', 0.1),
			maxDisagreement: parseNum('OF_MAX_DISAGREEMENT', 0.05),
			maxShares: parseIntEnv('OF_MAX_SHARES', parseIntEnv('TAKE_MAX_SHARES', DEFAULT_MAX_SHARES)),
			maxExposure: parseIntEnv('OF_MAX_EXPOSURE', 8),
			cooldownMs: parseIntEnv('OF_COOLDOWN_MS', 30_000),
			maxHorizons: parseNum('OF_MAX_HORIZONS', 15),
			maxSpotAgeMs: parseIntEnv('OF_MAX_SPOT_AGE_MS', 15_000),
			volWindowMs: parseIntEnv('OF_VOL_WINDOW_MS', 600_000),
			nearExpiryStopMs: env('OF_NEAR_EXPIRY_STOP_MS')
				? parseIntEnv('OF_NEAR_EXPIRY_STOP_MS', 0) || null
				: null,
			heartbeatMs: parseIntEnv('OF_HEARTBEAT_MS', 30_000),
			priceFeedUrl: env('PRICE_FEED_URL') ?? 'https://price-feed.dev.oracle.somnia.host/v1/graphql'
		}
	};
}

function parseSeed(raw: string | undefined): bigint | null {
	if (!raw) return null;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) return null;
	return BigInt(Math.round(n * 1_000_000));
}
