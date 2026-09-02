export const vaultFactoryAbi = [
	{
		type: 'function',
		name: 'createVault',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'operator', type: 'address' },
			{ name: 'asset', type: 'address' },
			{ name: 'name_', type: 'string' },
			{ name: 'symbol_', type: 'string' },
			{ name: 'seedAssets', type: 'uint256' },
			{ name: 'performanceFeeBps', type: 'uint32' },
			{ name: 'creatorFeeRecipient', type: 'address' }
		],
		outputs: [{ name: 'vault', type: 'address' }]
	},
	{
		type: 'event',
		name: 'VaultCreated',
		inputs: [
			{ name: 'vault', type: 'address', indexed: true },
			{ name: 'owner', type: 'address', indexed: true },
			{ name: 'operator', type: 'address', indexed: true },
			{ name: 'asset', type: 'address', indexed: false },
			{ name: 'seed', type: 'uint256', indexed: false },
			{ name: 'performanceFeeBps', type: 'uint32', indexed: false },
			{ name: 'creatorFeeRecipient', type: 'address', indexed: false }
		]
	},
	{ type: 'error', name: 'OperatorExists', inputs: [] },
	{ type: 'error', name: 'InvalidAmount', inputs: [] },
	{ type: 'error', name: 'ZeroAddress', inputs: [] },
	{
		type: 'error',
		name: 'InsufficientBalance',
		inputs: [
			{ name: 'balance', type: 'uint256' },
			{ name: 'needed', type: 'uint256' }
		]
	},
	{
		type: 'error',
		name: 'SafeERC20FailedOperation',
		inputs: [{ name: 'token', type: 'address' }]
	}
] as const;

export const PERFORMANCE_FEE_BPS = 0;
