<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import Masthead from '$lib/landing/Masthead.svelte';
	import ConnectGate from '$lib/landing/ConnectGate.svelte';
	import { purseFull } from '$lib/landing/heroes';
	import { loadEnteredHero } from '$lib/landing/entered';
	import {
		applyDeposit,
		applyWithdraw,
		bookHoldings,
		bookTotals,
		loadBook,
		saveBook,
		type BookEntry,
		type Holding
	} from '$lib/landing/book';
	import { wallet } from '$lib/wallet/session.svelte';
	import { untrack } from 'svelte';
	import '../form.css';

	type RoleFilter = 'all' | 'backed' | 'mine';

	const initialEntered = loadEnteredHero();
	let entered = $state(initialEntered);
	let entries = $state<BookEntry[]>(loadBook(initialEntered));
	let amountRaw = $state('0.00');
	let slipMode = $state<'deposit' | 'withdraw'>('deposit');
	let settleIntent = $state<'deposit' | 'withdraw' | null>(null);
	let roleFilter = $state<RoleFilter>('all');
	const selectedId = $derived(page.url.searchParams.get('horse'));

	const holdings = $derived(bookHoldings(entries, entered));
	const totals = $derived(bookTotals(holdings));
	const filtered = $derived(
		holdings.filter((holding) => {
			if (roleFilter === 'backed') return holding.backed;
			if (roleFilter === 'mine') return holding.mine;
			return true;
		})
	);
	const selected = $derived(holdings.find((holding) => holding.hero.id === selectedId) ?? null);
	const amount = $derived(Number.parseFloat(amountRaw) || 0);
	const canDeposit = $derived(
		Boolean(selected?.backed && selected.hero.status === 'active' && !purseFull(selected.hero))
	);
	const canWithdraw = $derived(Boolean(selected?.backed && selected.navUsdso > 0));
	const depositReady = $derived(canDeposit && amount > 0);
	const withdrawReady = $derived(
		Boolean(canWithdraw && amount > 0 && selected && amount <= selected.navUsdso + 1e-9)
	);
	const estShares = $derived.by(() => {
		if (!selected?.backed || selected.hero.vaultUsdso <= 0) return 0;
		if (slipMode === 'withdraw') {
			const nav = selected.navUsdso;
			if (nav <= 0) return 0;
			const take = Math.min(amount, nav);
			const remainCap = Math.max(0, selected.capitalUsdso - take * (selected.capitalUsdso / nav));
			return (remainCap / selected.hero.vaultUsdso) * 100;
		}
		return ((selected.capitalUsdso + amount) / selected.hero.vaultUsdso) * 100;
	});

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

	function shares(value: number) {
		return `${value.toLocaleString(getLocale() === 'id' ? 'id-ID' : 'en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}%`;
	}

	function bookHref(id: string | null) {
		const path = resolve(localizeHref('/portfolio') as Pathname);
		return id ? `${path}?horse=${id}` : path;
	}

	function openHolding(holding: Holding) {
		amountRaw = '0.00';
		slipMode = 'deposit';
		settleIntent = null;
		void goto(bookHref(holding.hero.id), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function closeHolding() {
		amountRaw = '0.00';
		slipMode = 'deposit';
		settleIntent = null;
		void goto(bookHref(null), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function setFilter(next: RoleFilter) {
		roleFilter = roleFilter === next ? 'all' : next;
	}

	function setSlipMode(next: 'deposit' | 'withdraw') {
		slipMode = next;
		settleIntent = null;
		if (next === 'withdraw' && selected && amount > selected.navUsdso) {
			amountRaw = selected.navUsdso.toFixed(2);
		}
	}

	function addAmount(delta: number) {
		let next = amount + delta;
		if (slipMode === 'withdraw' && selected) {
			next = Math.min(next, selected.navUsdso);
		}
		amountRaw = next.toFixed(2);
		settleIntent = null;
	}

	function fillNav() {
		if (!selected) return;
		amountRaw = selected.navUsdso.toFixed(2);
		settleIntent = null;
	}

	function completeSettle() {
		if (!selected || !settleIntent) return;
		if (settleIntent === 'deposit' && !depositReady) return;
		if (settleIntent === 'withdraw' && !withdrawReady) return;
		const next =
			settleIntent === 'deposit'
				? applyDeposit(entries, selected.hero.id, amount)
				: applyWithdraw(entries, selected.hero.id, amount);
		entries = next;
		saveBook(next);
		amountRaw = '0.00';
		settleIntent = null;
	}

	function onSettle(event: SubmitEvent) {
		event.preventDefault();
		if (!selected || amount <= 0) return;
		if (slipMode === 'deposit' && !depositReady) return;
		if (slipMode === 'withdraw' && !withdrawReady) return;
		settleIntent = slipMode;
		if (!wallet.connected) return;
		completeSettle();
	}

	$effect(() => {
		if (!wallet.connected) return;
		untrack(() => {
			const nextEntered = loadEnteredHero();
			entered = nextEntered;
			entries = loadBook(nextEntered);
		});
	});

	$effect(() => {
		if (!wallet.connected || !settleIntent) return;
		completeSettle();
	});

	function onKey(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !selected) return;
		if (event.target instanceof Element && event.target.closest('.account')) return;
		event.preventDefault();
		closeHolding();
	}
</script>

<svelte:head>
	<title>{m.book_page_title()}</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

{@html `<!--
THESIS: The book is a tote of horses you already hold; money moves on the Hot Sheet, not the row. Refuses a DeFi dashboard of position cards.
OWN-WORLD: Warm newsprint, extra-condensed athletic gothic, 3px ink rules, silks squares, invert chips, ruled ink fill bar, green Deposit stamp, outlined Withdraw.
STORY: Read book PnL and capital at risk, open a backed horse, stamp more or redeem shares. Owners watch vault PnL and cannot pull depositor funds.
FIRST VIEWPORT: Masthead with a single-line nav. One bar: boxed YOUR BOOK, chips, inline PnL and capital at risk. Full-bleed tote with a capped name column. Overlay from the right: call-scale name, shares, PnL, DEPOSIT/WITHDRAW chips, amount, then stamp or outlined withdraw.
FORM: Book tote (grounded #2 of 7, seed 3226b2e6).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`}

<div class="sheet tote-sheet">
	<div class="tote-face book-face">
		<Masthead showBook={false} />

		<div class="book-bar">
			<h1 class="book-title">{m.the_book()}</h1>
			<span class="book-rule" aria-hidden="true"></span>
			{#if wallet.connected}
				<dl class="book-figures">
					<div>
						<dt>{m.book_pnl()}</dt>
						<dd class="pnl" class:loss={totals.pnl < 0}>{money(totals.pnl)}</dd>
					</div>
					<div>
						<dt>{m.capital_at_risk()}</dt>
						<dd class="book-risk">{purse(totals.atRisk)}</dd>
					</div>
					<span class="tag">{m.synthetic()}</span>
				</dl>
			{/if}
			<div class="conditions" role="toolbar" aria-label={m.the_book()}>
				<button
					type="button"
					aria-pressed={roleFilter === 'backed'}
					onclick={() => setFilter('backed')}>{m.role_backed()}</button
				>
				<button type="button" aria-pressed={roleFilter === 'mine'} onclick={() => setFilter('mine')}
					>{m.role_mine()}</button
				>
				<button type="button" aria-pressed={roleFilter === 'all'} onclick={() => setFilter('all')}
					>{m.role_all()}</button
				>
			</div>
		</div>

		<div class="tote-stage">
			{#if !wallet.ready}
				<div class="book-gate" aria-busy="true"></div>
			{:else if !wallet.connected}
				<div class="book-gate">
					<p>{m.connect_to_read()}</p>
					<ConnectGate />
				</div>
			{:else}
				<div class="tote book-tote">
					<div class="tote-head">
						<span>{m.col_no()}</span>
						<span>{m.silks()}</span>
						<span>{m.col_name()}</span>
						<span>{m.col_role()}</span>
						<span>{m.col_shares()}</span>
						<span>{m.col_pnl()}</span>
						<span>{m.col_capital()}</span>
					</div>
					{#if filtered.length}
						{#each filtered as holding (holding.hero.id)}
							<button
								class="tote-row"
								type="button"
								aria-pressed={selected?.hero.id === holding.hero.id}
								aria-label={m.open_horse({ name: holding.hero.name })}
								onclick={() => openHolding(holding)}
							>
								<span class="tote-num">{holding.hero.program}</span>
								<span class="silks {holding.hero.market.toLowerCase()}">{holding.hero.market}</span>
								<span class="tote-id">
									<span class="tote-name">{holding.hero.name}</span>
									<span class="pedigree">
										{holding.hero.strategy
											? holding.hero.strategy
											: m.pedigree({ window: holding.hero.window, market: holding.hero.market })}
									</span>
								</span>
								<span class="book-roles">
									{#if holding.backed}
										<span class="status-tag">{m.role_backed()}</span>
									{/if}
									{#if holding.mine}
										<span class="status-tag scratched">{m.role_mine()}</span>
									{/if}
								</span>
								<span class="book-shares">{holding.backed ? shares(holding.sharesPct) : '—'}</span>
								<span class="pnl" class:loss={holding.pnlUsdso < 0}>{money(holding.pnlUsdso)}</span>
								<span class="tote-purse">
									<span>{holding.backed ? purse(holding.capitalUsdso) : '—'}</span>
									<span class="tvl-track" aria-hidden="true">
										<i style="width: {holding.capitalFill}%"></i>
									</span>
									<span class="tvl-max">{m.purse_max({ max: purse(holding.hero.vaultUsdso) })}</span
									>
								</span>
							</button>
						{/each}
					{:else if roleFilter === 'backed'}
						<p class="tote-empty">
							{m.book_empty_backed()}
							<a href={resolve(localizeHref('/program') as Pathname)}>{m.the_program()}</a>
						</p>
					{:else if roleFilter === 'mine'}
						<p class="tote-empty">
							{m.book_empty_mine()}
							<a href={resolve(localizeHref('/enter') as Pathname)}>{m.enter_horse()}</a>
						</p>
					{:else}
						<p class="tote-empty">{m.book_empty()}</p>
					{/if}
				</div>
			{/if}

			{#if wallet.connected && selected}
				<aside
					class="sheet-overlay {selected.hero.market.toLowerCase()}"
					aria-labelledby="book-overlay-name"
				>
					<button class="close-overlay" type="button" onclick={closeHolding}>
						{m.close_book_overlay()}
					</button>
					<div class="overlay-call">
						<div class="call-num overlay-num">{selected.hero.program}</div>
						<div class="silks {selected.hero.market.toLowerCase()}">{selected.hero.market}</div>
						<div>
							<h2 class="overlay-name" id="book-overlay-name" tabindex="-1">
								{selected.hero.name}
							</h2>
							<p class="pedigree">
								{selected.hero.strategy
									? selected.hero.strategy
									: m.pedigree({ window: selected.hero.window, market: selected.hero.market })}
							</p>
						</div>
					</div>
					<dl class="overlay-tvl book-overlay-stats">
						<div>
							<dt>{m.your_shares()} <span class="tag">{m.synthetic()}</span></dt>
							<dd>{selected.backed ? shares(selected.sharesPct) : '—'}</dd>
						</div>
						<div>
							<dt>{m.your_pnl()} <span class="tag">{m.synthetic()}</span></dt>
							<dd class="pnl" class:loss={selected.pnlUsdso < 0}>{money(selected.pnlUsdso)}</dd>
						</div>
					</dl>
					{#if selected.mine && !selected.backed}
						<p class="slip-note overlay-foot">{m.watch_only_note()}</p>
					{:else if selected.hero.status === 'scratched'}
						<p class="slip-note overlay-foot">{m.scratched_note()}</p>
					{:else if selected.backed}
						<div class="overlay-foot">
							<form class="overlay-slip" onsubmit={onSettle}>
								<div class="chips slip-mode" role="radiogroup" aria-label={m.settle_direction()}>
									<button
										type="button"
										role="radio"
										aria-checked={slipMode === 'deposit'}
										onclick={() => setSlipMode('deposit')}>{m.deposit()}</button
									>
									<button
										type="button"
										role="radio"
										aria-checked={slipMode === 'withdraw'}
										onclick={() => setSlipMode('withdraw')}>{m.withdraw()}</button
									>
								</div>
								<div class="amount">
									<label for="book-amount"
										>{slipMode === 'withdraw'
											? m.amount_redeem_label()
											: m.amount_lock_label()}</label
									>
									<input
										id="book-amount"
										name="amount"
										type="number"
										min="0"
										max={slipMode === 'withdraw' ? selected.navUsdso : undefined}
										step="0.01"
										inputmode="decimal"
										autocomplete="off"
										bind:value={amountRaw}
										oninput={() => (settleIntent = null)}
									/>
								</div>
								{#if slipMode === 'withdraw'}
									<p class="form-note">
										{m.nav_available({ nav: purse(selected.navUsdso) })}
										<span class="tag">{m.synthetic()}</span>
									</p>
								{/if}
								<div class="chips">
									<button type="button" onclick={() => addAmount(10)}>{m.add_ten()}</button>
									<button type="button" onclick={() => addAmount(50)}>{m.add_fifty()}</button>
									<button type="button" onclick={() => addAmount(100)}>{m.add_hundred()}</button>
									<button type="button" onclick={() => addAmount(250)}>{m.add_two_fifty()}</button>
									{#if slipMode === 'withdraw'}
										<button type="button" onclick={fillNav}>{m.redeem_all()}</button>
									{/if}
								</div>
								<dl class="strip-preview">
									<dt>
										{slipMode === 'withdraw' ? m.est_shares_remaining() : m.est_shares_after_lock()}
										<span class="tag">{m.synthetic()}</span>
									</dt>
									<dd>{shares(estShares)}</dd>
								</dl>
								<div class="book-actions">
									{#if slipMode === 'deposit'}
										<button class="stamp" type="submit" disabled={!depositReady}>
											<img src="/landing/deposit-stamp.webp" alt="" />
											<span class="sr-only">{m.deposit()} — {m.deposit_lock()}</span>
										</button>
									{:else}
										<button class="withdraw" type="submit" disabled={!withdrawReady}>
											{m.withdraw()}
											<small>{m.withdraw_lock()}</small>
										</button>
									{/if}
								</div>
							</form>
							{#if amount <= 0}
								<p class="slip-note">
									{slipMode === 'withdraw' ? m.need_amount_redeem() : m.need_amount_lock()}
								</p>
							{:else if slipMode === 'withdraw' && amount > selected.navUsdso + 1e-9}
								<p class="slip-note">{m.need_shares()}</p>
							{:else if settleIntent && !wallet.connected}
								<p class="wallet-msg">
									{settleIntent === 'withdraw' ? m.connect_to_sign_withdraw() : m.connect_to_sign()}
								</p>
								<ConnectGate />
							{:else if slipMode === 'deposit' && purseFull(selected.hero)}
								<p class="slip-note">{m.purse_full_note()}</p>
							{:else}
								<p class="slip-note">
									{slipMode === 'withdraw' ? m.redeem_wallet_note() : m.deposit_wallet_note()}
								</p>
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
