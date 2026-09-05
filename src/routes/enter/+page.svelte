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
	import { chainConfig } from '$lib/chain/config';
	import { formatAssetDisplay, formatAssetInput, readAssetPurse } from '$lib/chain/asset';
	import { createBotVault, parsePurse } from '$lib/chain/createVault';
	import { classifyWriteError, type OpenVaultPhase } from '$lib/chain/lifecycle';
	import { persistBot } from '$lib/chain/persist';
	import { HORSE_NAME_MAX, STRATEGY_MAX } from '$lib/chain/botRecord';
	import { shortAddress } from '$lib/wallet/address';
	import VaultAddress from '$lib/landing/VaultAddress.svelte';
	import { getAddress, isAddress } from 'viem';
	import { untrack } from 'svelte';
	import '../form.css';

	const NAME_MAX = HORSE_NAME_MAX;

	let botName = $state('');
	let botMarket = $state<Market>('BTC');
	let strategy = $state('');
	let walletMode = $state<'same' | 'other'>('same');
	let otherAddress = $state('');
	let amountRaw = $state('0.00');
	let submitted = $state(false);
	let entered = $state(false);
	let enteredId = $state('');
	let phase = $state<OpenVaultPhase>('idle');
	let rejectedApprove = $state(false);
	let receiptCreator = $state('');
	let receiptOperator = $state('');
	let assetBalance = $state<bigint | null>(null);
	let assetDecimals = $state<number | null>(null);
	let balanceStatus = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');

	const amount = $derived(Number.parseFloat(amountRaw) || 0);
	const program = nextProgram();
	const displayName = $derived(botName.trim() ? botName.trim().toUpperCase() : '—');
	const busy = $derived(phase === 'approving' || phase === 'pending');
	const canMax = $derived(
		Boolean(
			wallet.onProductChain &&
			assetBalance != null &&
			assetDecimals != null &&
			assetBalance > 0n &&
			!busy
		)
	);
	const balanceLabel = $derived.by(() => {
		if (!wallet.connected || !wallet.onProductChain || !chainConfig.ok) {
			return m.purse_balance_unread();
		}
		if (balanceStatus === 'loading' || balanceStatus === 'idle') {
			return m.purse_balance_loading();
		}
		if (balanceStatus !== 'ready' || assetBalance == null || assetDecimals == null) {
			return m.purse_balance_unread();
		}
		return m.purse_balance({
			amount: formatAssetDisplay(assetBalance, assetDecimals, getLocale())
		});
	});

	function purse(value: number) {
		return value.toLocaleString(getLocale() === 'id' ? 'id-ID' : 'en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function addAmount(delta: number) {
		let next = amount + delta;
		if (assetBalance != null && assetDecimals != null) {
			const cap = Number.parseFloat(formatAssetInput(assetBalance, assetDecimals));
			if (Number.isFinite(cap)) next = Math.min(next, cap);
		}
		amountRaw = next.toFixed(2);
		submitted = false;
		if (!busy) phase = 'idle';
	}

	function setMaxPurse() {
		if (!canMax || assetBalance == null || assetDecimals == null) return;
		amountRaw = formatAssetInput(assetBalance, assetDecimals);
		submitted = false;
		if (!busy) phase = 'idle';
	}

	function formError() {
		if (!botName.trim()) return 'name';
		if (!strategy.trim()) return 'strategy';
		if (walletMode === 'other') {
			const addr = otherAddress.trim();
			if (!addr) return 'wallet';
			if (!isAddress(addr)) return 'operator';
		}
		if (amount <= 0) return 'purse';
		if (assetBalance != null && assetDecimals != null) {
			try {
				if (parsePurse(amountRaw, assetDecimals) > assetBalance) return 'purse_over';
			} catch {
				return 'purse';
			}
		}
		return null;
	}

	async function openVault() {
		if (entered || busy) return;
		if (!wallet.address) return;
		rejectedApprove = false;
		const operator = walletMode === 'same' ? wallet.address : getAddress(otherAddress.trim());
		try {
			const created = await createBotVault({
				name: botName,
				operator,
				purseRaw: amountRaw,
				onPhase: (next) => {
					rejectedApprove = next === 'approving';
					phase = next;
				}
			});
			try {
				await persistBot({
					chainId: created.chainId,
					factoryAddress: created.factory,
					vaultAddress: created.vaultAddress,
					creatorAddress: created.creator,
					operatorAddress: created.operator,
					assetAddress: created.asset,
					name: created.name,
					symbol: created.symbol,
					market: botMarket,
					strategy: strategy.trim(),
					seedAssets: created.seedAssets.toString(),
					performanceFeeBps: created.performanceFeeBps,
					creatorFeeRecipient: created.creatorFeeRecipient,
					txHash: created.txHash
				});
			} catch {
				// Chain confirmed; projection retry is idempotent. Do not un-enter.
			}
			const hero = buildEnteredHero({
				id: created.vaultAddress,
				name: botName,
				market: botMarket,
				strategy,
				amount,
				botWallet: created.operator
			});
			saveEnteredHero(hero);
			enteredId = hero.id;
			receiptCreator = created.creator;
			receiptOperator = created.operator;
			phase = 'confirmed';
			entered = true;
		} catch (error) {
			phase = classifyWriteError(error);
		}
	}

	async function onEnter(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		if (busy) return;
		if (formError()) return;
		if (!chainConfig.ok) return;
		if (!wallet.connected) return;
		if (!wallet.onProductChain) {
			phase = 'wrong_network';
			return;
		}
		await openVault();
	}

	async function onSwitchNetwork() {
		const result = await wallet.switchToProductChain();
		if (result === 'ok') phase = 'idle';
	}

	$effect(() => {
		const owner = wallet.address;
		const ready = Boolean(owner && wallet.onProductChain && chainConfig.ok);
		if (!ready || !owner) {
			untrack(() => {
				assetBalance = null;
				assetDecimals = null;
				balanceStatus = 'idle';
			});
			return;
		}
		let cancelled = false;
		untrack(() => {
			balanceStatus = 'loading';
		});
		void readAssetPurse(owner)
			.then((purse) => {
				if (cancelled) return;
				assetBalance = purse.balance;
				assetDecimals = purse.decimals;
				balanceStatus = 'ready';
			})
			.catch(() => {
				if (cancelled) return;
				assetBalance = null;
				assetDecimals = null;
				balanceStatus = 'error';
			});
		return () => {
			cancelled = true;
		};
	});
</script>

{@html `<!--
THESIS: Entering is a two-page condition book — facts left, papers right — not a wizard or a settings form.
OWN-WORLD: Cool lavender sheet, extra-condensed athletic gothic, 3px ink rules, square-cut underlines, cherry BTC / periwinkle ETH silks, mint Open-vault rubber stamp.
STORY: Become a named horse, open a vault others can back, still sign every transaction, then see the horse on the card.
FIRST VIEWPORT: Masthead MARKETO. Spread: left What entering is (01–03 + miniature call that writes as you type + performance fee). Right Entry papers (name, silks, strategy, wallet, purse). Stamp Open vault at the foot of the papers.
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
						</div>
						<p class="mini-empty">{m.no_fights_yet()}</p>
					</div>
					<dl class="mini-purse">
						<dt>{m.vault_purse()}</dt>
						<dd>{purse(amount)}</dd>
					</dl>
				</article>
				<p class="facts-note">{m.results_update()}</p>

				<h2 id="performance-fee" class="take-title">{m.performance_fee()}</h2>
				<p class="facts-note">{m.performance_fee_lead()}</p>
				<dl class="take-conditions">
					<div>
						<dt>{m.performance_fee_rate_label()}</dt>
						<dd>{m.performance_fee_rate()}</dd>
					</div>
					<div>
						<dt>{m.performance_fee_mark_label()}</dt>
						<dd>{m.performance_fee_mark()}</dd>
					</div>
					<div>
						<dt>{m.performance_fee_profit_label()}</dt>
						<dd>{m.performance_fee_profit()}</dd>
					</div>
					<div>
						<dt>{m.performance_fee_pay_label()}</dt>
						<dd>{m.performance_fee_pay()}</dd>
					</div>
				</dl>
				<p class="facts-note">{m.performance_fee_choose()}</p>
			</section>

			<section class="papers {botMarket.toLowerCase()}">
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
							<dt>{m.vault_purse()}</dt>
							<dd>{purse(amount)}</dd>
						</dl>
						<p class="wallet-msg">{m.receipt_line({ name: displayName })}</p>
						<p class="field-note">{m.receipt_creator({ address: shortAddress(receiptCreator) })}</p>
						<p class="field-note">
							{m.receipt_bot_wallet({ address: shortAddress(receiptOperator) })}
						</p>
						{#if enteredId}
							<VaultAddress address={enteredId} />
						{/if}
						<a class="see-card" href="{resolve(localizeHref('/') as Pathname)}?horse={enteredId}">
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
								oninput={() => {
									submitted = false;
									if (!busy) phase = 'idle';
								}}
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
										if (!busy) phase = 'idle';
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
										if (!busy) phase = 'idle';
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
								oninput={() => {
									submitted = false;
									if (!busy) phase = 'idle';
								}}
							/>
							<span class="count"
								>{m.chars_count({ count: strategy.length, max: STRATEGY_MAX })}</span
							>
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
										if (!busy) phase = 'idle';
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
										if (!busy) phase = 'idle';
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
										oninput={() => {
											submitted = false;
											if (!busy) phase = 'idle';
										}}
									/>
								</label>
							{/if}
						</fieldset>

						<div class="amount">
							<div class="amount-head">
								<label for="purse">{m.opening_purse_label()}</label>
								<p class="amount-balance">{balanceLabel}</p>
							</div>
							<input
								id="purse"
								name="purse"
								type="number"
								min="0"
								step="any"
								inputmode="decimal"
								autocomplete="off"
								bind:value={amountRaw}
								oninput={() => {
									submitted = false;
									if (!busy) phase = 'idle';
								}}
							/>
						</div>
						<div class="chips">
							<button type="button" onclick={() => addAmount(10)}>{m.add_ten()}</button>
							<button type="button" onclick={() => addAmount(50)}>{m.add_fifty()}</button>
							<button type="button" onclick={() => addAmount(100)}>{m.add_hundred()}</button>
							<button type="button" onclick={() => addAmount(250)}>{m.add_two_fifty()}</button>
							<button type="button" onclick={() => addAmount(500)}>{m.add_five_hundred()}</button>
							<button type="button" disabled={!canMax} onclick={setMaxPurse}
								>{m.amount_max()}</button
							>
						</div>

						<div class="papers-foot">
							<a class="how-link" href="#performance-fee">{m.how_it_works()}</a>
							<button class="stamp" type="submit" disabled={busy}>
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
					{:else if submitted && formError() === 'operator'}
						<p class="form-note">{m.need_valid_operator()}</p>
					{:else if submitted && formError() === 'purse'}
						<p class="form-note">{m.need_purse()}</p>
					{:else if submitted && formError() === 'purse_over'}
						<p class="form-note">{m.need_purse_balance()}</p>
					{:else if submitted && !chainConfig.ok}
						<p class="form-note">{m.missing_asset_config()}</p>
					{:else if submitted && !wallet.connected}
						<p class="wallet-msg">{m.connect_to_open()}</p>
						<ConnectGate />
					{:else if phase === 'wrong_network' || (submitted && wallet.connected && !wallet.onProductChain)}
						<p class="wallet-msg">{m.wrong_network()}</p>
						<div class="chips">
							<button type="button" onclick={onSwitchNetwork}>{m.switch_network()}</button>
						</div>
					{:else if phase === 'approving'}
						<p class="wallet-msg">{m.open_vault_approving()}</p>
					{:else if phase === 'pending'}
						<p class="wallet-msg">{m.open_vault_pending()}</p>
					{:else if phase === 'rejected' && rejectedApprove}
						<p class="form-note">{m.rejected_approve()}</p>
					{:else if phase === 'rejected'}
						<p class="form-note">{m.rejected_tx()}</p>
					{:else if phase === 'reverted'}
						<p class="form-note">{m.open_vault_reverted()}</p>
					{:else if phase === 'rpc_error'}
						<p class="form-note">{m.open_vault_rpc()}</p>
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
