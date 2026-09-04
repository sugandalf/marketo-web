import { type Account, type Address, type Hex, type PublicClient, type WalletClient } from 'viem';

export const vaultAbi = [
	{
		type: 'function',
		name: 'placeOrder',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'marketId', type: 'bytes32' },
			{ name: 'side', type: 'uint8' },
			{ name: 'price', type: 'uint256' },
			{ name: 'quantity', type: 'uint256' },
			{ name: 'expireTimestampNs', type: 'uint64' },
			{ name: 'orderType', type: 'uint8' }
		],
		outputs: [{ name: 'orderId', type: 'uint128' }]
	},
	{
		type: 'function',
		name: 'cancelOrder',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'marketId', type: 'bytes32' },
			{ name: 'orderId', type: 'uint128' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'reduceOrder',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'marketId', type: 'bytes32' },
			{ name: 'orderId', type: 'uint128' },
			{ name: 'quantity', type: 'uint256' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'mintCompleteSet',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'marketId', type: 'bytes32' },
			{ name: 'amount', type: 'uint256' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'mergeCompleteSet',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'marketId', type: 'bytes32' },
			{ name: 'amount', type: 'uint256' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'redeem',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'marketId', type: 'bytes32' },
			{ name: 'outcomeIdx', type: 'uint8' },
			{ name: 'amount', type: 'uint256' }
		],
		outputs: []
	},
	{
		type: 'function',
		name: 'syncMarket',
		stateMutability: 'nonpayable',
		inputs: [{ name: 'marketId', type: 'bytes32' }],
		outputs: []
	},
	{
		type: 'function',
		name: 'asset',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ type: 'address' }]
	},
	{
		type: 'function',
		name: 'operator',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ type: 'address' }]
	},
	{ type: 'error', name: 'MarketNotTrading', inputs: [] }
] as const;

export const operatorMethods = [
	'placeOrder',
	'cancelOrder',
	'reduceOrder',
	'mintCompleteSet',
	'mergeCompleteSet',
	'redeem',
	'syncMarket'
] as const;

export const forbiddenMethods = [
	'withdraw',
	'redeemShares',
	'requestRedeem',
	'deposit',
	'mint'
] as const;

export type Side = 0 | 1 | 2 | 3;

export const SIDE = {
	BUY_YES: 0,
	SELL_YES: 1,
	BUY_NO: 2,
	SELL_NO: 3
} as const satisfies Record<string, Side>;

const erc20Abi = [
	{
		type: 'function',
		name: 'decimals',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ type: 'uint8' }]
	},
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [{ name: 'account', type: 'address' }],
		outputs: [{ type: 'uint256' }]
	}
] as const;

const erc6909Abi = [
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'id', type: 'uint256' }
		],
		outputs: [{ type: 'uint256' }]
	}
] as const;

export type VaultAdapterConfig = {
	vault: Address;
	asset: Address;
	publicClient: PublicClient;
	walletClient?: WalletClient;
	account?: Account;
};

export function snap(amount: bigint, grid: bigint): bigint {
	if (grid === 0n) return amount;
	return (amount / grid) * grid;
}

/**
 * Operator-key signer. Reads always use `vault` as the trader, never the operator EOA.
 * Does not wrap IERC4626 withdraw/redeem or ERC-7540 requestRedeem.
 */
export function createVaultAdapter(cfg: VaultAdapterConfig) {
	const trader = cfg.vault;

	async function assetDecimals(): Promise<number> {
		const d = await cfg.publicClient.readContract({
			address: cfg.asset,
			abi: erc20Abi,
			functionName: 'decimals'
		});
		return Number(d);
	}

	async function idleCollateral(): Promise<bigint> {
		return await cfg.publicClient.readContract({
			address: cfg.asset,
			abi: erc20Abi,
			functionName: 'balanceOf',
			args: [trader]
		});
	}

	async function outcomeBalance(token: Address, id: bigint): Promise<bigint> {
		return await cfg.publicClient.readContract({
			address: token,
			abi: erc6909Abi,
			functionName: 'balanceOf',
			args: [trader, id]
		});
	}

	async function vaultAsset(): Promise<Address> {
		return await cfg.publicClient.readContract({
			address: cfg.vault,
			abi: vaultAbi,
			functionName: 'asset'
		});
	}

	async function vaultOperator(): Promise<Address | null> {
		try {
			return await cfg.publicClient.readContract({
				address: cfg.vault,
				abi: vaultAbi,
				functionName: 'operator'
			});
		} catch {
			return null;
		}
	}

	function write(functionName: (typeof operatorMethods)[number], args: readonly unknown[]) {
		if (!cfg.walletClient || !cfg.account) {
			return Promise.reject(new Error('OPERATOR_PRIVATE_KEY required for vault writes'));
		}
		return cfg.walletClient.writeContract({
			address: cfg.vault,
			abi: vaultAbi,
			functionName,
			args: args as never,
			account: cfg.account,
			chain: cfg.walletClient.chain
		});
	}

	return {
		trader,
		operatorMethods,
		forbiddenMethods,
		snap,
		assetDecimals,
		idleCollateral,
		outcomeBalance,
		vaultAsset,
		vaultOperator,
		placeOrder: (
			marketId: Hex,
			side: Side,
			price: bigint,
			quantity: bigint,
			expireTimestampNs: bigint,
			orderType: number
		) => write('placeOrder', [marketId, side, price, quantity, expireTimestampNs, orderType]),
		cancelOrder: (marketId: Hex, orderId: bigint) => write('cancelOrder', [marketId, orderId]),
		reduceOrder: (marketId: Hex, orderId: bigint, quantity: bigint) =>
			write('reduceOrder', [marketId, orderId, quantity]),
		mintCompleteSet: (marketId: Hex, amount: bigint) =>
			write('mintCompleteSet', [marketId, amount]),
		mergeCompleteSet: (marketId: Hex, amount: bigint) =>
			write('mergeCompleteSet', [marketId, amount]),
		redeem: (marketId: Hex, outcomeIdx: number, amount: bigint) =>
			write('redeem', [marketId, outcomeIdx, amount]),
		syncMarket: (marketId: Hex) => write('syncMarket', [marketId])
	};
}

export type VaultAdapter = ReturnType<typeof createVaultAdapter>;
