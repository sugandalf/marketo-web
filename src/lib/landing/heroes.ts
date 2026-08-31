export type Market = 'BTC' | 'ETH';

export type PastFight = {
	date: string;
	window: '15m' | '1h';
	market: Market;
	side: 'up' | 'down';
	pnlUsdso: number;
};

export type Hero = {
	id: string;
	program: number;
	name: string;
	market: Market;
	window: '15m' | '1h';
	vaultUsdso: number;
	fights: PastFight[];
	strategy?: string;
};

/** Illustrative roster. Every figure is synthetic until chain data exists. */
export const heroes: Hero[] = [
	{
		id: 'warden',
		program: 1,
		name: 'WARDEN',
		market: 'BTC',
		window: '15m',
		vaultUsdso: 12850,
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
		fights: [
			{ date: '2026-08-17', window: '1h', market: 'ETH', side: 'down', pnlUsdso: 310 },
			{ date: '2026-08-16', window: '1h', market: 'ETH', side: 'up', pnlUsdso: 760 },
			{ date: '2026-08-12', window: '15m', market: 'BTC', side: 'up', pnlUsdso: 95 }
		]
	}
];

export function heroById(id: string): Hero | undefined {
	return heroes.find((hero) => hero.id === id);
}
