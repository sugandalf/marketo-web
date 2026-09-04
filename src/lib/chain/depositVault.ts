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

export type DepositedVault = {
	vaultAddress: Address;
	txHash: Hash;
	sender: Address;
	depositor: Address;
	asset: Address;
	assets: bigint;
	shares: bigint;
	chainId: number;
};

export class DepositBlockedError extends Error {
	readonly phase: 'cap_exceeded' | 'rpc_error';

	constructor(
		phase: 'cap_exceeded' | 'rpc_error',
		message?: string,
		options?: { cause?: unknown }
	) {
		super(message ?? phase, options);
		this.name = 'DepositBlockedError';
		this.phase = phase;
	}
}

type DepositVaultInput = {
	vault: Address;
	amountRaw: string;
	onPhase?: (phase: 'approving' | 'pending') => void;
};

export async function depositVault(input: DepositVaultInput): Promise<DepositedVault> {
	if (!chainConfig.ok) {
		throw new OpenVaultError('rpc_error', 'Vault asset is not configured');
	}

	const account = getAccount(walletConfig);
	const depositor = account.address;
	if (!depositor) {
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
			throw new DepositBlockedError('rpc_error', 'Vault asset does not match configuration');
		}

		let assets: bigint;
		try {
			assets = parseUnits(input.amountRaw.trim() || '0', decimals);
		} catch {
			throw new OpenVaultError('reverted', 'Invalid deposit amount');
		}
		if (assets <= 0n) {
			throw new OpenVaultError('reverted', 'Deposit amount must be greater than zero');
		}

		const maxAssets = await readContract(walletConfig, {
			abi: botVaultAbi,
			address: vault,
			functionName: 'maxDeposit',
			args: [depositor],
			chainId: productChainId
		});
		if (assets > maxAssets) {
			throw new DepositBlockedError('cap_exceeded', 'Amount exceeds remaining deposit cap');
		}

		const allowance = await readContract(walletConfig, {
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'allowance',
			args: [depositor, vault],
			chainId: productChainId
		});

		if (allowance < assets) {
			input.onPhase?.('approving');
			const approveHash = await writeContract(walletConfig, {
				abi: erc20Abi,
				address: chainConfig.assetAddress,
				functionName: 'approve',
				args: [vault, assets],
				account: depositor,
				chainId: productChainId
			});
			const approveReceipt = await waitForTransactionReceipt(walletConfig, {
				hash: approveHash,
				chainId: productChainId
			});
			if (approveReceipt.status !== 'success') {
				throw new OpenVaultError('reverted', 'Token approval reverted');
			}
		}

		const args = [assets, depositor] as const;
		await simulateContract(walletConfig, {
			abi: botVaultAbi,
			address: vault,
			functionName: 'deposit',
			args,
			account: depositor,
			chainId: productChainId
		});

		input.onPhase?.('pending');
		const txHash = await writeContract(walletConfig, {
			abi: botVaultAbi,
			address: vault,
			functionName: 'deposit',
			args,
			account: depositor,
			chainId: productChainId
		});
		const receipt = await waitForTransactionReceipt(walletConfig, {
			hash: txHash,
			chainId: productChainId
		});
		if (receipt.status !== 'success') {
			throw new OpenVaultError('reverted', 'deposit reverted');
		}

		const events = parseEventLogs({
			abi: botVaultAbi,
			eventName: 'Deposit',
			logs: receipt.logs
		});
		const deposited = events.find((event) => getAddress(event.address) === vault) ?? events[0];
		if (!deposited) {
			throw new OpenVaultError('rpc_error', 'Deposit event missing from receipt');
		}

		return {
			vaultAddress: vault,
			txHash,
			sender: getAddress(deposited.args.sender),
			depositor: getAddress(deposited.args.owner),
			asset: chainConfig.assetAddress,
			assets: deposited.args.assets,
			shares: deposited.args.shares,
			chainId: productChainId
		};
	} catch (error) {
		if (error instanceof OpenVaultError || error instanceof DepositBlockedError) throw error;
		throw new OpenVaultError(classifyWriteError(error), undefined, { cause: error });
	}
}
