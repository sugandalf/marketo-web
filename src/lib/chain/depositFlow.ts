import { getAddress } from 'viem';
import { chainConfig } from './config';
import { DepositBlockedError, depositVault } from './depositVault';
import { classifyWriteError, type OpenVaultPhase } from './lifecycle';
import { persistDeposit } from './persist';

export type DepositPhase = OpenVaultPhase | 'cap_exceeded' | 'not_live';

export type StampDepositInput = {
	live: boolean;
	vaultAddress: string | undefined;
	amountRaw: string;
	connected: boolean;
	onProductChain: boolean;
	onPhase: (phase: Extract<DepositPhase, 'approving' | 'pending'>) => void;
};

export type StampDepositResult = {
	phase: DepositPhase;
	rejectedApprove: boolean;
};

export async function stampDeposit(input: StampDepositInput): Promise<StampDepositResult> {
	if (!input.live || !input.vaultAddress) {
		return { phase: 'not_live', rejectedApprove: false };
	}
	if (!input.connected) {
		return { phase: 'idle', rejectedApprove: false };
	}
	if (!input.onProductChain) {
		return { phase: 'wrong_network', rejectedApprove: false };
	}
	if (!chainConfig.ok) {
		return { phase: 'rpc_error', rejectedApprove: false };
	}

	let rejectedApprove = false;
	try {
		const deposited = await depositVault({
			vault: getAddress(input.vaultAddress),
			amountRaw: input.amountRaw,
			onPhase: (phase) => {
				rejectedApprove = phase === 'approving';
				input.onPhase(phase);
			}
		});
		try {
			await persistDeposit({
				chainId: deposited.chainId,
				vaultAddress: deposited.vaultAddress,
				depositorAddress: deposited.depositor,
				senderAddress: deposited.sender,
				assetAddress: deposited.asset,
				assets: deposited.assets.toString(),
				shares: deposited.shares.toString(),
				txHash: deposited.txHash
			});
		} catch {
			// Chain confirmed; projection retry is idempotent. Do not un-confirm.
		}
		return { phase: 'confirmed', rejectedApprove: false };
	} catch (error) {
		if (error instanceof DepositBlockedError) {
			return { phase: error.phase, rejectedApprove: false };
		}
		const phase = classifyWriteError(error);
		return { phase, rejectedApprove: rejectedApprove && phase === 'rejected' };
	}
}
