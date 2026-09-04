import type { Address, Hash } from 'viem';

export type PersistWithdrawRequest = {
	chainId: number;
	vaultAddress: Address;
	ownerAddress: Address;
	receiverAddress: Address;
	senderAddress: Address;
	assetAddress: Address;
	assets: string;
	shares: string;
	txHash: Hash;
};
