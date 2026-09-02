<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import Masthead from '$lib/landing/Masthead.svelte';
	import ConnectGate from '$lib/landing/ConnectGate.svelte';
	import {
		heroes,
		heroById,
		heroAgeDays,
		heroPnl,
		purseFill,
		purseFull,
		type Hero
	} from '$lib/landing/heroes';
	import { loadEnteredHero } from '$lib/landing/entered';
	import { wallet } from '$lib/wallet/session.svelte';
	import '../form.css';

	type StatusFilter = 'all' | 'active' | 'inactive';
	type SortKey = 'age' | 'created' | 'pnl' | 'tvl';

	let entered = $state(loadEnteredHero());
	let amountRaw = $state('0.00');
	let depositIntent = $state(false);
	let statusFilter = $state<StatusFilter>('all');
	let sortKey = $state<SortKey | null>(null);
	let sortDir = $state<'asc' | 'desc'>('desc');
	let selectedId = $state<string | null>(page.url.searchParams.get('horse'));

	const roster = $derived(
		entered ? [entered, ...heroes.filter((hero) => hero.id !== entered?.id)] : heroes
	);
	const selected = $derived(
		selectedId
			? (roster.find((hero) => hero.id === selectedId) ?? heroById(selectedId) ?? null)
			: null
	);

	$effect(() => {
		selectedId = page.url.searchParams.get('horse');
	});

	const filtered = $derived.by(() => {
		let list = roster.filter((hero) => {
			if (statusFilter === 'active') return hero.status === 'active';
			if (statusFilter === 'inactive') return hero.status === 'scratched';
			return true;
		});
		if (sortKey) {
			const dir = sortDir === 'asc' ? 1 : -1;
			list = [...list].sort((a, b) => {
				const cmp =
					sortKey === 'age'
						? heroAgeDays(a) - heroAgeDays(b)
						: sortKey === 'created'
							? a.created.localeCompare(b.created)
							: sortKey === 'pnl'
								? heroPnl(a) - heroPnl(b)
								: a.vaultUsdso - b.vaultUsdso;
				return cmp === 0 ? a.program - b.program : cmp * dir;
			});
		} else {
			list = [...list].sort((a, b) => a.program - b.program);
		}
		return list;
	});

	const amount = $derived(Number.parseFloat(amountRaw) || 0);
	const canDeposit = $derived(
		Boolean(selected) && selected?.status === 'active' && selected && !purseFull(selected)
	);

	function money(value: number, locale = getLocale()) {
		const sign = value > 0 ? '+' : '';
		return `${sign}${value.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}`;
	}

	function purse(value: number, locale = getLocale()) {
		return value.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function fightDate(iso: string) {
		const [y, mo, d] = iso.split('-');
		return `${mo}-${d}-${y.slice(2)}`;
	}

	function createdDate(iso: string) {
		return fightDate(iso);
	}

	function shorten(address: string) {
		if (address.length < 12) return address;
		return `${address.slice(0, 4)}…${address.slice(-4)}`;
	}

	function relWhen(iso: string) {
		const ms = Date.now() - Date.parse(iso);
		if (!Number.isFinite(ms) || ms < 0) return m.when_minutes({ n: 0 });
		const minutes = Math.floor(ms / 60_000);
		if (minutes < 60) return m.when_minutes({ n: minutes });
		const hours = Math.floor(minutes / 60);
		if (hours < 48) return m.when_hours({ n: hours });
		return m.when_days({ n: Math.floor(hours / 24) });
	}

	function programHref(id: string | null) {
		const path = resolve(localizeHref('/program') as Pathname);
		return id ? `${path}?horse=${id}` : path;
	}

	function openHorse(hero: Hero) {
		amountRaw = '0.00';
		depositIntent = false;
		selectedId = hero.id;
		void goto(programHref(hero.id), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function closeHorse() {
		amountRaw = '0.00';
		depositIntent = false;
		selectedId = null;
		void goto(programHref(null), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function setStatus(next: StatusFilter) {
		statusFilter = statusFilter === next ? 'all' : next;
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'desc' ? 'asc' : 'desc';
		} else {
			sortKey = key;
			sortDir =
				key === 'created' || key === 'age' || key === 'pnl' || key === 'tvl' ? 'desc' : 'asc';
		}
	}

	function addAmount(delta: number) {
		amountRaw = (amount + delta).toFixed(2);
		depositIntent = false;
	}

	function onDeposit(event: SubmitEvent) {
		event.preventDefault();
		if (!canDeposit || amount <= 0) return;
		depositIntent = true;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && selected) {
			event.preventDefault();
			closeHorse();
		}
	}
</script>

<svelte:head>
	<title>{m.program_page_title()}</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

{@html `<!--
THESIS: The field is a tote — columns are the filters, a horse opens as a side Hot Sheet. Refuses a DeFi dashboard of cards and a second horse route.
OWN-WORLD: Warm newsprint, extra-condensed athletic gothic, 3px ink rules, silks squares, invert chips, ruled ink fill bar, green Deposit stamp.
STORY: Scan every horse, open one, stamp a deposit. Homepage keeps the Call for the in-form few.
FIRST VIEWPORT: Masthead MARKETO + The program (here) + Enter a horse. Conditions chips. Full-bleed tote. Overlay from the right: call-scale name, PP, purse fill-to-max, last backer, stamp.
FORM: Tote overlay (grounded #4 of 7, seed 951c01df).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`}

<div class="sheet tote-sheet">
	<div class="tote-face">
		<Masthead showProgram={false} />

		<div class="conditions" role="toolbar" aria-label={m.the_program()}>
			<button
				type="button"
				aria-pressed={statusFilter === 'active'}
				onclick={() => setStatus('active')}>{m.conditions_active()}</button
			>
			<button
				type="button"
				aria-pressed={statusFilter === 'inactive'}
				onclick={() => setStatus('inactive')}>{m.conditions_inactive()}</button
			>
			<span class="conditions-rule" aria-hidden="true"></span>
			<button
				type="button"
				aria-pressed={sortKey === 'age'}
				aria-label={m.sort_by({ column: m.col_age() })}
				onclick={() => toggleSort('age')}>{m.col_age()}</button
			>
			<button
				type="button"
				aria-pressed={sortKey === 'created'}
				aria-label={m.sort_by({ column: m.col_created() })}
				onclick={() => toggleSort('created')}>{m.col_created()}</button
			>
			<button
				type="button"
				aria-pressed={sortKey === 'pnl'}
				aria-label={m.sort_by({ column: m.col_pnl() })}
				onclick={() => toggleSort('pnl')}>{m.col_pnl()}</button
			>
			<button
				type="button"
				aria-pressed={sortKey === 'tvl'}
				aria-label={m.sort_by({ column: m.col_purse() })}
				onclick={() => toggleSort('tvl')}>{m.col_purse()}</button
			>
		</div>

		<div class="tote-stage">
			<div class="tote">
				<div class="tote-head">
					<span>{m.col_no()}</span>
					<span>{m.silks()}</span>
					<span>{m.col_name()}</span>
					<span>{m.col_age()}</span>
					<span>{m.col_created()}</span>
					<span>{m.col_pnl()} <span class="tag">{m.synthetic()}</span></span>
					<span>{m.col_purse()} <span class="tag">{m.synthetic()}</span></span>
					<span>{m.col_status()}</span>
				</div>
				{#if filtered.length}
					{#each filtered as hero (hero.id)}
						<button
							class="tote-row"
							type="button"
							aria-pressed={selected?.id === hero.id}
							aria-label={m.open_horse({ name: hero.name })}
							onclick={() => openHorse(hero)}
						>
							<span class="tote-num">{hero.program}</span>
							<span class="silks {hero.market.toLowerCase()}">{hero.market}</span>
							<span class="tote-id">
								<span class="tote-name">{hero.name}</span>
								<span class="pedigree">
									{hero.strategy
										? hero.strategy
										: m.pedigree({ window: hero.window, market: hero.market })}
								</span>
							</span>
							<span class="tote-age">{m.age_days({ days: heroAgeDays(hero) })}</span>
							<span>{createdDate(hero.created)}</span>
							<span class="pnl" class:loss={heroPnl(hero) < 0}>{money(heroPnl(hero))}</span>
							<span class="tote-purse">
								<span>{purse(hero.vaultUsdso)}</span>
								<span class="tvl-track" aria-hidden="true">
									<i style="width: {purseFill(hero)}%"></i>
								</span>
								<span class="tvl-max">{m.purse_max({ max: purse(hero.vaultMaxUsdso) })}</span>
							</span>
							<span class="status-tag" class:scratched={hero.status === 'scratched'}>
								{hero.status === 'scratched' ? m.status_scratched() : m.status_active()}
							</span>
						</button>
					{/each}
				{:else}
					<p class="tote-empty">{m.no_horses_match()}</p>
				{/if}
			</div>

			{#if selected}
				<aside class="sheet-overlay {selected.market.toLowerCase()}" aria-labelledby="overlay-name">
					<button class="close-overlay" type="button" onclick={closeHorse}>
						{m.close_overlay()}
					</button>
					<div class="overlay-call">
						<div class="call-num overlay-num">{selected.program}</div>
						<div class="silks {selected.market.toLowerCase()}">{selected.market}</div>
						<div>
							<h1 class="overlay-name" id="overlay-name" tabindex="-1">{selected.name}</h1>
							<p class="pedigree">
								{selected.strategy
									? selected.strategy
									: m.pedigree({ window: selected.window, market: selected.market })}
							</p>
						</div>
					</div>
					<div class="pp">
						<div class="pp-head">
							<span>{m.past_performances()}</span>
							<span class="tag">{m.synthetic()}</span>
						</div>
						{#if selected.fights.length}
							{#each selected.fights as fight (fight.date + fight.market)}
								<div class="pp-row overlay-pp">
									<span>{fightDate(fight.date)}</span>
									<span>{fight.window}</span>
									<span class="vs {fight.market.toLowerCase()}"
										>{m.vs_market({ market: fight.market })}</span
									>
									<span>{fight.side === 'up' ? m.side_up() : m.side_down()}</span>
									<span class="pnl" class:loss={fight.pnlUsdso < 0}>{money(fight.pnlUsdso)}</span>
								</div>
							{/each}
						{:else}
							<p class="mini-empty">{m.no_fights_yet()}</p>
						{/if}
					</div>
					<dl class="overlay-tvl">
						<dt>{m.vault_purse()} <span class="tag">{m.synthetic()}</span></dt>
						<dd class="pnl" class:loss={false}>{purse(selected.vaultUsdso)}</dd>
						<dd class="tvl-track overlay-track" aria-hidden="true">
							<i style="width: {purseFill(selected)}%"></i>
						</dd>
						<dd class="tvl-max">{m.purse_max({ max: purse(selected.vaultMaxUsdso) })}</dd>
					</dl>
					<div class="last-backer">
						<div class="pp-head">
							<span>{m.last_backer()}</span>
							<span class="tag">{m.synthetic()}</span>
						</div>
						{#if selected.lastBacker}
							<p>
								{m.last_backer_line({
									kind:
										selected.lastBacker.kind === 'deposit'
											? m.backer_deposit()
											: m.backer_withdraw(),
									amount: purse(selected.lastBacker.amountUsdso),
									address: shorten(selected.lastBacker.address),
									when: relWhen(selected.lastBacker.at)
								})}
							</p>
						{:else}
							<p class="mini-empty">{m.no_backers_yet()}</p>
						{/if}
					</div>
					{#if selected.status === 'scratched'}
						<p class="slip-note overlay-foot">{m.scratched_note()}</p>
					{:else if purseFull(selected)}
						<p class="slip-note overlay-foot">{m.purse_full_note()}</p>
					{:else}
						<div class="overlay-foot">
							<form class="overlay-slip" onsubmit={onDeposit}>
								<div class="amount">
									<label for="program-amount">{m.amount_label()}</label>
									<input
										id="program-amount"
										name="amount"
										type="number"
										min="0"
										step="0.01"
										inputmode="decimal"
										autocomplete="off"
										bind:value={amountRaw}
										oninput={() => (depositIntent = false)}
									/>
								</div>
								<div class="chips">
									<button type="button" onclick={() => addAmount(10)}>{m.add_ten()}</button>
									<button type="button" onclick={() => addAmount(50)}>{m.add_fifty()}</button>
									<button type="button" onclick={() => addAmount(100)}>{m.add_hundred()}</button>
									<button type="button" onclick={() => addAmount(250)}>{m.add_two_fifty()}</button>
								</div>
								<button class="stamp" type="submit">
									<img src="/landing/deposit-stamp.webp" alt="" />
									<span class="sr-only">{m.deposit()} — {m.deposit_lock()}</span>
								</button>
							</form>
							{#if amount <= 0}
								<p class="slip-note">{m.need_amount()}</p>
							{:else if depositIntent && !wallet.connected}
								<p class="wallet-msg">{m.connect_to_sign()}</p>
								<ConnectGate />
							{:else if wallet.connected}
								<p class="wallet-msg">{m.wallet_ready()}</p>
							{:else}
								<p class="slip-note">{m.deposit_wallet_note()}</p>
							{/if}
						</div>
					{/if}
				</aside>
			{/if}
		</div>
	</div>
</div>

<div class="alts">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
