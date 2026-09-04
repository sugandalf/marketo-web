import type { Address, Hash } from 'viem';

export type PersistDepositRequest = {
	chainId: number;
	vaultAddress: Address;
	depositorAddress: Address;
	senderAddress: Address;
	assetAddress: Address;
	assets: string;
	shares: string;
	txHash: Hash;
};
