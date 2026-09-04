export const botVaultAbi = [
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'assets', type: 'uint256' },
			{ name: 'receiver', type: 'address' }
		],
		outputs: [{ name: 'shares', type: 'uint256' }]
	},
	{
		type: 'function',
		name: 'maxDeposit',
		stateMutability: 'view',
		inputs: [{ name: 'receiver', type: 'address' }],
		outputs: [{ name: '', type: 'uint256' }]
	},
	{
		type: 'function',
		name: 'asset',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ name: '', type: 'address' }]
	},
	{
		type: 'function',
		name: 'previewDeposit',
		stateMutability: 'view',
		inputs: [{ name: 'assets', type: 'uint256' }],
		outputs: [{ name: '', type: 'uint256' }]
	},
	{
		type: 'event',
		name: 'Deposit',
		inputs: [
			{ name: 'sender', type: 'address', indexed: true },
			{ name: 'owner', type: 'address', indexed: true },
			{ name: 'assets', type: 'uint256', indexed: false },
			{ name: 'shares', type: 'uint256', indexed: false }
		]
	},
	{
		type: 'function',
		name: 'withdraw',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'assets', type: 'uint256' },
			{ name: 'receiver', type: 'address' },
			{ name: 'owner', type: 'address' }
		],
		outputs: [{ name: 'shares', type: 'uint256' }]
	},
	{
		type: 'function',
		name: 'maxWithdraw',
		stateMutability: 'view',
		inputs: [{ name: 'owner', type: 'address' }],
		outputs: [{ name: '', type: 'uint256' }]
	},
	{
		type: 'function',
		name: 'previewWithdraw',
		stateMutability: 'view',
		inputs: [{ name: 'assets', type: 'uint256' }],
		outputs: [{ name: '', type: 'uint256' }]
	},
	{
		type: 'function',
		name: 'convertToAssets',
		stateMutability: 'view',
		inputs: [{ name: 'shares', type: 'uint256' }],
		outputs: [{ name: '', type: 'uint256' }]
	},
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [{ name: 'account', type: 'address' }],
		outputs: [{ name: '', type: 'uint256' }]
	},
	{
		type: 'event',
		name: 'Withdraw',
		inputs: [
			{ name: 'sender', type: 'address', indexed: true },
			{ name: 'receiver', type: 'address', indexed: true },
			{ name: 'owner', type: 'address', indexed: true },
			{ name: 'assets', type: 'uint256', indexed: false },
			{ name: 'shares', type: 'uint256', indexed: false }
		]
	},
	{ type: 'error', name: 'InvalidAmount', inputs: [] },
	{ type: 'error', name: 'DepositCapExceeded', inputs: [] },
	{
		type: 'error',
		name: 'ERC4626ExceededMaxWithdraw',
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'assets', type: 'uint256' },
			{ name: 'max', type: 'uint256' }
		]
	}
] as const;
