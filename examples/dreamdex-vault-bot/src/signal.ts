/** Oracle-follow signal, adapted from dreamdex-bot-kit (MIT). Vault bot uses SDK reads only. */

import type { ReadExchange } from './discover.ts';

export type Asset = 'BTC' | 'ETH';

export interface Spot {
	price: number;
	at: number;
}

export interface SpotReader {
	getSpot(asset: Asset): Promise<Spot | null>;
}

export function sdkSpotReader(exchange: ReadExchange): SpotReader {
	return {
		async getSpot(asset) {
			const px = await exchange.client.fetchPrice(asset);
			if (!px || !(px.price > 0)) return null;
			return { price: px.price, at: px.blockTimestamp * 1000 };
		}
	};
}

export class SpotHistory {
	private readonly samples = new Map<string, Spot[]>();
	private readonly retainMs: number;

	constructor(
		private readonly windowMs: number,
		private readonly maxAgeMs: number,
		retainMs = windowMs * 2
	) {
		this.retainMs = Math.max(retainMs, windowMs * 2);
	}

	record(asset: string, s: Spot): void {
		const arr = this.samples.get(asset) ?? [];
		if (arr.length > 0 && arr[arr.length - 1]!.at === s.at) return;
		arr.push(s);
		const cutoff = s.at - this.retainMs;
		while (arr.length > 0 && arr[0]!.at < cutoff) arr.shift();
		this.samples.set(asset, arr);
	}

	volatility(asset: string, minSamples = 12): number | null {
		const arr = this.samples.get(asset);
		if (!arr || arr.length < minSamples + 1) return null;
		let sumSq = 0;
		let elapsed = 0;
		let n = 0;
		for (let i = 1; i < arr.length; i++) {
			const a = arr[i - 1]!;
			const b = arr[i]!;
			const dt = b.at - a.at;
			if (dt <= 0 || !(a.price > 0) || !(b.price > 0)) continue;
			const r = Math.log(b.price / a.price);
			sumSq += r * r;
			elapsed += dt;
			n++;
		}
		if (n < minSamples || elapsed <= 0) return null;
		const sigma = Math.sqrt((sumSq / elapsed) * this.windowMs);
		return sigma > 0 ? sigma : null;
	}

	momentum(asset: string, now: number): { spot: number; r: number } | null {
		const arr = this.samples.get(asset);
		if (!arr || arr.length < 2) return null;
		const latest = arr[arr.length - 1]!;
		if (now - latest.at > this.maxAgeMs) return null;
		const target = latest.at - this.windowMs;
		if (arr[0]!.at > target) return null;
		let lag = arr[0]!;
		for (const s of arr) {
			if (s.at <= target) lag = s;
			else break;
		}
		if (!(lag.price > 0)) return null;
		return { spot: latest.price, r: (latest.price - lag.price) / lag.price };
	}
}

const clamp = (p: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, p));
const NORMAL_CDF_K = Math.sqrt(2 / Math.PI);

export interface ModelInput {
	spot: number;
	r: number;
	strike: number | null;
	timeToExpiryMs: number | null;
	windowMs: number;
	expectedMove: number;
	sensitivity: number;
	model: 'strike' | 'momentum';
	anchorUp: number;
}

export interface Estimate {
	pUp: number;
	tilt: number;
	anchored: boolean;
}

export function estimateUp(i: ModelInput): Estimate {
	const PMIN = 0.05;
	const PMAX = 0.95;
	const strikeAware = i.model === 'strike' && i.strike !== null && i.timeToExpiryMs !== null;
	if (!strikeAware) {
		const anchor = clamp(i.anchorUp, PMIN, PMAX);
		const raw = i.sensitivity * i.r;
		const room = raw > 0 ? PMAX - anchor : anchor - PMIN;
		const tilt = Math.sign(raw) * Math.min(Math.abs(raw), Math.max(room, 0));
		return { pUp: anchor + tilt, tilt, anchored: true };
	}
	const horizons = Math.max(i.timeToExpiryMs! / i.windowMs, 0.05);
	const moneyness = (i.spot - i.strike!) / i.strike!;
	const drift = i.r * Math.sqrt(horizons);
	const scale = i.expectedMove * Math.sqrt(horizons);
	if (!(scale > 0)) return { pUp: i.anchorUp, tilt: 0, anchored: false };
	const z = (moneyness + drift) / scale;
	const pUp = clamp(0.5 + 0.5 * Math.tanh(NORMAL_CDF_K * z), PMIN, PMAX);
	return { pUp, tilt: pUp - i.anchorUp, anchored: false };
}

export function marketBoundUp(book: { bids: [number, number][]; asks: [number, number][] }): number | null {
	const p = book.asks[0]?.[0] ?? book.bids[0]?.[0];
	return p !== undefined && p > 0 && p < 1 ? p : null;
}

export function marketImpliedUp(book: { bids: [number, number][]; asks: [number, number][] }): number | null {
	const bid = book.bids[0]?.[0];
	const ask = book.asks[0]?.[0];
	if (bid === undefined || ask === undefined) return null;
	const mid = (bid + ask) / 2;
	return mid > 0 && mid < 1 ? mid : null;
}

export function scaleStrike(rawStrike: string | undefined, spot: number): number | null {
	if (!rawStrike || !(spot > 0)) return null;
	const raw = Number(rawStrike);
	if (!Number.isFinite(raw) || raw <= 0) return null;
	let best: number | null = null;
	let bestErr = Infinity;
	for (let exp = 0; exp <= 18; exp++) {
		const candidate = raw / 10 ** exp;
		const err = Math.abs(Math.log(candidate / spot));
		if (err < bestErr) {
			bestErr = err;
			best = candidate;
		}
	}
	return bestErr <= Math.log(2) ? best : null;
}

export interface Reference {
	price: number;
	kind: 'strike' | 'opening';
}

export interface ReferenceReader {
	referenceFor(m: { marketId?: string; strike?: string }, spot: number): Promise<Reference | null>;
}

export function referenceReader(exchange: ReadExchange): ReferenceReader {
	const openings = new Map<string, string>();
	return {
		async referenceFor(m, spot) {
			const fixed = scaleStrike(m.strike, spot);
			if (fixed !== null) return { price: fixed, kind: 'strike' };
			const id = m.marketId;
			if (!id) return null;
			let raw = openings.get(id);
			if (raw === undefined) {
				const answers = await exchange.client.getOpeningPrices([id]);
				const found = answers[id.toLowerCase()] ?? answers[id] ?? null;
				if (found === null) return null;
				openings.set(id, found);
				raw = found;
			}
			const opening = scaleStrike(raw, spot);
			return opening === null ? null : { price: opening, kind: 'opening' };
		}
	};
}
