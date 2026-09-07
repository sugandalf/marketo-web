import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Hex } from 'viem';
import { errorMessage, log } from './log.ts';

function isStandaloneExecutable(): boolean {
	const bun = (globalThis as { Bun?: { isStandaloneExecutable?: boolean } }).Bun;
	return bun?.isStandaloneExecutable === true;
}

function resolveStateDir(): string {
	const fromEnv = process.env.BOT_STATE_DIR?.trim();
	if (fromEnv) return fromEnv;
	if (isStandaloneExecutable()) return join(process.cwd(), '.state');
	return join(dirname(fileURLToPath(import.meta.url)), '..', '.state');
}

const stateDir = resolveStateDir();
const statePath = join(stateDir, 'markets.json');

type StateFile = { marketIds: Hex[] };

export async function loadTradedMarketIds(): Promise<Set<Hex>> {
	try {
		const raw = await readFile(statePath, 'utf8');
		const parsed = JSON.parse(raw) as StateFile;
		return new Set((parsed.marketIds ?? []).filter((id): id is Hex => typeof id === 'string'));
	} catch {
		return new Set();
	}
}

export async function rememberMarketId(marketId: Hex): Promise<void> {
	const ids = await loadTradedMarketIds();
	if (ids.has(marketId)) return;
	ids.add(marketId);
	try {
		await mkdir(stateDir, { recursive: true });
		await writeFile(
			statePath,
			JSON.stringify({ marketIds: [...ids] } satisfies StateFile, null, 2)
		);
	} catch (error) {
		log(`could not persist marketId: ${errorMessage(error)}`);
	}
}
