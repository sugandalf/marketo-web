import type { Hero } from './heroes';
import { heroById, heroPnl, heroes } from './heroes';
import { loadEnteredHero, type EnteredHero } from './entered';

const KEY = 'marketo:book:v2';

export type BookRole = 'backed' | 'mine';

export type BookEntry = {
	heroId: string;
	backed: boolean;
	mine: boolean;
	capitalUsdso: number;
	pnlUsdso: number;
};

export type Holding = BookEntry & {
	hero: Hero;
	navUsdso: number;
	sharesPct: number;
	capitalFill: number;
};

/** Illustrative book until chain data exists. Figures are synthetic. */
const DEMO: BookEntry[] = [
	{ heroId: 'warden', backed: true, mine: false, capitalUsdso: 2780, pnlUsdso: 820 },
	{ heroId: 'kite', backed: true, mine: false, capitalUsdso: 1040, pnlUsdso: 260 },
	{ heroId: 'ash', backed: true, mine: true, capitalUsdso: 680, pnlUsdso: 160 },
	{ heroId: 'redline', backed: false, mine: true, capitalUsdso: 0, pnlUsdso: 0 }
];

function cloneDemo(): BookEntry[] {
	return DEMO.map((entry) => ({ ...entry }));
}

function readStored(): BookEntry[] | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as BookEntry[];
		if (!Array.isArray(parsed) || parsed.length === 0) return null;
		return parsed.filter((entry) => entry?.heroId);
	} catch {
		return null;
	}
}

function writeStored(entries: BookEntry[]) {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.setItem(KEY, JSON.stringify(entries));
}

function withEntered(entries: BookEntry[], entered: EnteredHero | null): BookEntry[] {
	if (!entered) return entries;
	const next = entries.map((entry) => ({ ...entry }));
	const existing = next.find((entry) => entry.heroId === entered.id);
	if (existing) {
		existing.mine = true;
		return next;
	}
	next.push({
		heroId: entered.id,
		backed: false,
		mine: true,
		capitalUsdso: 0,
		pnlUsdso: 0
	});
	return next;
}

export function loadBook(entered: EnteredHero | null = loadEnteredHero()): BookEntry[] {
	return withEntered(readStored() ?? cloneDemo(), entered);
}

export function saveBook(entries: BookEntry[]) {
	writeStored(entries);
}

export function holdingFrom(entry: BookEntry, extraHero?: Hero | null): Holding | null {
	const hero = extraHero?.id === entry.heroId ? extraHero : heroById(entry.heroId);
	if (!hero && !extraHero) {
		const rosterHero = heroes.find((item) => item.id === entry.heroId);
		if (!rosterHero) return null;
		return packHolding(entry, rosterHero);
	}
	if (!hero) return extraHero ? packHolding(entry, extraHero) : null;
	return packHolding(entry, hero);
}

function packHolding(entry: BookEntry, hero: Hero): Holding {
	const pnlUsdso = entry.mine && !entry.backed ? heroPnl(hero) : entry.pnlUsdso;
	const navUsdso = Math.max(0, entry.capitalUsdso + (entry.backed ? entry.pnlUsdso : 0));
	const sharesPct = hero.vaultUsdso > 0 && entry.backed ? (entry.capitalUsdso / hero.vaultUsdso) * 100 : 0;
	const capitalFill =
		hero.vaultUsdso > 0 && entry.backed ? Math.min(100, (entry.capitalUsdso / hero.vaultUsdso) * 100) : 0;
	return {
		...entry,
		hero,
		pnlUsdso,
		navUsdso,
		sharesPct,
		capitalFill
	};
}

export function bookHoldings(entries: BookEntry[], entered: EnteredHero | null): Holding[] {
	return entries
		.map((entry) => holdingFrom(entry, entered?.id === entry.heroId ? entered : null))
		.filter((holding): holding is Holding => Boolean(holding))
		.sort((a, b) => a.hero.program - b.hero.program);
}

export function bookTotals(holdings: Holding[]) {
	return holdings.reduce(
		(sum, holding) => {
			if (holding.backed) {
				sum.pnl += holding.pnlUsdso;
				sum.atRisk += holding.capitalUsdso;
			}
			return sum;
		},
		{ pnl: 0, atRisk: 0 }
	);
}

export function applyDeposit(entries: BookEntry[], heroId: string, amount: number): BookEntry[] {
	if (amount <= 0) return entries;
	const next = entries.map((entry) => ({ ...entry }));
	const existing = next.find((entry) => entry.heroId === heroId);
	if (existing) {
		existing.backed = true;
		existing.capitalUsdso += amount;
		return next;
	}
	next.push({
		heroId,
		backed: true,
		mine: false,
		capitalUsdso: amount,
		pnlUsdso: 0
	});
	return next;
}

export function applyWithdraw(entries: BookEntry[], heroId: string, amount: number): BookEntry[] {
	if (amount <= 0) return entries;
	const next = entries.map((entry) => ({ ...entry }));
	const existing = next.find((entry) => entry.heroId === heroId && entry.backed);
	if (!existing) return entries;
	const nav = existing.capitalUsdso + existing.pnlUsdso;
	if (nav <= 0) return entries;
	const take = Math.min(amount, nav);
	const capShare = existing.capitalUsdso / nav;
	existing.capitalUsdso = Math.round(Math.max(0, existing.capitalUsdso - take * capShare) * 100) / 100;
	existing.pnlUsdso = Math.round(Math.max(0, existing.pnlUsdso - take * (1 - capShare)) * 100) / 100;
	if (existing.capitalUsdso < 0.005 && existing.pnlUsdso < 0.005) {
		existing.capitalUsdso = 0;
		existing.pnlUsdso = 0;
		existing.backed = false;
	}
	return existing.backed || existing.mine ? next : next.filter((entry) => entry.heroId !== heroId);
}
