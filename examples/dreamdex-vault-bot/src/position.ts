/** Holdings in one market, split by leg. Adapted from dreamdex-bot-kit ec-oracle-follow. */
export interface Held {
	yes: number;
	no: number;
}

export type Leg = 'yes' | 'no';

export const netOf = (h: Held): number => Math.abs(h.yes - h.no);

export const grossOf = (h: Held): number => h.yes + h.no;

export class Positions {
	private readonly held = new Map<string, Held>();

	in(symbol: string): Held {
		return this.held.get(symbol) ?? { yes: 0, no: 0 };
	}

	opposing(symbol: string, leg: Leg): number {
		const h = this.in(symbol);
		return leg === 'yes' ? h.no : h.yes;
	}

	set(symbol: string, h: Held): void {
		this.held.set(symbol, h);
	}

	add(symbol: string, leg: Leg, shares: number): void {
		if (!(shares > 0)) return;
		const h = this.in(symbol);
		this.held.set(symbol, {
			yes: h.yes + (leg === 'yes' ? shares : 0),
			no: h.no + (leg === 'no' ? shares : 0)
		});
	}

	clear(symbol: string): void {
		this.held.delete(symbol);
	}

	/** Drop markets that are no longer in the live tradable set (resolved, filtered, expired). */
	retain(keys: Iterable<string>): void {
		const keep = new Set([...keys].map((k) => k.toLowerCase()));
		for (const key of [...this.held.keys()]) {
			if (!keep.has(key.toLowerCase())) this.held.delete(key);
		}
	}

	net(symbol: string): number {
		return netOf(this.in(symbol));
	}

	totalNet(): number {
		let n = 0;
		for (const h of this.held.values()) n += netOf(h);
		return n;
	}

	totalGross(): number {
		let n = 0;
		for (const h of this.held.values()) n += grossOf(h);
		return n;
	}
}
