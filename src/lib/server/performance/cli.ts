import { createPublicClient, http } from 'viem';
import { somniaShannon } from '@somnia-chain/markets-sdk/chains';
import { loadConfig } from './config';
import { runCycle } from './cycle';
import { openPerformanceDb } from './db';
import { createReadExchange } from './exchange';
import { errorMessage, log } from './log';

const sleep = async (ms: number, stopped: () => boolean): Promise<void> => {
	for (let t = 0; t < ms; t += 500) {
		if (stopped()) return;
		await new Promise((r) => setTimeout(r, Math.min(500, ms - t)));
	}
};

async function main(): Promise<void> {
	const cfg = loadConfig();
	const store = openPerformanceDb(cfg.databaseUrl);
	const publicClient = createPublicClient({
		chain: somniaShannon,
		transport: http(cfg.rpcUrl)
	});
	const exchange = createReadExchange({
		indexerUrl: cfg.indexerUrl,
		wsRpcUrl: cfg.wsRpcUrl
	});

	log(`bot-performance up rpc=${cfg.rpcUrl} interval=${cfg.intervalMs}ms db=${cfg.databaseUrl}`);

	let stop = false;
	const onStop = (): void => {
		stop = true;
	};
	process.on('SIGINT', onStop);
	process.on('SIGTERM', onStop);

	while (!stop) {
		try {
			await runCycle({ db: store.db, publicClient, exchange });
		} catch (error) {
			log(`cycle failed: ${errorMessage(error)}`);
		}
		await sleep(cfg.intervalMs, () => stop);
	}

	log('bot-performance stopped');
	await exchange.close().catch(() => undefined);
	store.close();
}

main().catch((error) => {
	console.error(errorMessage(error));
	process.exit(1);
});
