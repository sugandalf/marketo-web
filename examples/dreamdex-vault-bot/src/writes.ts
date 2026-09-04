import {
	BaseError,
	ContractFunctionRevertedError,
	type Account,
	type Hash,
	type Hex,
	type PublicClient,
	type TransactionReceipt,
	type WalletClient
} from 'viem';
import { PRODUCT_CHAIN_ID } from './config.ts';
import { type VaultAdapter, operatorMethods, vaultAbi } from './adapter.ts';
import { errorMessage, log } from './log.ts';

export type WriteKind = (typeof operatorMethods)[number];

export type WriteFailure = {
	ok: false;
	kind: 'missing_key' | 'wrong_network' | 'unauthorized' | 'reverted' | 'rpc';
	message: string;
};

export type WriteSuccess = {
	ok: true;
	hash: Hash;
	receipt: TransactionReceipt;
	result: unknown;
};

export type WriteResult = WriteSuccess | WriteFailure;

export type WriteGate = {
	dryRun: boolean;
	hasKey: boolean;
	publicClient: PublicClient;
	walletClient: WalletClient | null;
	account: Account | null;
	adapter: VaultAdapter | null;
};

function classify(error: unknown): WriteFailure['kind'] {
	const text = errorMessage(error).toLowerCase();
	if (
		text.includes('unauthorized') ||
		text.includes('onlyoperator') ||
		text.includes('not operator')
	) {
		return 'unauthorized';
	}
	if (text.includes('marketnottrading')) {
		return 'reverted';
	}
	if (error instanceof BaseError) {
		if (error.walk((e) => e instanceof ContractFunctionRevertedError)) return 'reverted';
		const name = error.name.toLowerCase();
		if (name.includes('rpc') || name.includes('timeout') || name.includes('http')) return 'rpc';
	}
	if (text.includes('revert')) return 'reverted';
	return 'rpc';
}

export async function assertProductChain(publicClient: PublicClient): Promise<WriteFailure | null> {
	try {
		const id = await publicClient.getChainId();
		if (id !== PRODUCT_CHAIN_ID) {
			const message = `wrong network: chain id ${id}, expected ${PRODUCT_CHAIN_ID}`;
			log(message);
			return { ok: false, kind: 'wrong_network', message };
		}
		return null;
	} catch (error) {
		const message = `rpc failure reading chain id: ${errorMessage(error)}`;
		log(message);
		return { ok: false, kind: 'rpc', message };
	}
}

export async function assertOperator(
	adapter: VaultAdapter,
	account: Account
): Promise<WriteFailure | null> {
	const onchain = await adapter.vaultOperator();
	if (onchain && onchain.toLowerCase() !== account.address.toLowerCase()) {
		const message = `unauthorized operator: key ${account.address} is not vault operator ${onchain}`;
		log(message);
		return { ok: false, kind: 'unauthorized', message };
	}
	return null;
}

export async function sendVaultWrite(
	gate: WriteGate,
	functionName: WriteKind,
	args: readonly unknown[],
	intent: string
): Promise<WriteResult | { ok: true; dryRun: true }> {
	if (gate.dryRun) {
		log(`DRY ${intent}`);
		return { ok: true, dryRun: true };
	}
	if (!gate.hasKey || !gate.walletClient || !gate.account || !gate.adapter) {
		const message = 'live mode requires OPERATOR_PRIVATE_KEY';
		log(message);
		return { ok: false, kind: 'missing_key', message };
	}

	const chainFail = await assertProductChain(gate.publicClient);
	if (chainFail) return chainFail;

	const opFail = await assertOperator(gate.adapter, gate.account);
	if (opFail) return opFail;

	try {
		const { request, result } = await gate.publicClient.simulateContract({
			address: gate.adapter.trader,
			abi: vaultAbi,
			functionName,
			args: args as never,
			account: gate.account
		});
		const hash = await gate.walletClient.writeContract(request);
		log(`${intent} sent ${hash}`);
		const receipt = await gate.publicClient.waitForTransactionReceipt({ hash });
		if (receipt.status !== 'success') {
			log(`reverted ${functionName} ${hash}`);
			return { ok: false, kind: 'reverted', message: `${functionName} reverted (${hash})` };
		}
		log(`${intent} confirmed ${hash}`);
		return { ok: true, hash, receipt, result };
	} catch (error) {
		const kind = classify(error);
		const message = `${kind} ${functionName}: ${errorMessage(error)}`;
		log(message);
		return { ok: false, kind, message };
	}
}

export type TrackedOrder = { marketId: Hex; orderId: bigint };
