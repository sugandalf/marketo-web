<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import Masthead from '$lib/landing/Masthead.svelte';
	import ConnectGate from '$lib/landing/ConnectGate.svelte';
	import { nextProgram, buildEnteredHero, saveEnteredHero } from '$lib/landing/entered';
	import type { Market } from '$lib/landing/heroes';
	import { wallet } from '$lib/wallet/session.svelte';
	import '../form.css';

	const NAME_MAX = 24;
	const STRATEGY_MAX = 120;

	let botName = $state('');
	let botMarket = $state<Market>('BTC');
	let strategy = $state('');
	let walletMode = $state<'same' | 'other'>('same');
	let otherAddress = $state('');
	let amountRaw = $state('0.00');
	let submitted = $state(false);
	let entered = $state(false);
	let enteredId = $state('');

	const amount = $derived(Number.parseFloat(amountRaw) || 0);
	const program = nextProgram();
	const displayName = $derived(botName.trim() ? botName.trim().toUpperCase() : '—');
	const botWallet = $derived(
		walletMode === 'same' ? 'same-as-creator' : otherAddress.trim()
	);

	function purse(value: number) {
		return value.toLocaleString(getLocale() === 'id' ? 'id-ID' : 'en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function addAmount(delta: number) {
		amountRaw = (amount + delta).toFixed(2);
		submitted = false;
	}

	function formError() {
		if (!botName.trim()) return 'name';
		if (!strategy.trim()) return 'strategy';
		if (walletMode === 'other' && !otherAddress.trim()) return 'wallet';
		if (amount <= 0) return 'purse';
		return null;
	}

	function commitHero() {
		if (entered) return;
		const hero = buildEnteredHero({
			name: botName,
			market: botMarket,
			strategy,
			amount,
			botWallet
		});
		saveEnteredHero(hero);
		enteredId = hero.id;
		entered = true;
	}

	function onEnter(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		if (formError()) return;
		if (!wallet.connected) return;
		commitHero();
	}

	$effect(() => {
		if (entered) return;
		if (!submitted || formError() || !wallet.connected) return;
		commitHero();
	});
</script>

{@html `<!--
THESIS: Entering is a two-page condition book — facts left, papers right — not a wizard or a settings form.
OWN-WORLD: Warm newsprint, extra-condensed athletic gothic, 3px ink rules, square-cut underlines, BTC red / ETH blue silks, green Open-vault rubber stamp.
STORY: Become a named horse, open a vault others can back, still sign every transaction, then see the horse on the card.
FIRST VIEWPORT: Masthead MARKETO. Spread: left What entering is (01–03 + miniature call that writes as you type). Right Entry papers (name, silks, strategy, wallet, purse). Stamp Open vault at the foot of the papers.
FORM: Condition-book spread (grounded #5 of 7, seed aa1ff93c).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`}

<svelte:head>
	<title>{m.enter_page_title()}</title>
</svelte:head>

<div class="sheet">
	<div class="card-face enter-face">
		<Masthead showEnter={false} />

		<div class="book">
			<section class="facts" id="what-entering-is">
				<h1>{m.what_entering_is()}</h1>
				<ol class="enter-facts">
					<li><span>01</span> {m.enter_fact_1()}</li>
					<li><span>02</span> {m.enter_fact_2()}</li>
					<li><span>03</span> {m.enter_fact_3()}</li>
				</ol>

				<h2>{m.on_the_card()}</h2>
				<p class="facts-note">{m.card_preview_note()}</p>

				<article class="miniature" aria-live="polite">
					<div class="mini-id">
						<div class="mini-num">
							{program}
							<small>{m.program_no()}</small>
						</div>
						<div class="silks {botMarket.toLowerCase()}">{botMarket}</div>
						<div>
							<p class="mini-name">{displayName}</p>
							<p class="pedigree">
								{strategy.trim() || m.pedigree({ window: '15m', market: botMarket })}
							</p>
						</div>
					</div>
					<div class="mini-pp">
						<div class="pp-head">
							<span>{m.past_performances()}</span>
							<span class="tag">{m.synthetic()}</span>
						</div>
						<p class="mini-empty">{m.no_fights_yet()}</p>
					</div>
					<dl class="mini-purse">
						<dt>{m.vault_purse()} <span class="tag">{m.synthetic()}</span></dt>
						<dd>{purse(amount)}</dd>
					</dl>
				</article>
				<p class="facts-note">{m.results_update()}</p>
			</section>

			<section class="papers">
				{#if entered}
					<div class="receipt">
						<h2>{m.receipt_title()}</h2>
						<div class="receipt-call">
							<div class="silks {botMarket.toLowerCase()}">{botMarket}</div>
							<div>
								<p class="mini-name">{displayName}</p>
								<p class="pedigree">{strategy.trim()}</p>
							</div>
						</div>
						<dl class="mini-purse">
							<dt>{m.vault_purse()} <span class="tag">{m.synthetic()}</span></dt>
							<dd>{purse(amount)}</dd>
						</dl>
						<p class="wallet-msg">{m.receipt_line({ name: displayName })}</p>
						<a
							class="see-card"
							href="{resolve(localizeHref('/') as Pathname)}?horse={enteredId}"
						>
							{m.see_on_card()}
						</a>
					</div>
				{:else}
					<h2>{m.entry_papers()}</h2>
					<form class="papers-form" onsubmit={onEnter}>
						<label class="field">
							{m.horse_name_label()}
							<input
								name="horse"
								type="text"
								maxlength={NAME_MAX}
								placeholder={m.bot_name_placeholder()}
								bind:value={botName}
								oninput={() => (submitted = false)}
							/>
							<span class="count">{m.chars_count({ count: botName.length, max: NAME_MAX })}</span>
						</label>

						<fieldset class="silks-pick">
							<legend>{m.silks_label()}</legend>
							<div class="silks-row" role="radiogroup" aria-label={m.silks_label()}>
								<button
									type="button"
									class="silks btc"
									role="radio"
									aria-checked={botMarket === 'BTC'}
									onclick={() => {
										botMarket = 'BTC';
										submitted = false;
									}}
								>
									BTC
								</button>
								<button
									type="button"
									class="silks eth"
									role="radio"
									aria-checked={botMarket === 'ETH'}
									onclick={() => {
										botMarket = 'ETH';
										submitted = false;
									}}
								>
									ETH
								</button>
							</div>
						</fieldset>

						<label class="field">
							{m.strategy_label()}
							<input
								name="strategy"
								type="text"
								maxlength={STRATEGY_MAX}
								placeholder={m.strategy_placeholder()}
								bind:value={strategy}
								oninput={() => (submitted = false)}
							/>
							<span class="count">{m.chars_count({ count: strategy.length, max: STRATEGY_MAX })}</span>
						</label>

						<fieldset class="wallet-pick">
							<legend>{m.wallet_label()}</legend>
							<div class="chips" role="radiogroup" aria-label={m.wallet_label()}>
								<button
									type="button"
									role="radio"
									aria-checked={walletMode === 'same'}
									onclick={() => {
										walletMode = 'same';
										submitted = false;
									}}
								>
									{m.wallet_same()}
								</button>
								<button
									type="button"
									role="radio"
									aria-checked={walletMode === 'other'}
									onclick={() => {
										walletMode = 'other';
										submitted = false;
									}}
								>
									{m.wallet_other()}
								</button>
							</div>
							<p class="field-note">
								{walletMode === 'same' ? m.wallet_same_note() : m.wallet_other_note()}
							</p>
							{#if walletMode === 'other'}
								<label class="field">
									{m.wallet_address_label()}
									<input
										name="wallet"
										type="text"
										autocomplete="off"
										spellcheck="false"
										placeholder={m.wallet_address_placeholder()}
										bind:value={otherAddress}
										oninput={() => (submitted = false)}
									/>
								</label>
							{/if}
						</fieldset>

						<div class="amount">
							<label for="purse">{m.opening_purse_label()}</label>
							<input
								id="purse"
								name="purse"
								type="number"
								min="0"
								step="0.01"
								inputmode="decimal"
								autocomplete="off"
								bind:value={amountRaw}
								oninput={() => (submitted = false)}
							/>
						</div>
						<div class="chips">
							<button type="button" onclick={() => addAmount(10)}>{m.add_ten()}</button>
							<button type="button" onclick={() => addAmount(50)}>{m.add_fifty()}</button>
							<button type="button" onclick={() => addAmount(100)}>{m.add_hundred()}</button>
							<button type="button" onclick={() => addAmount(250)}>{m.add_two_fifty()}</button>
							<button type="button" onclick={() => addAmount(500)}>{m.add_five_hundred()}</button>
						</div>

						<div class="papers-foot">
							<a class="how-link" href="#what-entering-is">{m.how_it_works()}</a>
							<button class="stamp" type="submit">
								<img src="/landing/open-vault-stamp.webp" alt="" />
								<span class="sr-only">{m.open_vault()} — {m.open_vault_lock()}</span>
							</button>
						</div>
					</form>

					{#if submitted && formError() === 'name'}
						<p class="form-note">{m.need_bot_name()}</p>
					{:else if submitted && formError() === 'strategy'}
						<p class="form-note">{m.need_strategy()}</p>
					{:else if submitted && formError() === 'wallet'}
						<p class="form-note">{m.need_wallet_address()}</p>
					{:else if submitted && formError() === 'purse'}
						<p class="form-note">{m.need_purse()}</p>
					{:else if submitted && !wallet.connected}
						<p class="wallet-msg">{m.connect_to_open()}</p>
						<ConnectGate />
					{:else}
						<p class="form-note">{m.enter_note()}</p>
					{/if}
				{/if}
			</section>
		</div>
	</div>
</div>

<div class="alts">
	<a href={resolve(localizeHref(page.url.pathname, { locale: 'en' }) as Pathname)}>en</a>
	<a href={resolve(localizeHref(page.url.pathname, { locale: 'id' }) as Pathname)}>id</a>
</div>
