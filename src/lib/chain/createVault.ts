import {
	getAccount,
	readContract,
	simulateContract,
	waitForTransactionReceipt,
	writeContract
} from '@wagmi/core';
import { erc20Abi, getAddress, parseEventLogs, parseUnits, type Address, type Hash } from 'viem';
import { chainConfig } from './config';
import { classifyWriteError, OpenVaultError, type OpenVaultPhase } from './lifecycle';
import { PERFORMANCE_FEE_BPS, vaultFactoryAbi } from './vaultFactory';
import { walletConfig } from '$lib/wallet/config';
import { productChainId } from '$lib/wallet/chains';

export type CreatedVault = {
	vaultAddress: Address;
	txHash: Hash;
	operator: Address;
	creator: Address;
	asset: Address;
	factory: Address;
	name: string;
	symbol: string;
	seedAssets: bigint;
	chainId: number;
	performanceFeeBps: number;
	creatorFeeRecipient: Address;
};

export function symbolFromName(name: string): string {
	const compact = name
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '')
		.slice(0, 8);
	return compact || 'BOT';
}

export function parsePurse(raw: string, decimals: number): bigint {
	return parseUnits(raw.trim() || '0', decimals);
}

type CreateBotVaultInput = {
	name: string;
	operator: Address;
	purseRaw: string;
	onPhase?: (phase: Extract<OpenVaultPhase, 'approving' | 'pending'>) => void;
};

export async function createBotVault(input: CreateBotVaultInput): Promise<CreatedVault> {
	if (!chainConfig.ok) {
		throw new OpenVaultError('rpc_error', 'Vault asset is not configured');
	}

	const account = getAccount(walletConfig);
	const creator = account.address;
	if (!creator) {
		throw new OpenVaultError('rpc_error', 'Wallet is not connected');
	}

	try {
		const decimals = await readContract(walletConfig, {
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'decimals',
			chainId: productChainId
		});
		const seedAssets = parsePurse(input.purseRaw, decimals);
		if (seedAssets <= 0n) {
			throw new OpenVaultError('reverted', 'Opening purse must be greater than zero');
		}

		const allowance = await readContract(walletConfig, {
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'allowance',
			args: [creator, chainConfig.factoryAddress],
			chainId: productChainId
		});

		if (allowance < seedAssets) {
			input.onPhase?.('approving');
			const approveHash = await writeContract(walletConfig, {
				abi: erc20Abi,
				address: chainConfig.assetAddress,
				functionName: 'approve',
				args: [chainConfig.factoryAddress, seedAssets],
				account: creator,
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

		const name = input.name.trim();
		const symbol = symbolFromName(name);
		const args = [
			input.operator,
			chainConfig.assetAddress,
			name,
			symbol,
			seedAssets,
			PERFORMANCE_FEE_BPS,
			creator
		] as const;

		await simulateContract(walletConfig, {
			abi: vaultFactoryAbi,
			address: chainConfig.factoryAddress,
			functionName: 'createVault',
			args,
			account: creator,
			chainId: productChainId
		});

		input.onPhase?.('pending');
		const txHash = await writeContract(walletConfig, {
			abi: vaultFactoryAbi,
			address: chainConfig.factoryAddress,
			functionName: 'createVault',
			args,
			account: creator,
			chainId: productChainId
		});
		const receipt = await waitForTransactionReceipt(walletConfig, {
			hash: txHash,
			chainId: productChainId
		});
		if (receipt.status !== 'success') {
			throw new OpenVaultError('reverted', 'createVault reverted');
		}

		const events = parseEventLogs({
			abi: vaultFactoryAbi,
			eventName: 'VaultCreated',
			logs: receipt.logs
		});
		const created = events[0];
		if (!created) {
			throw new OpenVaultError('rpc_error', 'VaultCreated event missing from receipt');
		}

		return {
			vaultAddress: getAddress(created.args.vault),
			txHash,
			operator: getAddress(created.args.operator),
			creator: getAddress(created.args.owner),
			asset: getAddress(created.args.asset),
			factory: chainConfig.factoryAddress,
			name,
			symbol,
			seedAssets,
			chainId: productChainId,
			performanceFeeBps: PERFORMANCE_FEE_BPS,
			creatorFeeRecipient: getAddress(created.args.creatorFeeRecipient)
		};
	} catch (error) {
		if (error instanceof OpenVaultError) throw error;
		throw new OpenVaultError(classifyWriteError(error), undefined, { cause: error });
	}
}
