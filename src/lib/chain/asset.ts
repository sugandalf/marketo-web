import { readContract } from '@wagmi/core';
import { erc20Abi, formatUnits, type Address } from 'viem';
import { chainConfig } from './config';
import { walletConfig } from '$lib/wallet/config';
import { productChainId } from '$lib/wallet/chains';

export type AssetPurse = {
	balance: bigint;
	decimals: number;
};

export async function readAssetPurse(owner: Address): Promise<AssetPurse> {
	if (!chainConfig.ok) {
		throw new Error('Vault asset is not configured');
	}
	const [balance, decimals] = await Promise.all([
		readContract(walletConfig, {
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'balanceOf',
			args: [owner],
			chainId: productChainId
		}),
		readContract(walletConfig, {
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'decimals',
			chainId: productChainId
		})
	]);
	return { balance, decimals };
}

export function formatAssetInput(balance: bigint, decimals: number): string {
	return formatUnits(balance, decimals);
}

export function formatAssetDisplay(balance: bigint, decimals: number, locale: string): string {
	const raw = formatUnits(balance, decimals);
	const [whole, fraction = ''] = raw.split('.');
	const grouped = BigInt(whole).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US');
	const trimmed = fraction.replace(/0+$/, '').slice(0, 6);
	if (!trimmed) {
		return grouped;
	}
	const sep = locale === 'id' ? ',' : '.';
	return `${grouped}${sep}${trimmed}`;
}
