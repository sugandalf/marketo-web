import { privateKeyToAccount } from 'viem/accounts';
import {
	createPublicClient,
	createWalletClient,
	http,
	type Account,
	type Address,
	type WalletClient
} from 'viem';
import { somniaShannon } from '@somnia-chain/markets-sdk/chains';
import { createVaultAdapter, type VaultAdapter } from './adapter.ts';
import { formatCadence, loadConfig } from './config.ts';
import { cancelTracked, claimSettled, redeemVaultPositions, type CycleContext } from './cycle.ts';
import { createReadExchange, discoverEligible, TUSDC } from './discover.ts';
import { formatHeartbeat, newFollowCycle, takeFollow, type FollowContext } from './follow.ts';
import { errorMessage, log } from './log.ts';
import { reportVaultPnl } from './pnl.ts';
import { Positions } from './position.ts';
import { referenceReader, sdkSpotReader, SpotHistory } from './signal.ts';
import { loadTradedMarketIds } from './state.ts';
import { assertProductChain, type WriteGate } from './writes.ts';

const sleep = async (ms: number, stopped: () => boolean): Promise<void> => {
	for (let t = 0; t < ms; t += 500) {
		if (stopped()) return;
		await new Promise((r) => setTimeout(r, Math.min(500, ms - t)));
	}
};

async function main(): Promise<void> {
	const cfg = loadConfig();
	if (!cfg.dryRun && !cfg.operatorKey) {
		log('live mode requires OPERATOR_PRIVATE_KEY');
		process.exit(1);
	}
	if (!cfg.dryRun && !cfg.vault) {
		log('live mode requires VAULT_ADDRESS');
		process.exit(1);
	}

	const publicClient = createPublicClient({
		chain: somniaShannon,
		transport: http(cfg.rpcUrl)
	});

	let account: Account | null = null;
	let walletClient: WalletClient | null = null;
	if (cfg.operatorKey) {
		account = privateKeyToAccount(cfg.operatorKey);
		walletClient = createWalletClient({
			account,
			chain: somniaShannon,
			transport: http(cfg.rpcUrl)
		});
	}

	let adapter: VaultAdapter | null = null;
	let vaultAsset: Address | null = null;
	if (cfg.vault) {
		adapter = createVaultAdapter({
			vault: cfg.vault,
			asset: TUSDC,
			publicClient,
			...(walletClient && account ? { walletClient, account } : {})
		});
		try {
			vaultAsset = await adapter.vaultAsset();
			if (vaultAsset.toLowerCase() !== TUSDC.toLowerCase()) {
				log(`vault.asset() ${vaultAsset} is not tUSDC ${TUSDC} — markets will be skipped`);
			}
		} catch (error) {
			log(`could not read vault.asset(): ${errorMessage(error)}`);
		}
	}

	const gate: WriteGate = {
		dryRun: cfg.dryRun,
		hasKey: Boolean(cfg.operatorKey),
		publicClient,
		walletClient,
		account,
		adapter
	};

	const exchange = createReadExchange({
		indexerUrl: cfg.indexerUrl,
		wsRpcUrl: cfg.wsRpcUrl,
		priceFeedUrl: cfg.follow.priceFeedUrl
	});
	const settle: CycleContext = { gate, adapter, exchange, tracked: [] };
	const follow: FollowContext = {
		gate,
		adapter,
		exchange,
		follow: cfg.follow,
		spot: sdkSpotReader(exchange),
		refs: referenceReader(exchange),
		history: new SpotHistory(cfg.follow.windowMs, cfg.follow.maxSpotAgeMs, cfg.follow.volWindowMs),
		position: new Positions(),
		lastTake: new Map(),
		synced: new Set(),
		tracked: settle.tracked,
		warned: new Set()
	};

	const who = account?.address ?? '(no key, dry run)';
	const cadence =
		cfg.cadenceSec.length > 0 ? cfg.cadenceSec.map(formatCadence).join(',') : 'any';
	log(
		`dreamdex-vault-bot up as ${who} vault=${cfg.vault ?? '(none)'} dryRun=${cfg.dryRun} ` +
			`oracle-follow model=${cfg.follow.model} interval=${cfg.intervalMs}ms ` +
			`underlying=${cfg.underlying || 'any'} cadence=${cadence} ` +
			`edge=${cfg.follow.edge} minAsk=${cfg.follow.minAsk} tUSDC=${TUSDC}`
	);

	let stop = false;
	const onStop = (): void => {
		stop = true;
	};
	process.on('SIGINT', onStop);
	process.on('SIGTERM', onStop);

	const EMPTY_HINT_MS = 60_000;
	let lastEmptyAt = 0;
	let lastPnlAt = 0;
	let lastClaimAt = 0;
	let nextHeartbeat = Date.now() + cfg.follow.heartbeatMs;

	while (!stop) {
		try {
			if (!cfg.dryRun) {
				const chainFail = await assertProductChain(publicClient);
				if (chainFail) {
					await sleep(cfg.intervalMs, () => stop);
					continue;
				}
			}

			const traded = await loadTradedMarketIds();
			await redeemVaultPositions(settle, traded);
			if (cfg.vault && Date.now() - lastClaimAt >= 30_000) {
				lastClaimAt = Date.now();
				await claimSettled(settle, cfg.vault);
			}

			if (adapter && cfg.vault && Date.now() - lastPnlAt >= cfg.pnlIntervalMs) {
				lastPnlAt = Date.now();
				try {
					await reportVaultPnl({
						exchange,
						adapter,
						vault: cfg.vault,
						marketIds: await loadTradedMarketIds(),
						seedRaw: cfg.seedRaw
					});
				} catch (error) {
					log(`pnl report failed: ${errorMessage(error)}`);
				}
			}

			if (!cfg.vault) {
				log('VAULT_ADDRESS unset — discovery only, no mint/place/redeem');
			}

			const discovered = await discoverEligible({
				exchange,
				publicClient,
				vaultAsset,
				underlying: cfg.underlying,
				cadenceSec: cfg.cadenceSec,
				operatorId: cfg.operatorId,
				nearExpiryStopMs: cfg.follow.nearExpiryStopMs
			});
			const markets = cfg.maxMarkets > 0 ? discovered.slice(0, cfg.maxMarkets) : discovered;
			if (markets.length === 0) {
				const now = Date.now();
				if (now - lastEmptyAt >= EMPTY_HINT_MS) {
					lastEmptyAt = now;
					log('no eligible tUSDC market to trade');
				}
			}
			const liveIds = markets.map((m) => m.marketId);
			follow.position.retain(liveIds);
			const liveLower = new Set(liveIds.map((id) => id.toLowerCase()));
			for (const key of follow.lastTake.keys()) {
				if (!liveLower.has(key.toLowerCase())) follow.lastTake.delete(key);
			}
			const cycle = newFollowCycle();
			for (const market of markets) {
				if (stop) break;
				try {
					await takeFollow(follow, market, cycle);
				} catch (error) {
					log(`${market.asset} error: ${errorMessage(error)}`);
				}
			}
			if (cfg.follow.heartbeatMs > 0 && Date.now() >= nextHeartbeat) {
				nextHeartbeat = Date.now() + cfg.follow.heartbeatMs;
				log(formatHeartbeat(cycle, follow.position));
			}
		} catch (error) {
			log(`cycle error: ${errorMessage(error)}`);
		}
		if (stop) break;
		await sleep(cfg.intervalMs, () => stop);
	}

	await cancelTracked(settle);
	try {
		await exchange.close();
	} catch (error) {
		log(`exchange close: ${errorMessage(error)}`);
	}
	log('dreamdex-vault-bot stopped');
}

await main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
