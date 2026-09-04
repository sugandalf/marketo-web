import { eq } from 'drizzle-orm';
import { getAddress, isAddress, isHash, parseEventLogs, type Address, type Hash } from 'viem';
import { botVaultAbi } from '$lib/chain/botVault';
import { chainConfig } from '$lib/chain/config';
import type { PersistDepositRequest } from '$lib/chain/depositRecord';
import { productChainId } from '$lib/wallet/chains';
import { somniaPublicClient } from './chain';
import { db } from './db';
import { bot, deposit } from './db/schema';

export type PersistError = { status: number; message: string };

export type DepositRow = {
	vaultAddress: string;
	depositorAddress: string;
	senderAddress: string;
	assetAddress: string;
	assets: string;
	shares: string;
	txHash: string;
	createdAt: number;
};

function asAddress(value: unknown): Address | null {
	if (typeof value !== 'string' || !isAddress(value)) return null;
	return getAddress(value);
}

function asHash(value: unknown): Hash | null {
	if (typeof value !== 'string' || !isHash(value)) return null;
	return value;
}

function asAmount(value: unknown): bigint | null {
	if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
	try {
		return BigInt(value);
	} catch {
		return null;
	}
}

export function parseDepositBody(body: unknown): PersistDepositRequest | PersistError {
	if (!body || typeof body !== 'object') {
		return { status: 400, message: 'Invalid body' };
	}
	const raw = body as Record<string, unknown>;
	if (raw.chainId !== productChainId) {
		return { status: 400, message: 'Wrong chain' };
	}
	if (!chainConfig.ok) {
		return { status: 400, message: 'Vault is not configured' };
	}
	const vaultAddress = asAddress(raw.vaultAddress);
	const depositorAddress = asAddress(raw.depositorAddress);
	const senderAddress = asAddress(raw.senderAddress);
	const assetAddress = asAddress(raw.assetAddress);
	const txHash = asHash(raw.txHash);
	const assets = asAmount(raw.assets);
	const shares = asAmount(raw.shares);

	if (
		!vaultAddress ||
		!depositorAddress ||
		!senderAddress ||
		!assetAddress ||
		!txHash ||
		assets === null ||
		shares === null
	) {
		return { status: 400, message: 'Invalid fields' };
	}
	if (assetAddress !== chainConfig.assetAddress) {
		return { status: 400, message: 'Unknown asset' };
	}
	if (assets <= 0n || shares <= 0n) {
		return { status: 400, message: 'Invalid amount' };
	}

	return {
		chainId: productChainId,
		vaultAddress,
		depositorAddress,
		senderAddress,
		assetAddress,
		assets: assets.toString(),
		shares: shares.toString(),
		txHash
	};
}

export async function persistConfirmedDeposit(
	payload: PersistDepositRequest
): Promise<{ id: string } | PersistError> {
	if (!chainConfig.ok) {
		return { status: 400, message: 'Vault is not configured' };
	}

	const known =
		(
			await db
				.select({ vaultAddress: bot.vaultAddress, assetAddress: bot.assetAddress })
				.from(bot)
				.where(eq(bot.vaultAddress, payload.vaultAddress))
				.limit(1)
		)[0] ?? null;
	if (!known || getAddress(known.assetAddress) !== payload.assetAddress) {
		return { status: 400, message: 'Unknown vault' };
	}

	const client = somniaPublicClient();
	let receipt;
	try {
		receipt = await client.getTransactionReceipt({ hash: payload.txHash });
	} catch {
		return { status: 502, message: 'Could not read receipt' };
	}

	if (receipt.status !== 'success') {
		return { status: 400, message: 'Transaction did not succeed' };
	}

	const events = parseEventLogs({
		abi: botVaultAbi,
		eventName: 'Deposit',
		logs: receipt.logs
	});
	const match = events.find((event) => getAddress(event.address) === payload.vaultAddress);
	if (!match) {
		return { status: 400, message: 'Deposit event missing' };
	}

	const assets = BigInt(payload.assets);
	const shares = BigInt(payload.shares);
	if (
		getAddress(match.args.sender) !== payload.senderAddress ||
		getAddress(match.args.owner) !== payload.depositorAddress ||
		match.args.assets !== assets ||
		match.args.shares !== shares
	) {
		return { status: 409, message: 'Receipt does not match deposit' };
	}

	const row = {
		chainId: payload.chainId,
		vaultAddress: payload.vaultAddress,
		depositorAddress: payload.depositorAddress,
		senderAddress: payload.senderAddress,
		assetAddress: payload.assetAddress,
		assets: payload.assets,
		shares: payload.shares,
		txHash: payload.txHash
	};

	const inserted = await db
		.insert(deposit)
		.values(row)
		.onConflictDoNothing()
		.returning({ id: deposit.id });
	if (inserted[0]) return { id: inserted[0].id };

	const existing = (
		await db
			.select({ id: deposit.id })
			.from(deposit)
			.where(eq(deposit.txHash, payload.txHash))
			.limit(1)
	)[0];
	if (!existing) {
		return { status: 500, message: 'Could not store deposit' };
	}
	return { id: existing.id };
}

export async function listDeposits(): Promise<DepositRow[]> {
	const rows = await db
		.select({
			vaultAddress: deposit.vaultAddress,
			depositorAddress: deposit.depositorAddress,
			senderAddress: deposit.senderAddress,
			assetAddress: deposit.assetAddress,
			assets: deposit.assets,
			shares: deposit.shares,
			txHash: deposit.txHash,
			createdAt: deposit.createdAt
		})
		.from(deposit);
	return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listDepositsForVault(vaultAddress: Address): Promise<DepositRow[]> {
	const rows = await db
		.select({
			vaultAddress: deposit.vaultAddress,
			depositorAddress: deposit.depositorAddress,
			senderAddress: deposit.senderAddress,
			assetAddress: deposit.assetAddress,
			assets: deposit.assets,
			shares: deposit.shares,
			txHash: deposit.txHash,
			createdAt: deposit.createdAt
		})
		.from(deposit)
		.where(eq(deposit.vaultAddress, vaultAddress));
	return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listDepositsForDepositor(depositorAddress: Address): Promise<DepositRow[]> {
	const rows = await db
		.select({
			vaultAddress: deposit.vaultAddress,
			depositorAddress: deposit.depositorAddress,
			senderAddress: deposit.senderAddress,
			assetAddress: deposit.assetAddress,
			assets: deposit.assets,
			shares: deposit.shares,
			txHash: deposit.txHash,
			createdAt: deposit.createdAt
		})
		.from(deposit)
		.where(eq(deposit.depositorAddress, depositorAddress));
	return rows.sort((a, b) => b.createdAt - a.createdAt);
}
