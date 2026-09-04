export const PRODUCT_CHAIN_ID = 50312;
export const DEFAULT_INTERVAL_MS = 30_000;
export const DEFAULT_RPC = 'https://dream-rpc.somnia.network';
export const DEFAULT_WS = 'wss://api.infra.testnet.somnia.network/ws';
export const DEFAULT_INDEXER = 'https://dev.smk.somnia.host/v1/graphql';

function env(name: string): string | undefined {
	const value = process.env[name]?.trim();
	return value ? value : undefined;
}

function parseIntEnv(name: string, fallback: number): number {
	const raw = env(name);
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export type PerformanceConfig = {
	databaseUrl: string;
	rpcUrl: string;
	wsRpcUrl: string;
	indexerUrl: string;
	intervalMs: number;
};

export function loadConfig(): PerformanceConfig {
	const databaseUrl = env('DATABASE_URL');
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is not set');
	}
	return {
		databaseUrl,
		rpcUrl: env('SOMNIA_RPC_URL') || env('PUBLIC_SOMNIA_RPC_URL') || DEFAULT_RPC,
		wsRpcUrl: env('WS_RPC_URL') || DEFAULT_WS,
		indexerUrl: env('INDEXER_URL') || DEFAULT_INDEXER,
		intervalMs: parseIntEnv('STATS_INTERVAL_MS', DEFAULT_INTERVAL_MS)
	};
}
