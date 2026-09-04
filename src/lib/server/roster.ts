import { erc20Abi, formatUnits } from 'viem';
import { chainConfig } from '$lib/chain/config';
import type { Hero, LastBacker, PastFight } from '$lib/landing/heroes';
import { heroes } from '$lib/landing/heroes';
import { listEnteredBots, type EnteredBot } from './bots';
import { somniaPublicClient } from './chain';
import { listDeposits, type DepositRow } from './deposits';
import {
	listBotFights,
	listBotStats,
	type BotFightRow,
	type BotStatsRow
} from './performance/store';
import { listWithdrawals, type WithdrawalRow } from './withdrawals';

export type LiveHorse = Hero & {
	live: true;
	creatorAddress: string;
	operatorAddress: string;
};

export type FieldPayload = {
	horses: LiveHorse[];
	deposits: DepositRow[];
	withdrawals: WithdrawalRow[];
	decimals: number;
};

function nextProgramStart(): number {
	return Math.max(...heroes.map((hero) => hero.program), 0) + 1;
}

function toDisplay(amount: bigint, decimals: number): number {
	const n = Number.parseFloat(formatUnits(amount, decimals));
	return Number.isFinite(n) ? n : 0;
}

function parseAmount(value: string): bigint {
	try {
		return BigInt(value);
	} catch {
		return 0n;
	}
}

async function assetDecimals(): Promise<number> {
	if (!chainConfig.ok) return 6;
	try {
		return await somniaPublicClient().readContract({
			abi: erc20Abi,
			address: chainConfig.assetAddress,
			functionName: 'decimals'
		});
	} catch {
		return 6;
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

function fightsFor(vaultAddress: string, fights: BotFightRow[], decimals: number): PastFight[] {
	const key = vaultAddress.toLowerCase();
	return fights
		.filter((row) => row.vaultAddress.toLowerCase() === key)
		.map((row) => ({
			date: row.date,
			window: row.window,
			market: row.market,
			side: row.side,
			pnlUsdso: toDisplay(parseAmount(row.pnlAssets), decimals)
		}));
}

export function horseFromBot(
	botRow: EnteredBot,
	deposits: DepositRow[],
	decimals: number,
	program: number,
	stats: BotStatsRow | undefined,
	fights: BotFightRow[]
): LiveHorse {
	const horse: LiveHorse = {
		id: botRow.vaultAddress,
		program,
		name: botRow.name,
		market: botRow.market,
		window: '15m',
		vaultUsdso: stats ? toDisplay(parseAmount(stats.tvlAssets), decimals) : 0,
		vaultMaxUsdso: 0,
		created: new Date(botRow.createdAt).toISOString().slice(0, 10),
		status: 'active',
		fights: fightsFor(botRow.vaultAddress, fights, decimals),
		lastBacker: lastBackerFor(botRow.vaultAddress, deposits, decimals),
		strategy: botRow.strategy,
		live: true,
		creatorAddress: botRow.creatorAddress,
		operatorAddress: botRow.operatorAddress
	};
	if (stats) {
		horse.pnlUsdso = toDisplay(parseAmount(stats.pnlAssets), decimals);
	}
	return horse;
}

export async function loadField(): Promise<FieldPayload> {
	const [bots, deposits, withdrawals, decimals, statsRows, fightRows] = await Promise.all([
		listEnteredBots(),
		listDeposits(),
		listWithdrawals(),
		assetDecimals(),
		listBotStats(),
		listBotFights()
	]);
	const statsByVault = new Map(statsRows.map((row) => [row.vaultAddress.toLowerCase(), row]));
	const start = nextProgramStart();
	const horses = bots.map((botRow, index) =>
		horseFromBot(
			botRow,
			deposits,
			decimals,
			start + index,
			statsByVault.get(botRow.vaultAddress.toLowerCase()),
			fightRows
		)
	);
	return { horses, deposits, withdrawals, decimals };
}
