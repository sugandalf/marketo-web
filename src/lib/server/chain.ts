import { createPublicClient, http } from 'viem';
import { env } from '$env/dynamic/private';
import { productRpcUrl } from '$lib/chain/config';
import { somniaShannon } from '$lib/wallet/chains';

export function somniaPublicClient() {
	const url = env.SOMNIA_RPC_URL?.trim() || productRpcUrl;
	return createPublicClient({
		chain: somniaShannon,
		transport: http(url)
	});
}
