<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import Masthead from '$lib/landing/Masthead.svelte';
	import ConnectGate from '$lib/landing/ConnectGate.svelte';
	import DepositStatus from '$lib/landing/DepositStatus.svelte';
	import WithdrawStatus from '$lib/landing/WithdrawStatus.svelte';
	import { purseFull, heroVaultAddress } from '$lib/landing/heroes';
	import { loadEnteredHero } from '$lib/landing/entered';
	import {
		applyWithdraw,
		bookHoldings,
		bookTotals,
		liveBookEntries,
		loadBook,
		saveBook,
		type BookEntry,
		type Holding
	} from '$lib/landing/book';
	import { stampDeposit, type DepositPhase } from '$lib/chain/depositFlow';
	import { stampWithdraw, type WithdrawPhase } from '$lib/chain/withdrawFlow';
	import { readMaxWithdraw } from '$lib/chain/withdrawVault';
	import { wallet } from '$lib/wallet/session.svelte';
	import { untrack } from 'svelte';
	import { formatUnits, getAddress } from 'viem';
	import VaultAddress from '$lib/landing/VaultAddress.svelte';
	import '../form.css';

	type RoleFilter = 'all' | 'backed' | 'mine';

	let { data } = $props();

	const initialEntered = loadEnteredHero();
	let entered = $state(initialEntered);
	let storedEntries = $state<BookEntry[]>(loadBook(initialEntered));
	let amountRaw = $state('0.00');
	let slipMode = $state<'deposit' | 'withdraw'>('deposit');
	let settleIntent = $state<'deposit' | 'withdraw' | null>(null);
	let roleFilter = $state<RoleFilter>('all');
	let depositPhase = $state<DepositPhase>('idle');
	let withdrawPhase = $state<WithdrawPhase>('idle');
	let rejectedApprove = $state(false);
	let maxWithdrawRaw = $state<bigint | null>(null);
	const selectedId = $derived(page.url.searchParams.get('horse'));
	const extras = $derived(entered ? [...data.horses, entered] : data.horses);
	const liveEntries = $derived(
		wallet.address
			? liveBookEntries(data.horses, data.deposits, data.withdrawals, wallet.address, data.decimals)
			: []
	);
	const entries = $derived(liveEntries);
	const holdings = $derived(bookHoldings(entries, extras));
	const totals = $derived(bookTotals(holdings));
	const filtered = $derived(
		holdings.filter((holding) => {
			if (roleFilter === 'backed') return holding.backed;
			if (roleFilter === 'mine') return holding.mine;
			return true;
		})
	);
	const selected = $derived(holdings.find((holding) => holding.hero.id === selectedId) ?? null);
	const selectedVault = $derived(selected ? heroVaultAddress(selected.hero) : null);
	const amount = $derived(Number.parseFloat(amountRaw) || 0);
	const busy = $derived(
		depositPhase === 'approving' || depositPhase === 'pending' || withdrawPhase === 'pending'
	);
	const liveSelected = $derived(Boolean(selected?.hero.live));
	const liveRedeemable = $derived(
		Boolean(liveSelected && maxWithdrawRaw !== null && maxWithdrawRaw > 0n)
	);
	const redeemableUsdso = $derived.by(() => {
		if (!selected) return 0;
		if (selected.hero.live) {
			if (maxWithdrawRaw === null || maxWithdrawRaw <= 0n) return 0;
			return Number.parseFloat(formatUnits(maxWithdrawRaw, data.decimals)) || 0;
		}
		return selected.navUsdso;
	});
	const canDeposit = $derived(
		Boolean(selected?.backed && selected.hero.status === 'active' && !purseFull(selected.hero))
	);
	const canWithdraw = $derived(
		liveSelected
			? liveRedeemable
			: Boolean(selected?.backed && selected.navUsdso > 0 && !selected.hero.live)
	);
	const showSettle = $derived(Boolean(selected?.backed || liveRedeemable));
	const activeSlip = $derived(
		selected && !selected.backed && liveRedeemable ? 'withdraw' : slipMode
	);
	const depositReady = $derived(canDeposit && amount > 0);
	const withdrawReady = $derived(Boolean(canWithdraw && amount > 0));
	const estShares = $derived.by(() => {
		if (!selected || selected.hero.vaultUsdso <= 0) return 0;
		if (activeSlip === 'withdraw') {
			const nav = redeemableUsdso;
			if (nav <= 0) return 0;
			const take = Math.min(amount, nav);
			const remainCap = Math.max(0, selected.capitalUsdso - take * (selected.capitalUsdso / nav));
			return (remainCap / selected.hero.vaultUsdso) * 100;
		}
		if (!selected.backed) return 0;
		return ((selected.capitalUsdso + amount) / selected.hero.vaultUsdso) * 100;
	});

	function resetSlip() {
		amountRaw = '0.00';
		slipMode = 'deposit';
		settleIntent = null;
		depositPhase = 'idle';
		withdrawPhase = 'idle';
		rejectedApprove = false;
	}

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

	function onToteKey(event: KeyboardEvent, holding: Holding) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openHolding(holding);
		}
	}

	function openHolding(holding: Holding) {
		resetSlip();
		if (!holding.backed) slipMode = 'withdraw';
		void goto(bookHref(holding.hero.id), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function closeHolding() {
		resetSlip();
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
		depositPhase = 'idle';
		withdrawPhase = 'idle';
		rejectedApprove = false;
		if (next === 'withdraw' && selected && amount > redeemableUsdso) {
			amountRaw = selected.hero.live
				? maxWithdrawRaw !== null
					? formatUnits(maxWithdrawRaw, data.decimals)
					: redeemableUsdso.toFixed(2)
				: selected.navUsdso.toFixed(2);
		}
	}

	function addAmount(delta: number) {
		let next = amount + delta;
		if (activeSlip === 'withdraw' && selected) {
			next = Math.min(next, redeemableUsdso);
		}
		amountRaw = next.toFixed(2);
		settleIntent = null;
		if (!busy) {
			depositPhase = 'idle';
			withdrawPhase = 'idle';
			rejectedApprove = false;
		}
	}

	function fillNav() {
		if (!selected) return;
		if (selected.hero.live && maxWithdrawRaw !== null) {
			amountRaw = formatUnits(maxWithdrawRaw, data.decimals);
		} else {
			amountRaw = selected.navUsdso.toFixed(2);
		}
		settleIntent = null;
	}

	function completeWithdraw() {
		if (!selected || selected.hero.live || !withdrawReady) return;
		storedEntries = applyWithdraw(storedEntries, selected.hero.id, amount);
		saveBook(storedEntries);
		amountRaw = '0.00';
		settleIntent = null;
	}

	async function onSwitchNetwork() {
		const result = await wallet.switchToProductChain();
		if (result === 'ok') {
			depositPhase = 'idle';
			withdrawPhase = 'idle';
		}
	}

	async function runLiveDeposit() {
		if (!selected?.hero.live || !depositReady || busy) return;
		const result = await stampDeposit({
			live: true,
			vaultAddress: selected.hero.id,
			amountRaw,
			connected: wallet.connected,
			onProductChain: wallet.onProductChain,
			onPhase: (next) => {
				depositPhase = next;
			}
		});
		depositPhase = result.phase;
		rejectedApprove = result.rejectedApprove;
		if (result.phase === 'confirmed') {
			amountRaw = '0.00';
			settleIntent = null;
			await invalidateAll();
		}
	}

	async function runLiveWithdraw() {
		if (!selected?.hero.live || !withdrawReady || busy) return;
		const result = await stampWithdraw({
			live: true,
			vaultAddress: selected.hero.id,
			amountRaw,
			connected: wallet.connected,
			onProductChain: wallet.onProductChain,
			onPhase: (next) => {
				withdrawPhase = next;
			}
		});
		withdrawPhase = result.phase;
		if (result.phase === 'confirmed') {
			amountRaw = '0.00';
			settleIntent = null;
			await invalidateAll();
		}
	}

	async function onSettle(event: SubmitEvent) {
		event.preventDefault();
		if (!selected || amount <= 0 || busy) return;
		if (activeSlip === 'deposit' && !depositReady) return;
		if (activeSlip === 'withdraw' && !withdrawReady) return;
		settleIntent = activeSlip;
		rejectedApprove = false;
		if (activeSlip === 'deposit') {
			if (!selected.hero.live) {
				depositPhase = 'not_live';
				return;
			}
			if (!wallet.connected) {
				depositPhase = 'idle';
				return;
			}
			if (!wallet.onProductChain) {
				depositPhase = 'wrong_network';
				return;
			}
			await runLiveDeposit();
			return;
		}
		if (selected.hero.live) {
			if (!wallet.connected) {
				withdrawPhase = 'idle';
				return;
			}
			if (!wallet.onProductChain) {
				withdrawPhase = 'wrong_network';
				return;
			}
			await runLiveWithdraw();
			return;
		}
		if (!wallet.connected) return;
		completeWithdraw();
	}

	$effect(() => {
		if (!wallet.connected) return;
		untrack(() => {
			const nextEntered = loadEnteredHero();
			entered = nextEntered;
			storedEntries = loadBook(nextEntered);
		});
	});

	$effect(() => {
		if (!wallet.connected || settleIntent !== 'withdraw') return;
		if (selected?.hero.live) return;
		completeWithdraw();
	});

	$effect(() => {
		const live = selected?.hero.live;
		const vault = selected?.hero.id;
		const connected = wallet.connected && wallet.onProductChain && Boolean(wallet.address);
		if (!live || !vault || !connected) {
			maxWithdrawRaw = null;
			return;
		}
		let cancelled = false;
		void readMaxWithdraw(getAddress(vault))
			.then((value) => {
				if (!cancelled) maxWithdrawRaw = value;
			})
			.catch(() => {
				if (!cancelled) maxWithdrawRaw = 0n;
			});
		return () => {
			cancelled = true;
		};
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
OWN-WORLD: Cool lavender sheet, extra-condensed athletic gothic, 3px ink rules, silks squares, invert chips, ruled ink fill bar, mint Deposit stamp, outlined Withdraw.
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
						<span>{m.vault_address()}</span>
						<span>{m.col_role()}</span>
						<span>{m.col_shares()}</span>
						<span>{m.col_pnl()}</span>
						<span>{m.col_capital()}</span>
					</div>
					{#if filtered.length}
						{#each filtered as holding (holding.hero.id)}
							{@const vault = heroVaultAddress(holding.hero)}
							<div
								class="tote-row"
								role="button"
								tabindex="0"
								aria-pressed={selected?.hero.id === holding.hero.id}
								aria-label={m.open_horse({ name: holding.hero.name })}
								onclick={() => openHolding(holding)}
								onkeydown={(event) => onToteKey(event, holding)}
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
								<span class="tote-vault-cell">
									{#if vault}
										<VaultAddress compact address={vault} />
									{:else}
										—
									{/if}
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
							</div>
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
						<div class="overlay-mast">
							<div class="call-num overlay-num">{selected.hero.program}</div>
							<div class="silks {selected.hero.market.toLowerCase()}">{selected.hero.market}</div>
						</div>
						<div class="overlay-id">
							<h2 class="overlay-name" id="book-overlay-name" tabindex="-1">
								{selected.hero.name}
							</h2>
							<p class="pedigree">
								{selected.hero.strategy
									? selected.hero.strategy
									: m.pedigree({ window: selected.hero.window, market: selected.hero.market })}
							</p>
							{#if selectedVault}
								<VaultAddress address={selectedVault} />
							{/if}
						</div>
					</div>
					<dl class="overlay-tvl book-overlay-stats">
						<div>
							<dt>{m.your_shares()}</dt>
							<dd>{selected.backed ? shares(selected.sharesPct) : '—'}</dd>
						</div>
						<div>
							<dt>{m.your_pnl()}</dt>
							<dd class="pnl" class:loss={selected.pnlUsdso < 0}>{money(selected.pnlUsdso)}</dd>
						</div>
					</dl>
					{#if selected.mine && !selected.backed && !liveRedeemable}
						<p class="slip-note overlay-foot">{m.watch_only_note()}</p>
					{:else if selected.hero.status === 'scratched'}
						<p class="slip-note overlay-foot">{m.scratched_note()}</p>
					{:else if showSettle}
						<div class="overlay-foot">
							<form class="overlay-slip" onsubmit={onSettle}>
								{#if canDeposit}
									<div class="chips slip-mode" role="radiogroup" aria-label={m.settle_direction()}>
										<button
											type="button"
											role="radio"
											aria-checked={activeSlip === 'deposit'}
											onclick={() => setSlipMode('deposit')}>{m.deposit()}</button
										>
										<button
											type="button"
											role="radio"
											aria-checked={activeSlip === 'withdraw'}
											onclick={() => setSlipMode('withdraw')}>{m.withdraw()}</button
										>
									</div>
								{/if}
								<div class="amount">
									<label for="book-amount"
										>{activeSlip === 'withdraw'
											? m.amount_redeem_label()
											: m.amount_lock_label()}</label
									>
									<input
										id="book-amount"
										name="amount"
										type="number"
										min="0"
										max={activeSlip === 'withdraw' ? redeemableUsdso : undefined}
										step="0.01"
										inputmode="decimal"
										autocomplete="off"
										bind:value={amountRaw}
										oninput={() => {
											settleIntent = null;
											if (!busy) {
												depositPhase = 'idle';
												withdrawPhase = 'idle';
												rejectedApprove = false;
											}
										}}
									/>
								</div>
								{#if activeSlip === 'withdraw'}
									<p class="form-note">{m.nav_available({ nav: purse(redeemableUsdso) })}</p>
								{/if}
								<div class="chips">
									<button type="button" onclick={() => addAmount(10)}>{m.add_ten()}</button>
									<button type="button" onclick={() => addAmount(50)}>{m.add_fifty()}</button>
									<button type="button" onclick={() => addAmount(100)}>{m.add_hundred()}</button>
									<button type="button" onclick={() => addAmount(250)}>{m.add_two_fifty()}</button>
									{#if activeSlip === 'withdraw'}
										<button type="button" onclick={fillNav}>{m.redeem_all()}</button>
									{/if}
								</div>
								<dl class="strip-preview">
									<dt>
										{activeSlip === 'withdraw'
											? m.est_shares_remaining()
											: m.est_shares_after_lock()}
									</dt>
									<dd>{shares(estShares)}</dd>
								</dl>
								<div class="book-actions">
									{#if activeSlip === 'deposit'}
										<button class="stamp" type="submit" disabled={!depositReady || busy}>
											<img src="/landing/deposit-stamp.webp" alt="" />
											<span class="sr-only">{m.deposit()} — {m.deposit_lock()}</span>
										</button>
									{:else}
										<button class="withdraw" type="submit" disabled={!withdrawReady || busy}>
											{m.withdraw()}
											<small>{m.withdraw_lock()}</small>
										</button>
									{/if}
								</div>
							</form>
							{#if activeSlip === 'deposit'}
								<DepositStatus
									phase={depositPhase}
									{rejectedApprove}
									{amount}
									live={liveSelected}
									connected={wallet.connected}
									onProductChain={wallet.onProductChain}
									intent={settleIntent === 'deposit'}
									{busy}
									onswitch={onSwitchNetwork}
								/>
							{:else}
								<WithdrawStatus
									phase={withdrawPhase}
									{amount}
									live={liveSelected}
									connected={wallet.connected}
									onProductChain={wallet.onProductChain}
									intent={settleIntent === 'withdraw'}
									{busy}
									onswitch={onSwitchNetwork}
								/>
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
