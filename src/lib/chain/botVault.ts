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
	{ type: 'error', name: 'InvalidAmount', inputs: [] },
	{ type: 'error', name: 'DepositCapExceeded', inputs: [] }
] as const;
