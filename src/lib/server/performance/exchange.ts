import {
	SOMNIA_TESTNET_ADDRESSES,
	SOMNIA_TESTNET_PRICE_FEED,
	SomniaMarkets
} from '@somnia-chain/markets-sdk';
import { somniaShannon } from '@somnia-chain/markets-sdk/chains';

export function createReadExchange(opts: { indexerUrl: string; wsRpcUrl: string }): SomniaMarkets {
	return new SomniaMarkets({
		indexerUrl: opts.indexerUrl,
		chain: somniaShannon,
		wsRpcUrl: opts.wsRpcUrl,
		addresses: SOMNIA_TESTNET_ADDRESSES,
		priceFeed: SOMNIA_TESTNET_PRICE_FEED
	});
}
