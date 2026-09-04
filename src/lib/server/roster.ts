import { erc20Abi, formatUnits } from 'viem';
import { chainConfig } from '$lib/chain/config';
import type { Hero, LastBacker } from '$lib/landing/heroes';
import { heroes } from '$lib/landing/heroes';
import { listEnteredBots, type EnteredBot } from './bots';
import { somniaPublicClient } from './chain';
import { listDeposits, type DepositRow } from './deposits';

export type LiveHorse = Hero & {
	live: true;
	creatorAddress: string;
	operatorAddress: string;
};

export type FieldPayload = {
	horses: LiveHorse[];
	deposits: DepositRow[];
	decimals: number;
};

function nextProgramStart(): number {
	return Math.max(...heroes.map((hero) => hero.program), 0) + 1;
}

function toDisplay(amount: bigint, decimals: number): number {
	return Number.parseFloat(formatUnits(amount, decimals)) || 0;
}

async function assetDecimals(): Promise<number> {
	if (!chainConfig.ok) return 18;
	try {
		return await somniaPublicClient().readContract({
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'decimals'
		});
	} catch {
		return 18;
	}
}

function lastBackerFor(
	vaultAddress: string,
	deposits: DepositRow[],
	decimals: number
): LastBacker | null {
	const latest = deposits
		.filter((row) => row.vaultAddress.toLowerCase() === vaultAddress.toLowerCase())
		.sort((a, b) => b.createdAt - a.createdAt)[0];
	if (!latest) return null;
	return {
		kind: 'deposit',
		amountUsdso: toDisplay(BigInt(latest.assets), decimals),
		address: latest.depositorAddress,
		at: new Date(latest.createdAt).toISOString()
	};
}

function purseFor(botRow: EnteredBot, deposits: DepositRow[], decimals: number): number {
	let total = BigInt(botRow.seedAssets);
	for (const row of deposits) {
		if (row.vaultAddress.toLowerCase() === botRow.vaultAddress.toLowerCase()) {
			total += BigInt(row.assets);
		}
	}
	return toDisplay(total, decimals);
}

export function horseFromBot(
	botRow: EnteredBot,
	deposits: DepositRow[],
	decimals: number,
	program: number
): LiveHorse {
	return {
		id: botRow.vaultAddress,
		program,
		name: botRow.name,
		market: botRow.market,
		window: '15m',
		vaultUsdso: purseFor(botRow, deposits, decimals),
		vaultMaxUsdso: 0,
		created: new Date(botRow.createdAt).toISOString().slice(0, 10),
		status: 'active',
		fights: [],
		lastBacker: lastBackerFor(botRow.vaultAddress, deposits, decimals),
		strategy: botRow.strategy,
		live: true,
		creatorAddress: botRow.creatorAddress,
		operatorAddress: botRow.operatorAddress
	};
}

export async function loadField(): Promise<FieldPayload> {
	const [bots, deposits, decimals] = await Promise.all([
		listEnteredBots(),
		listDeposits(),
		assetDecimals()
	]);
	const start = nextProgramStart();
	const horses = bots.map((botRow, index) =>
		horseFromBot(botRow, deposits, decimals, start + index)
	);
	return { horses, deposits, decimals };
}
