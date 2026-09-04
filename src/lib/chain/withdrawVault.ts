import {
	getAccount,
	readContract,
	simulateContract,
	waitForTransactionReceipt,
	writeContract
} from '@wagmi/core';
import { erc20Abi, getAddress, parseEventLogs, parseUnits, type Address, type Hash } from 'viem';
import { botVaultAbi } from './botVault';
import { chainConfig } from './config';
import { classifyWriteError, OpenVaultError } from './lifecycle';
import { walletConfig } from '$lib/wallet/config';
import { productChainId } from '$lib/wallet/chains';

export type WithdrawnVault = {
	vaultAddress: Address;
	txHash: Hash;
	sender: Address;
	owner: Address;
	receiver: Address;
	asset: Address;
	assets: bigint;
	shares: bigint;
	chainId: number;
};

export class WithdrawBlockedError extends Error {
	readonly phase: 'exceeds_max' | 'rpc_error';

	constructor(phase: 'exceeds_max' | 'rpc_error', message?: string, options?: { cause?: unknown }) {
		super(message ?? phase, options);
		this.name = 'WithdrawBlockedError';
		this.phase = phase;
	}
}

type WithdrawVaultInput = {
	vault: Address;
	amountRaw: string;
	onPhase?: (phase: 'pending') => void;
};

export async function readMaxWithdraw(vault: Address): Promise<bigint> {
	const account = getAccount(walletConfig);
	const owner = account.address;
	if (!owner) {
		throw new OpenVaultError('rpc_error', 'Wallet is not connected');
	}

	return readContract(walletConfig, {
		abi: botVaultAbi,
		address: getAddress(vault),
		functionName: 'maxWithdraw',
		args: [owner],
		chainId: productChainId
	});
}

export async function withdrawVault(input: WithdrawVaultInput): Promise<WithdrawnVault> {
	if (!chainConfig.ok) {
		throw new OpenVaultError('rpc_error', 'Vault asset is not configured');
	}

	const account = getAccount(walletConfig);
	const owner = account.address;
	if (!owner) {
		throw new OpenVaultError('rpc_error', 'Wallet is not connected');
	}

	const vault = getAddress(input.vault);

	try {
		const [asset, decimals] = await Promise.all([
			readContract(walletConfig, {
				abi: botVaultAbi,
				address: vault,
				functionName: 'asset',
				chainId: productChainId
			}),
			readContract(walletConfig, {
				abi: erc20Abi,
				address: chainConfig.assetAddress,
				functionName: 'decimals',
				chainId: productChainId
			})
		]);

		if (getAddress(asset) !== chainConfig.assetAddress) {
			throw new WithdrawBlockedError('rpc_error', 'Vault asset does not match configuration');
		}

		let assets: bigint;
		try {
			assets = parseUnits(input.amountRaw.trim() || '0', decimals);
		} catch {
			throw new OpenVaultError('reverted', 'Invalid withdraw amount');
		}
		if (assets <= 0n) {
			throw new OpenVaultError('reverted', 'Withdraw amount must be greater than zero');
		}

		const maxAssets = await readContract(walletConfig, {
			abi: botVaultAbi,
			address: vault,
			functionName: 'maxWithdraw',
			args: [owner],
			chainId: productChainId
		});
		if (assets > maxAssets) {
			throw new WithdrawBlockedError('exceeds_max', 'Amount exceeds redeemable assets');
		}

		const args = [assets, owner, owner] as const;
		await simulateContract(walletConfig, {
			abi: botVaultAbi,
			address: vault,
			functionName: 'withdraw',
			args,
			account: owner,
			chainId: productChainId
		});

		input.onPhase?.('pending');
		const txHash = await writeContract(walletConfig, {
			abi: botVaultAbi,
			address: vault,
			functionName: 'withdraw',
			args,
			account: owner,
			chainId: productChainId
		});
		const receipt = await waitForTransactionReceipt(walletConfig, {
			hash: txHash,
			chainId: productChainId
		});
		if (receipt.status !== 'success') {
			throw new OpenVaultError('reverted', 'withdraw reverted');
		}

		const events = parseEventLogs({
			abi: botVaultAbi,
			eventName: 'Withdraw',
			logs: receipt.logs
		});
		const withdrawn = events.find((event) => getAddress(event.address) === vault) ?? events[0];
		if (!withdrawn) {
			throw new OpenVaultError('rpc_error', 'Withdraw event missing from receipt');
		}

		return {
			vaultAddress: vault,
			txHash,
			sender: getAddress(withdrawn.args.sender),
			owner: getAddress(withdrawn.args.owner),
			receiver: getAddress(withdrawn.args.receiver),
			asset: chainConfig.assetAddress,
			assets: withdrawn.args.assets,
			shares: withdrawn.args.shares,
			chainId: productChainId
		};
	} catch (error) {
		if (error instanceof OpenVaultError || error instanceof WithdrawBlockedError) throw error;
		throw new OpenVaultError(classifyWriteError(error), undefined, { cause: error });
	}
}
