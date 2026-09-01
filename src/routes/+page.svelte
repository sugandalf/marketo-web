<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import Masthead from '$lib/landing/Masthead.svelte';
	import ConnectGate from '$lib/landing/ConnectGate.svelte';
	import { homepageRoster, heroById, type Hero } from '$lib/landing/heroes';
	import { loadEnteredHero } from '$lib/landing/entered';
	import { wallet } from '$lib/wallet/session.svelte';
	import './form.css';

	let entered = $state(loadEnteredHero());
	let selectedId = $state('');
	let amountRaw = $state('0.00');
	let depositIntent = $state(false);
	let booted = $state(false);

	const wanted = $derived(page.url.searchParams.get('horse'));
	const roster = $derived(homepageRoster(entered, wanted));
	const selected = $derived(
		roster.find((hero) => hero.id === selectedId) ?? roster[0] ?? null
	);
	const bench = $derived(selected ? roster.filter((hero) => hero.id !== selected.id) : roster);
	const amount = $derived(Number.parseFloat(amountRaw) || 0);
	const sharePct = $derived(
		selected && amount > 0 ? (amount / (selected.vaultUsdso + amount)) * 100 : 0
	);

	$effect(() => {
		if (booted) return;
		const extra = loadEnteredHero();
		entered = extra;
		const wanted = page.url.searchParams.get('horse');
		const card = homepageRoster(extra, wanted);
		if (wanted && (extra?.id === wanted || heroById(wanted))) {
			selectedId = wanted;
		} else if (extra) {
			selectedId = extra.id;
		} else if (card[0]) {
			selectedId = card[0].id;
		}
		booted = true;
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

	function fightDate(iso: string) {
		const [y, mo, d] = iso.split('-');
		return `${mo}-${d}-${y.slice(2)}`;
	}

	function addAmount(delta: number) {
		amountRaw = (amount + delta).toFixed(2);
		depositIntent = false;
	}

	function selectHero(hero: Hero) {
		selectedId = hero.id;
		depositIntent = false;
	}

	function onDeposit(event: SubmitEvent) {
		event.preventDefault();
		if (!selected || amount <= 0) return;
		depositIntent = true;
	}
</script>

<svelte:head>
	<title>{m.site_title()}</title>
</svelte:head>

<div class="sheet">
	<div class="card-face">
	<Masthead />

	{#if selected}
		<div class="fold">
			<article class="call" aria-live="polite">
				<div class="call-num">{selected.program}</div>
				<div class="silks {selected.market.toLowerCase()}">{selected.market}</div>
				<div class="call-id">
					<h1 class="call-name">{selected.name}</h1>
					<p class="pedigree">
						{selected.strategy
							? selected.strategy
							: m.pedigree({ window: selected.window, market: selected.market })}
					</p>
					<div class="pp">
						<div class="pp-head">
							<span>{m.past_performances()}</span>
							<span class="tag">{m.synthetic()}</span>
						</div>
						{#if selected.fights.length}
							{#each selected.fights as fight (fight.date + fight.market)}
								<div class="pp-row">
									<span>{fightDate(fight.date)}</span>
									<span>{fight.window}</span>
									<span>{m.vs_market({ market: fight.market })}</span>
									<span>{fight.side === 'up' ? m.side_up() : m.side_down()}</span>
									<span class="pnl" class:loss={fight.pnlUsdso < 0}>{money(fight.pnlUsdso)}</span>
								</div>
							{/each}
						{:else}
							<p class="mini-empty">{m.no_fights_yet()}</p>
						{/if}
					</div>
				</div>
				<dl class="purse">
					<dt>{m.vault_purse()} <span class="tag">{m.synthetic()}</span></dt>
					<dd>{purse(selected.vaultUsdso)}</dd>
				</dl>
			</article>

			<aside class="slip">
				<h2>{m.back_this_horse()}</h2>
				<p class="slip-lead">{m.pick_hero_deposit()}</p>
				<div class="picked">
					<div class="silks {selected.market.toLowerCase()}">{selected.market}</div>
					<div>
						<strong>{selected.program} {selected.name}</strong>
						<div class="pedigree">
							{selected.strategy
								? selected.strategy
								: m.pedigree({ window: selected.window, market: selected.market })}
						</div>
					</div>
				</div>
				<form onsubmit={onDeposit}>
					<div class="amount">
						<label for="amount">{m.amount_label()}</label>
						<input
							id="amount"
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
					<dl class="strip-preview">
						<dt>{m.est_shares()} <span class="tag">{m.synthetic()}</span></dt>
						<dd>
							{sharePct.toFixed(2)}%
						</dd>
					</dl>
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
			</aside>
		</div>
	{:else}
		<div class="fold empty-fold">
			<p class="in-form-empty">
				{m.in_form_empty()}
				<a class="how-link" href={resolve(localizeHref('/program') as Pathname)}
					>{m.see_full_program()}</a>
			</p>
		</div>
	{/if}

	<div class="program">
		{#each bench as hero (hero.id)}
			<button
				class="entry"
				type="button"
				aria-label={m.select_hero({ name: hero.name })}
				onclick={() => selectHero(hero)}
			>
				<span class="entry-num">{hero.program}</span>
				<span class="silks {hero.market.toLowerCase()}">{hero.market}</span>
				<span>
					<span class="entry-name">{hero.name}</span>
					<span class="pedigree">
						{hero.strategy
							? hero.strategy
							: m.pedigree({ window: hero.window, market: hero.market })}
					</span>
					<span class="entry-pp">
						{#each hero.fights.slice(0, 3) as fight (fight.date + fight.market)}
							<span>
								{fightDate(fight.date)}
								{m.vs_market({ market: fight.market })}
								{fight.side === 'up' ? m.side_up() : m.side_down()}
								<span class="pnl" class:loss={fight.pnlUsdso < 0}>{money(fight.pnlUsdso)}</span>
							</span>
						{/each}
						{#if !hero.fights.length}
							<span>{m.no_fights_yet()}</span>
						{/if}
					</span>
				</span>
				<span class="entry-purse">
					{purse(hero.vaultUsdso)}
					{#if hero.fights[0]}
						<div class="pedigree">{m.last_fight()}: {m.vs_market({ market: hero.fights[0].market })}</div>
					{/if}
				</span>
			</button>
		{/each}
		<a class="entry full-card" href={resolve(localizeHref('/program') as Pathname)}>
			<span class="entry-name">{m.see_full_program()}</span>
		</a>
	</div>
	</div>

	<p class="colophon">{m.footer_line()}</p>
</div>

<div class="alts">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
