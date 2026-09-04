import { getAddress } from 'viem';
import type { PublicClient } from 'viem';
import type { SomniaMarkets } from '@somnia-chain/markets-sdk';
import { PRODUCT_CHAIN_ID } from './config';
import type { PerformanceDb } from './db';
import { errorMessage, log } from './log';
import { markVault } from './mark';
import { listEnteredVaults, listStoredMarketIds, persistVaultMark } from './persist';

export async function runCycle(opts: {
	db: PerformanceDb;
	publicClient: PublicClient;
	exchange: SomniaMarkets;
}): Promise<void> {
	const chainId = await opts.publicClient.getChainId();
	if (chainId !== PRODUCT_CHAIN_ID) {
		log(`wrong-network: rpc chain id ${chainId} is not ${PRODUCT_CHAIN_ID}; skip writes`);
		return;
	}

	const vaults = await listEnteredVaults(opts.db);
	if (vaults.length === 0) {
		log('no entered bots; skip writes');
		return;
	}

	for (const vault of vaults) {
		try {
			const storedMarketIds = await listStoredMarketIds(opts.db, vault.vaultAddress);
			const mark = await markVault({
				exchange: opts.exchange,
				publicClient: opts.publicClient,
				vault: getAddress(vault.vaultAddress),
				asset: getAddress(vault.assetAddress),
				storedMarketIds
			});
			persistVaultMark(opts.db, vault, mark);
			log(
				`stored ${vault.vaultAddress} tvl=${mark.tvlAssets} pnl=${mark.pnlAssets} fights=${mark.fights.length}`
			);
		} catch (error) {
			log(`skip ${vault.vaultAddress}: ${errorMessage(error)}`);
		}
	}
}
