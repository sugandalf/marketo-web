import type { Hero, Market } from './heroes';
import { heroes } from './heroes';

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
	return Math.max(...heroes.map((hero) => hero.program), 0) + 1;
}

export function uniqueHeroId(name: string) {
	const base = slugHeroId(name);
	if (!heroes.some((hero) => hero.id === base)) return base;
	return `${base}-${nextProgram()}`;
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
		return parsed;
	} catch {
		return null;
	}
}

export function buildEnteredHero(input: {
	name: string;
	market: Market;
	strategy: string;
	amount: number;
	botWallet: string;
}): EnteredHero {
	return {
		id: uniqueHeroId(input.name),
		program: nextProgram(),
		name: input.name.trim().toUpperCase(),
		market: input.market,
		window: '15m',
		vaultUsdso: input.amount,
		fights: [],
		strategy: input.strategy.trim(),
		botWallet: input.botWallet
	};
}
