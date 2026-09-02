import type { Address, Hash } from 'viem';
import type { Market } from '$lib/landing/heroes';

export const HORSE_NAME_MAX = 24;
export const STRATEGY_MAX = 120;

export type PersistBotRequest = {
	chainId: number;
	factoryAddress: Address;
	vaultAddress: Address;
	creatorAddress: Address;
	operatorAddress: Address;
	assetAddress: Address;
	name: string;
	symbol: string;
	market: Market;
	strategy: string;
	seedAssets: string;
	performanceFeeBps: number;
	creatorFeeRecipient: Address;
	txHash: Hash;
};
