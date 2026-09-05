import type { Hero, Market } from './heroes';
import { purseQuota } from './heroes';

const KEY = 'marketo:entered-horse';

export type EnteredHero = Hero & {
	strategy: string;
	botWallet: string;
};

export function slugHeroId(name: string) {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return slug || 'horse';
}

export function nextProgram() {
	return 1;
}

export function uniqueHeroId(name: string) {
	return slugHeroId(name);
}

export function saveEnteredHero(hero: EnteredHero) {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.setItem(KEY, JSON.stringify(hero));
}

export function loadEnteredHero(): EnteredHero | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as EnteredHero;
		if (!parsed?.id || !parsed?.name) return null;
		const vaultAddress =
			parsed.vaultAddress ?? (parsed.id.startsWith('0x') ? parsed.id : undefined);
		return {
			...parsed,
			vaultMaxUsdso: parsed.vaultMaxUsdso ?? purseQuota(parsed.vaultUsdso ?? 0),
			created: parsed.created ?? new Date().toISOString().slice(0, 10),
			status: parsed.status ?? 'active',
			lastBacker: parsed.lastBacker ?? null,
			fights: parsed.fights ?? [],
			live: parsed.live ?? Boolean(vaultAddress),
			vaultAddress
		};
	} catch {
		return null;
	}
}

export function buildEnteredHero(input: {
	id?: string;
	name: string;
	market: Market;
	strategy: string;
	amount: number;
	botWallet: string;
}): EnteredHero {
	const vaultAddress = input.id;
	return {
		id: vaultAddress ?? uniqueHeroId(input.name),
		program: nextProgram(),
		name: input.name.trim().toUpperCase(),
		market: input.market,
		window: '15m',
		vaultUsdso: input.amount,
		vaultMaxUsdso: purseQuota(input.amount),
		created: new Date().toISOString().slice(0, 10),
		status: 'active',
		lastBacker: null,
		fights: [],
		strategy: input.strategy.trim(),
		botWallet: input.botWallet,
		live: Boolean(vaultAddress),
		vaultAddress
	};
}
