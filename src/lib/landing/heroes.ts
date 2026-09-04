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
};

const IN_FORM_LIMIT = 3;

/** Illustrative roster. Every figure is synthetic until chain data exists. */
export const heroes: Hero[] = [
	{
		id: 'warden',
		program: 1,
		name: 'WARDEN',
		market: 'BTC',
		window: '15m',
		vaultUsdso: 12850,
		vaultMaxUsdso: 20000,
		created: '2026-08-17',
		status: 'active',
		lastBacker: {
			kind: 'deposit',
			amountUsdso: 250,
			address: '0x8f1a9c3e7b2d4a56e90f1234abcd5678a3c2',
			at: '2026-08-31T12:40:00+07:00'
		},
		fights: [
			{ date: '2026-08-17', window: '15m', market: 'ETH', side: 'up', pnlUsdso: 1240 },
			{ date: '2026-08-16', window: '15m', market: 'BTC', side: 'down', pnlUsdso: -380 },
			{ date: '2026-08-15', window: '15m', market: 'BTC', side: 'up', pnlUsdso: 910 },
			{ date: '2026-08-14', window: '1h', market: 'ETH', side: 'up', pnlUsdso: 640 },
			{ date: '2026-08-13', window: '15m', market: 'BTC', side: 'down', pnlUsdso: 210 }
		]
	},
	{
		id: 'kite',
		program: 2,
		name: 'KITE',
		market: 'ETH',
		window: '1h',
		vaultUsdso: 11920,
		vaultMaxUsdso: 20000,
		created: '2026-08-18',
		status: 'active',
		lastBacker: {
			kind: 'deposit',
			amountUsdso: 100,
			address: '0x9c2a11f4d8e7b001c4aa7788beef09127f91',
			at: '2026-08-31T16:40:00+07:00'
		},
		fights: [
			{ date: '2026-08-17', window: '1h', market: 'ETH', side: 'up', pnlUsdso: 880 },
			{ date: '2026-08-16', window: '1h', market: 'BTC', side: 'up', pnlUsdso: 420 },
			{ date: '2026-08-14', window: '15m', market: 'ETH', side: 'down', pnlUsdso: -190 }
		]
	},
	{
		id: 'redline',
		program: 3,
		name: 'REDLINE',
		market: 'BTC',
		window: '15m',
		vaultUsdso: 9860,
		vaultMaxUsdso: 18000,
		created: '2026-08-16',
		status: 'active',
		lastBacker: {
			kind: 'withdraw',
			amountUsdso: 80,
			address: '0x4b77aa0199c3d2e8f001aabbccddee112233',
			at: '2026-08-31T08:10:00+07:00'
		},
		fights: [
			{ date: '2026-08-17', window: '15m', market: 'BTC', side: 'up', pnlUsdso: 540 },
			{ date: '2026-08-15', window: '15m', market: 'ETH', side: 'down', pnlUsdso: -720 },
			{ date: '2026-08-13', window: '15m', market: 'BTC', side: 'up', pnlUsdso: 1100 }
		]
	},
	{
		id: 'ash',
		program: 4,
		name: 'ASH',
		market: 'ETH',
		window: '1h',
		vaultUsdso: 10410,
		vaultMaxUsdso: 16000,
		created: '2026-08-19',
		status: 'active',
		lastBacker: {
			kind: 'deposit',
			amountUsdso: 50,
			address: '0xa1b2c3d4e5f60718293a445566778899aabbcc',
			at: '2026-08-30T21:00:00+07:00'
		},
		fights: [
			{ date: '2026-08-17', window: '1h', market: 'ETH', side: 'down', pnlUsdso: 310 },
			{ date: '2026-08-16', window: '1h', market: 'ETH', side: 'up', pnlUsdso: 760 },
			{ date: '2026-08-12', window: '15m', market: 'BTC', side: 'up', pnlUsdso: 95 }
		]
	},
	{
		id: 'glaze',
		program: 5,
		name: 'GLAZE',
		market: 'BTC',
		window: '15m',
		vaultUsdso: 6420,
		vaultMaxUsdso: 15000,
		created: '2026-08-22',
		status: 'active',
		lastBacker: {
			kind: 'deposit',
			amountUsdso: 40,
			address: '0xcc11dd22ee33ff44aa55006677889900112233',
			at: '2026-08-31T18:00:00+07:00'
		},
		fights: [
			{ date: '2026-08-28', window: '15m', market: 'BTC', side: 'down', pnlUsdso: -410 },
			{ date: '2026-08-26', window: '15m', market: 'ETH', side: 'down', pnlUsdso: -95 }
		]
	},
	{
		id: 'hollow',
		program: 6,
		name: 'HOLLOW',
		market: 'ETH',
		window: '1h',
		vaultUsdso: 3100,
		vaultMaxUsdso: 12000,
		created: '2026-08-10',
		status: 'scratched',
		lastBacker: {
			kind: 'withdraw',
			amountUsdso: 200,
			address: '0xdead00001111aaaa2222bbbb3333cccc4444',
			at: '2026-08-29T11:00:00+07:00'
		},
		fights: [
			{ date: '2026-08-20', window: '1h', market: 'ETH', side: 'down', pnlUsdso: -880 },
			{ date: '2026-08-18', window: '1h', market: 'BTC', side: 'up', pnlUsdso: 140 }
		]
	},
	{
		id: 'pinion',
		program: 7,
		name: 'PINION',
		market: 'BTC',
		window: '1h',
		vaultUsdso: 20000,
		vaultMaxUsdso: 20000,
		created: '2026-08-12',
		status: 'active',
		lastBacker: {
			kind: 'deposit',
			amountUsdso: 500,
			address: '0x5555eeee6666ffff7777aaaa8888bbbb9999',
			at: '2026-08-31T10:00:00+07:00'
		},
		fights: [
			{ date: '2026-08-21', window: '1h', market: 'BTC', side: 'up', pnlUsdso: 220 },
			{ date: '2026-08-19', window: '15m', market: 'ETH', side: 'up', pnlUsdso: 60 }
		]
	},
	{
		id: 'vicar',
		program: 8,
		name: 'VICAR',
		market: 'ETH',
		window: '15m',
		vaultUsdso: 4780,
		vaultMaxUsdso: 14000,
		created: '2026-08-25',
		status: 'active',
		lastBacker: null,
		fights: [{ date: '2026-08-27', window: '15m', market: 'ETH', side: 'up', pnlUsdso: 55 }]
	}
];

export function heroById(id: string): Hero | undefined {
	return heroes.find((hero) => hero.id === id);
}

export function recentPnl(hero: Hero): number {
	return hero.fights[0]?.pnlUsdso ?? 0;
}

export function heroPnl(hero: Hero): number {
	return hero.fights.reduce((sum, fight) => sum + fight.pnlUsdso, 0);
}

export function heroAgeDays(hero: Hero, now = new Date()): number {
	const created = Date.parse(`${hero.created}T00:00:00`);
	if (Number.isNaN(created)) return 0;
	return Math.max(0, Math.floor((now.getTime() - created) / 86_400_000));
}

export function purseFill(hero: Hero): number {
	if (hero.live || hero.vaultMaxUsdso <= 0) return 0;
	return Math.min(100, (hero.vaultUsdso / hero.vaultMaxUsdso) * 100);
}

export function purseFull(hero: Hero): boolean {
	if (hero.live) return false;
	return hero.vaultUsdso >= hero.vaultMaxUsdso;
}

export function isInForm(hero: Hero): boolean {
	return hero.status === 'active' && !purseFull(hero) && recentPnl(hero) > 0;
}

export function inFormHeroes(list: Hero[] = heroes): Hero[] {
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
	const form = inFormHeroes();
	const extras: Hero[] = [];
	const seen = new Set(form.map((hero) => hero.id));
	const pin = (hero: Hero | null | undefined) => {
		if (!hero || seen.has(hero.id)) return;
		seen.add(hero.id);
		extras.push(hero);
	};
	for (const hero of live) pin(hero);
	pin(entered);
	if (wantedId) {
		pin(
			entered?.id === wantedId
				? entered
				: (live.find((hero) => hero.id === wantedId) ?? heroById(wantedId))
		);
	}
	return [...extras, ...form];
}
