import { createConfig, http } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

/**
 * Wagmi client default only. Product chain is still undecided — do not
 * advertise a network in the UI, and do not pass chainId on connect.
 */
export const walletConfig = createConfig({
	chains: [mainnet],
	connectors: [injected({ shimDisconnect: true })],
	transports: {
		[mainnet.id]: http()
	},
	ssr: true,
	multiInjectedProviderDiscovery: true
});
