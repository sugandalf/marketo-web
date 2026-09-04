import { eq } from 'drizzle-orm';
import { getAddress, isAddress, isHash, parseEventLogs, type Address, type Hash } from 'viem';
import { botVaultAbi } from '$lib/chain/botVault';
import { chainConfig } from '$lib/chain/config';
import type { PersistWithdrawRequest } from '$lib/chain/withdrawRecord';
import { productChainId } from '$lib/wallet/chains';
import { somniaPublicClient } from './chain';
import { db } from './db';
import { bot, withdrawal } from './db/schema';

export type PersistError = { status: number; message: string };

export type WithdrawalRow = {
	vaultAddress: string;
	ownerAddress: string;
	receiverAddress: string;
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

export function parseWithdrawBody(body: unknown): PersistWithdrawRequest | PersistError {
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
	const ownerAddress = asAddress(raw.ownerAddress);
	const receiverAddress = asAddress(raw.receiverAddress);
	const senderAddress = asAddress(raw.senderAddress);
	const assetAddress = asAddress(raw.assetAddress);
	const txHash = asHash(raw.txHash);
	const assets = asAmount(raw.assets);
	const shares = asAmount(raw.shares);

	if (
		!vaultAddress ||
		!ownerAddress ||
		!receiverAddress ||
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
		ownerAddress,
		receiverAddress,
		senderAddress,
		assetAddress,
		assets: assets.toString(),
		shares: shares.toString(),
		txHash
	};
}

export async function persistConfirmedWithdraw(
	payload: PersistWithdrawRequest
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
		eventName: 'Withdraw',
		logs: receipt.logs
	});
	const match = events.find((event) => getAddress(event.address) === payload.vaultAddress);
	if (!match) {
		return { status: 400, message: 'Withdraw event missing' };
	}

	const assets = BigInt(payload.assets);
	const shares = BigInt(payload.shares);
	if (
		getAddress(match.args.sender) !== payload.senderAddress ||
		getAddress(match.args.receiver) !== payload.receiverAddress ||
		getAddress(match.args.owner) !== payload.ownerAddress ||
		match.args.assets !== assets ||
		match.args.shares !== shares
	) {
		return { status: 409, message: 'Receipt does not match withdraw' };
	}

	const row = {
		chainId: payload.chainId,
		vaultAddress: payload.vaultAddress,
		ownerAddress: payload.ownerAddress,
		receiverAddress: payload.receiverAddress,
		senderAddress: payload.senderAddress,
		assetAddress: payload.assetAddress,
		assets: payload.assets,
		shares: payload.shares,
		txHash: payload.txHash
	};

	const inserted = await db
		.insert(withdrawal)
		.values(row)
		.onConflictDoNothing()
		.returning({ id: withdrawal.id });
	if (inserted[0]) return { id: inserted[0].id };

	const existing = (
		await db
			.select({ id: withdrawal.id })
			.from(withdrawal)
			.where(eq(withdrawal.txHash, payload.txHash))
			.limit(1)
	)[0];
	if (!existing) {
		return { status: 500, message: 'Could not store withdraw' };
	}
	return { id: existing.id };
}

function toRow(row: {
	vaultAddress: string;
	ownerAddress: string;
	receiverAddress: string;
	senderAddress: string;
	assetAddress: string;
	assets: string;
	shares: string;
	txHash: string;
	createdAt: number;
}): WithdrawalRow {
	return row;
}

export async function listWithdrawals(): Promise<WithdrawalRow[]> {
	const rows = await db
		.select({
			vaultAddress: withdrawal.vaultAddress,
			ownerAddress: withdrawal.ownerAddress,
			receiverAddress: withdrawal.receiverAddress,
			senderAddress: withdrawal.senderAddress,
			assetAddress: withdrawal.assetAddress,
			assets: withdrawal.assets,
			shares: withdrawal.shares,
			txHash: withdrawal.txHash,
			createdAt: withdrawal.createdAt
		})
		.from(withdrawal);
	return rows.map(toRow).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listWithdrawalsForVault(vaultAddress: Address): Promise<WithdrawalRow[]> {
	const rows = await db
		.select({
			vaultAddress: withdrawal.vaultAddress,
			ownerAddress: withdrawal.ownerAddress,
			receiverAddress: withdrawal.receiverAddress,
			senderAddress: withdrawal.senderAddress,
			assetAddress: withdrawal.assetAddress,
			assets: withdrawal.assets,
			shares: withdrawal.shares,
			txHash: withdrawal.txHash,
			createdAt: withdrawal.createdAt
		})
		.from(withdrawal)
		.where(eq(withdrawal.vaultAddress, vaultAddress));
	return rows.map(toRow).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listWithdrawalsForOwner(ownerAddress: Address): Promise<WithdrawalRow[]> {
	const rows = await db
		.select({
			vaultAddress: withdrawal.vaultAddress,
			ownerAddress: withdrawal.ownerAddress,
			receiverAddress: withdrawal.receiverAddress,
			senderAddress: withdrawal.senderAddress,
			assetAddress: withdrawal.assetAddress,
			assets: withdrawal.assets,
			shares: withdrawal.shares,
			txHash: withdrawal.txHash,
			createdAt: withdrawal.createdAt
		})
		.from(withdrawal)
		.where(eq(withdrawal.ownerAddress, ownerAddress));
	return rows.map(toRow).sort((a, b) => b.createdAt - a.createdAt);
}
