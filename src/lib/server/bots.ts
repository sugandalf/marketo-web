import { eq } from 'drizzle-orm';
import { getAddress, isAddress, isHash, parseEventLogs, type Address, type Hash } from 'viem';
import { HORSE_NAME_MAX, STRATEGY_MAX, type PersistBotRequest } from '$lib/chain/botRecord';
import { chainConfig } from '$lib/chain/config';
import { PERFORMANCE_FEE_BPS, vaultFactoryAbi } from '$lib/chain/vaultFactory';
import { productChainId } from '$lib/wallet/chains';
import { somniaPublicClient } from './chain';
import { db } from './db';
import { bot } from './db/schema';

export type PersistError = { status: number; message: string };

function asAddress(value: unknown): Address | null {
	if (typeof value !== 'string' || !isAddress(value)) return null;
	return getAddress(value);
}

function asHash(value: unknown): Hash | null {
	if (typeof value !== 'string' || !isHash(value)) return null;
	return value;
}

function asSeed(value: unknown): bigint | null {
	if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
	try {
		return BigInt(value);
	} catch {
		return null;
	}
}

export function parsePersistBody(body: unknown): PersistBotRequest | PersistError {
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
	const factoryAddress = asAddress(raw.factoryAddress);
	const vaultAddress = asAddress(raw.vaultAddress);
	const creatorAddress = asAddress(raw.creatorAddress);
	const operatorAddress = asAddress(raw.operatorAddress);
	const assetAddress = asAddress(raw.assetAddress);
	const creatorFeeRecipient = asAddress(raw.creatorFeeRecipient);
	const txHash = asHash(raw.txHash);
	const seedAssets = asSeed(raw.seedAssets);
	const name = typeof raw.name === 'string' ? raw.name.trim() : '';
	const symbol = typeof raw.symbol === 'string' ? raw.symbol.trim() : '';
	const strategy = typeof raw.strategy === 'string' ? raw.strategy.trim() : '';
	const market = raw.market === 'BTC' || raw.market === 'ETH' ? raw.market : null;
	const performanceFeeBps =
		raw.performanceFeeBps === PERFORMANCE_FEE_BPS ? PERFORMANCE_FEE_BPS : null;

	if (
		!factoryAddress ||
		!vaultAddress ||
		!creatorAddress ||
		!operatorAddress ||
		!assetAddress ||
		!creatorFeeRecipient ||
		!txHash ||
		seedAssets === null ||
		!market ||
		performanceFeeBps === null
	) {
		return { status: 400, message: 'Invalid fields' };
	}
	if (factoryAddress !== chainConfig.factoryAddress || assetAddress !== chainConfig.assetAddress) {
		return { status: 400, message: 'Unknown factory or asset' };
	}
	if (
		!name ||
		name.length > HORSE_NAME_MAX ||
		!symbol ||
		!strategy ||
		strategy.length > STRATEGY_MAX
	) {
		return { status: 400, message: 'Invalid papers' };
	}
	if (seedAssets <= 0n) {
		return { status: 400, message: 'Invalid seed' };
	}

	return {
		chainId: productChainId,
		factoryAddress,
		vaultAddress,
		creatorAddress,
		operatorAddress,
		assetAddress,
		name,
		symbol,
		market,
		strategy,
		seedAssets: seedAssets.toString(),
		performanceFeeBps,
		creatorFeeRecipient,
		txHash
	};
}

export async function persistConfirmedBot(
	payload: PersistBotRequest
): Promise<{ id: string } | PersistError> {
	if (!chainConfig.ok) {
		return { status: 400, message: 'Vault is not configured' };
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
	if (!receipt.to || getAddress(receipt.to) !== payload.factoryAddress) {
		return { status: 400, message: 'Receipt is not a factory createVault' };
	}

	const events = parseEventLogs({
		abi: vaultFactoryAbi,
		eventName: 'VaultCreated',
		logs: receipt.logs
	});
	const created = events[0];
	if (!created) {
		return { status: 400, message: 'VaultCreated event missing' };
	}

	const seed = BigInt(payload.seedAssets);
	if (
		getAddress(created.args.vault) !== payload.vaultAddress ||
		getAddress(created.args.owner) !== payload.creatorAddress ||
		getAddress(created.args.operator) !== payload.operatorAddress ||
		getAddress(created.args.asset) !== payload.assetAddress ||
		created.args.seed !== seed ||
		getAddress(created.args.creatorFeeRecipient) !== payload.creatorFeeRecipient
	) {
		return { status: 409, message: 'Receipt does not match papers' };
	}

	const row = {
		chainId: payload.chainId,
		factoryAddress: payload.factoryAddress,
		vaultAddress: payload.vaultAddress,
		creatorAddress: payload.creatorAddress,
		operatorAddress: payload.operatorAddress,
		assetAddress: payload.assetAddress,
		name: payload.name,
		symbol: payload.symbol,
		market: payload.market,
		strategy: payload.strategy,
		seedAssets: payload.seedAssets,
		performanceFeeBps: payload.performanceFeeBps,
		creatorFeeRecipient: payload.creatorFeeRecipient,
		txHash: payload.txHash
	};

	const inserted = await db.insert(bot).values(row).onConflictDoNothing().returning({ id: bot.id });
	if (inserted[0]) return { id: inserted[0].id };

	const existing =
		(
			await db
				.select({ id: bot.id })
				.from(bot)
				.where(eq(bot.vaultAddress, payload.vaultAddress))
				.limit(1)
		)[0] ??
		(await db.select({ id: bot.id }).from(bot).where(eq(bot.txHash, payload.txHash)).limit(1))[0];

	if (!existing) {
		return { status: 500, message: 'Could not store bot' };
	}
	return { id: existing.id };
}
