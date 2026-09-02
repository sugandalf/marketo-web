import { env } from '$env/dynamic/public';
import { getAddress, isAddress, type Address } from 'viem';
import { productChainId, somniaShannon } from '$lib/wallet/chains';

const DEFAULT_FACTORY = '0x6EbBD76076faE4FBaD7C4B5bc9c8c6feeB82e4a9';
const DEFAULT_RPC = 'https://dream-rpc.somnia.network';

export const productChain = somniaShannon;
export const productRpcUrl = env.PUBLIC_SOMNIA_RPC_URL?.trim() || DEFAULT_RPC;

function parseAddress(value: string | undefined): Address | null | 'invalid' {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	if (!isAddress(trimmed)) return 'invalid';
	return getAddress(trimmed);
}

export type ChainConfig =
	| {
			ok: true;
			chain: typeof somniaShannon;
			chainId: typeof productChainId;
			rpcUrl: string;
			factoryAddress: Address;
			assetAddress: Address;
	  }
	| {
			ok: false;
			reason: 'missing' | 'invalid';
			chain: typeof somniaShannon;
			chainId: typeof productChainId;
			rpcUrl: string;
	  };

const factory = parseAddress(env.PUBLIC_VAULT_FACTORY_ADDRESS || DEFAULT_FACTORY);
const asset = parseAddress(env.PUBLIC_VAULT_ASSET_ADDRESS);

export const chainConfig: ChainConfig =
	factory === 'invalid' || asset === 'invalid'
		? {
				ok: false,
				reason: 'invalid',
				chain: somniaShannon,
				chainId: productChainId,
				rpcUrl: productRpcUrl
			}
		: factory === null || asset === null
			? {
					ok: false,
					reason: 'missing',
					chain: somniaShannon,
					chainId: productChainId,
					rpcUrl: productRpcUrl
				}
			: {
					ok: true,
					chain: somniaShannon,
					chainId: productChainId,
					rpcUrl: productRpcUrl,
					factoryAddress: factory,
					assetAddress: asset
				};
