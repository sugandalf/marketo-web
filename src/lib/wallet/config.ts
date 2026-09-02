import { createConfig, http } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { productRpcUrl } from '$lib/chain/config';
import { somniaShannon } from './chains';

export const walletConfig = createConfig({
	chains: [somniaShannon],
	connectors: [injected({ shimDisconnect: true })],
	transports: {
		[somniaShannon.id]: http(productRpcUrl)
	},
	ssr: true,
	multiInjectedProviderDiscovery: true
});
