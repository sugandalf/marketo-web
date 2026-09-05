export type Market = 'BTC' | 'ETH';
export type HeroStatus = 'active' | 'scratched';
export type BackerKind = 'deposit' | 'withdraw';

export type PastFight = {
	date: string;
	window: '15m' | '1h';
	market: Market;
	side: 'up' | 'down';
	pnlUsdso: number;
};

export type LastBacker = {
	kind: BackerKind;
	amountUsdso: number;
	address: string;
	at: string;
};

export type Hero = {
	id: string;
	program: number;
	name: string;
	market: Market;
	window: '15m' | '1h';
	vaultUsdso: number;
	vaultMaxUsdso: number;
	created: string;
	status: HeroStatus;
	fights: PastFight[];
	lastBacker: LastBacker | null;
	strategy?: string;
	live?: boolean;
	creatorAddress?: string;
	operatorAddress?: string;
	pnlUsdso?: number;
	vaultAddress?: string;
};

const IN_FORM_LIMIT = 3;

/** Max vault purse is this many times the creator's opening seed. */
export const PURSE_QUOTA_MULTIPLIER = 5;

/** Newest fights shown on the program Hot Sheet. */
export const OVERLAY_FIGHT_LIMIT = 5;

export function purseQuota(seedUsdso: number): number {
	return seedUsdso * PURSE_QUOTA_MULTIPLIER;
}

export function recentFights(hero: Hero, limit = OVERLAY_FIGHT_LIMIT): PastFight[] {
	return hero.fights.slice(0, limit);
}

export function heroVaultAddress(hero: Hero): string | null {
	if (hero.vaultAddress) return hero.vaultAddress;
	if (hero.live) return hero.id;
	return null;
}

export function recentPnl(hero: Hero): number {
	return hero.fights[0]?.pnlUsdso ?? 0;
}

export function heroPnl(hero: Hero): number {
	if (hero.pnlUsdso !== undefined) return hero.pnlUsdso;
	return hero.fights.reduce((sum, fight) => sum + fight.pnlUsdso, 0);
}

export function heroAgeDays(hero: Hero, now = new Date()): number {
	const created = Date.parse(`${hero.created}T00:00:00`);
	if (Number.isNaN(created)) return 0;
	return Math.max(0, Math.floor((now.getTime() - created) / 86_400_000));
}

export function purseFill(hero: Hero): number {
	if (hero.vaultMaxUsdso <= 0) return 0;
	return Math.min(100, (hero.vaultUsdso / hero.vaultMaxUsdso) * 100);
}

export function purseFull(hero: Hero): boolean {
	if (hero.vaultMaxUsdso <= 0) return false;
	return hero.vaultUsdso >= hero.vaultMaxUsdso;
}

export function isInForm(hero: Hero): boolean {
	return hero.status === 'active' && !purseFull(hero) && recentPnl(hero) > 0;
}

export function inFormHeroes(list: Hero[]): Hero[] {
	return list
		.filter(isInForm)
		.sort((a, b) => recentPnl(b) - recentPnl(a) || a.program - b.program)
		.slice(0, IN_FORM_LIMIT);
}

export function mergeLiveRoster(live: Hero[], rest: Hero[]): Hero[] {
	const seen = new Set(live.map((hero) => hero.id.toLowerCase()));
	return [...live, ...rest.filter((hero) => !seen.has(hero.id.toLowerCase()))];
}

export function homepageRoster(
	entered: Hero | null,
	wantedId: string | null,
	live: Hero[] = []
): Hero[] {
	const extras: Hero[] = [];
	const seen = new Set<string>();
	const pin = (hero: Hero | null | undefined) => {
		if (!hero || seen.has(hero.id.toLowerCase())) return;
		seen.add(hero.id.toLowerCase());
		extras.push(hero);
	};
	for (const hero of live) pin(hero);
	pin(entered);
	if (wantedId) {
		pin(entered?.id === wantedId ? entered : live.find((hero) => hero.id === wantedId));
	}
	return extras;
}
