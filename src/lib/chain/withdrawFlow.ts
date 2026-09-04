import { getAddress } from 'viem';
import { chainConfig } from './config';
import { classifyWriteError, type OpenVaultPhase } from './lifecycle';
import { persistWithdraw } from './persist';
import { WithdrawBlockedError, withdrawVault } from './withdrawVault';

export type WithdrawPhase = OpenVaultPhase | 'exceeds_max' | 'not_live';

export type StampWithdrawInput = {
	live: boolean;
	vaultAddress: string | undefined;
	amountRaw: string;
	connected: boolean;
	onProductChain: boolean;
	onPhase: (phase: Extract<WithdrawPhase, 'pending'>) => void;
};

export type StampWithdrawResult = {
	phase: WithdrawPhase;
};

export async function stampWithdraw(input: StampWithdrawInput): Promise<StampWithdrawResult> {
	if (!input.live || !input.vaultAddress) {
		return { phase: 'not_live' };
	}
	if (!input.connected) {
		return { phase: 'idle' };
	}
	if (!input.onProductChain) {
		return { phase: 'wrong_network' };
	}
	if (!chainConfig.ok) {
		return { phase: 'rpc_error' };
	}

	try {
		const withdrawn = await withdrawVault({
			vault: getAddress(input.vaultAddress),
			amountRaw: input.amountRaw,
			onPhase: (phase) => {
				input.onPhase(phase);
			}
		});
		try {
			await persistWithdraw({
				chainId: withdrawn.chainId,
				vaultAddress: withdrawn.vaultAddress,
				ownerAddress: withdrawn.owner,
				receiverAddress: withdrawn.receiver,
				senderAddress: withdrawn.sender,
				assetAddress: withdrawn.asset,
				assets: withdrawn.assets.toString(),
				shares: withdrawn.shares.toString(),
				txHash: withdrawn.txHash
			});
		} catch {
			// Chain confirmed; projection retry is idempotent. Do not un-confirm.
		}
		return { phase: 'confirmed' };
	} catch (error) {
		if (error instanceof WithdrawBlockedError) {
			return { phase: error.phase };
		}
		return { phase: classifyWriteError(error) };
	}
}
