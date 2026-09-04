import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Hex } from 'viem';
import { errorMessage, log } from './log.ts';

const stateDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.state');
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
